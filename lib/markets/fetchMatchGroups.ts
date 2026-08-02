import type { OddMakiClient } from "@oddmaki-protocol/sdk";

import type { StatusFilter } from "@/features/markets/components/MarketStatusFilter";
import type { FormattedMarketGroup } from "@/features/market-groups/types";
import { formatMarketGroup } from "@/features/markets/utils/formatMarketGroup";
import {
  groupMatchesLeagueSlug,
  isOutrightGroup,
} from "@/lib/markets/marketFilters";
import {
  filterMatchGroupsForFeed,
  limitMatchGroupsToUpcomingRounds,
} from "@/lib/markets/filterMatchGroups";
import { HOMEPAGE_PRIORITY_LEAGUES } from "@/lib/markets/diversifyMatchGroups";

const FEED_PAGE_SIZE = 50;
/** League category scan depth — stop once we have a usable slate. */
const LEAGUE_MAX_PAGES = 24;
const LEAGUE_TARGET_GROUPS = 24;

type RawGroupDisplay = {
  groupId: string;
  marketQuestion: string;
  status: string;
  totalMarkets?: string;
  activeMarketCount?: string;
  resolvedMarketId?: string;
  createdAt?: string;
  outcomes?: Array<{
    marketId: string;
    name: string;
    question?: string;
    probability?: string;
    status: string;
    totalVolume?: string;
  }>;
};

function formatRawMatchGroup(
  client: OddMakiClient,
  raw: Record<string, unknown>,
): FormattedMarketGroup {
  const formatted = client.public.formatMarketGroupForDisplay(
    raw,
  ) as RawGroupDisplay;

  return formatMarketGroup(formatted, raw);
}

/**
 * Paginate the unified feed and collect non-outright match groups.
 * Prefer targeted homepage / league helpers for UI feeds.
 */
export async function fetchAllMatchGroupsFromUnifiedFeed(
  client: OddMakiClient,
  venueId: bigint,
  sortBy: "volume" | "created" = "volume",
): Promise<FormattedMarketGroup[]> {
  const byId = new Map<string, FormattedMarketGroup>();
  let skip = 0;

  while (true) {
    const feedData = await client.public.getUnifiedMarketFeed({
      venueId,
      first: FEED_PAGE_SIZE,
      skip,
      sortBy,
    });

    const batch = feedData?.marketGroups ?? [];

    for (const raw of batch) {
      const tags = (raw.tags as string[] | undefined) ?? [];

      if (isOutrightGroup(tags)) continue;

      const formatted = formatRawMatchGroup(client, raw);

      byId.set(formatted.groupId, formatted);
    }

    if (batch.length < FEED_PAGE_SIZE) break;

    skip += FEED_PAGE_SIZE;
  }

  return Array.from(byId.values());
}

/**
 * Shallow scan for one league — stops as soon as we have enough matches.
 */
async function fetchLeagueMatchGroupsShallow(
  client: OddMakiClient,
  venueId: bigint,
  leagueSlug: string,
  statusFilter: StatusFilter,
  options: { maxPages: number; maxGroups: number },
): Promise<FormattedMarketGroup[]> {
  const byId = new Map<string, FormattedMarketGroup>();
  let skip = 0;

  for (let page = 0; page < options.maxPages; page += 1) {
    const feedData = await client.public.getUnifiedMarketFeed({
      venueId,
      first: FEED_PAGE_SIZE,
      skip,
      sortBy: "created",
    });

    const batch = feedData?.marketGroups ?? [];

    for (const raw of batch) {
      const tags = (raw.tags as string[] | undefined) ?? [];

      if (isOutrightGroup(tags)) continue;
      if (!groupMatchesLeagueSlug(tags, leagueSlug)) continue;

      const formatted = formatRawMatchGroup(client, raw);

      byId.set(formatted.groupId, formatted);
    }

    const filtered = filterMatchGroupsForFeed(Array.from(byId.values()), {
      statusFilter,
      leagueSlug,
    });

    if (filtered.length >= options.maxGroups) {
      return filtered.slice(0, options.maxGroups);
    }

    if (batch.length < FEED_PAGE_SIZE) break;

    skip += FEED_PAGE_SIZE;
  }

  return filterMatchGroupsForFeed(Array.from(byId.values()), {
    statusFilter,
    leagueSlug,
  }).slice(0, options.maxGroups);
}

/**
 * Homepage: pull a few upcoming matches from each big league in parallel
 * so Saudi/Austria imports can't own the grid.
 */
export async function fetchHomepageMatchGroupsFromUnifiedFeed(
  client: OddMakiClient,
  venueId: bigint,
  _targetCount: number,
): Promise<FormattedMarketGroup[]> {
  const slugs = HOMEPAGE_PRIORITY_LEAGUES.slice(0, 8);

  const batches = await Promise.all(
    slugs.map((slug) =>
      fetchLeagueMatchGroupsShallow(client, venueId, slug, "Active", {
        maxPages: 14,
        maxGroups: 4,
      }),
    ),
  );

  const byId = new Map<string, FormattedMarketGroup>();

  for (const batch of batches) {
    for (const group of batch) {
      byId.set(group.groupId, group);
    }
  }

  return Array.from(byId.values());
}

/**
 * League category pages: one server-side scan, stop when slate is full.
 * Avoids client infinite-paging flicker.
 */
export async function fetchLeagueMatchGroupsFromUnifiedFeed(
  client: OddMakiClient,
  venueId: bigint,
  leagueSlug: string,
  statusFilter: StatusFilter,
  maxRounds = 3,
): Promise<FormattedMarketGroup[]> {
  const byId = new Map<string, FormattedMarketGroup>();
  let skip = 0;

  for (let page = 0; page < LEAGUE_MAX_PAGES; page += 1) {
    const feedData = await client.public.getUnifiedMarketFeed({
      venueId,
      first: FEED_PAGE_SIZE,
      skip,
      sortBy: "created",
    });

    const batch = feedData?.marketGroups ?? [];

    for (const raw of batch) {
      const tags = (raw.tags as string[] | undefined) ?? [];

      if (isOutrightGroup(tags)) continue;
      if (!groupMatchesLeagueSlug(tags, leagueSlug)) continue;

      const formatted = formatRawMatchGroup(client, raw);

      byId.set(formatted.groupId, formatted);
    }

    const filtered = filterMatchGroupsForFeed(Array.from(byId.values()), {
      statusFilter,
      leagueSlug,
    });

    if (filtered.length >= LEAGUE_TARGET_GROUPS) {
      return limitMatchGroupsToUpcomingRounds(filtered, maxRounds);
    }

    if (batch.length < FEED_PAGE_SIZE) break;

    skip += FEED_PAGE_SIZE;
  }

  const filtered = filterMatchGroupsForFeed(Array.from(byId.values()), {
    statusFilter,
    leagueSlug,
  });

  return limitMatchGroupsToUpcomingRounds(filtered, maxRounds);
}
