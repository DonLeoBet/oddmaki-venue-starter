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
  kickoffUnixFromTags,
  limitMatchGroupsToUpcomingRounds,
} from "@/lib/markets/filterMatchGroups";

const FEED_PAGE_SIZE = 50;
/** Safety cap — ~40 pages of market groups for a single league fetch. */
const LEAGUE_FETCH_MAX_SKIP = FEED_PAGE_SIZE * 40;

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
  const formatted = client.public.formatMarketGroupForDisplay(raw) as RawGroupDisplay;

  return formatMarketGroup(formatted, raw);
}

/**
 * Paginate the unified feed and collect non-outright match groups.
 * Prefer {@link fetchHomepageMatchGroupsFromUnifiedFeed} for the homepage —
 * draining every page makes first paint very slow.
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

/** Max unified-feed pages for homepage (~200 groups) — enough for 24 live cards. */
const HOMEPAGE_MAX_PAGES = 4;

/**
 * Homepage: stop after a few pages once enough live-league Active matches exist.
 * Avoids scanning the entire venue feed before painting ~24 cards.
 */
export async function fetchHomepageMatchGroupsFromUnifiedFeed(
  client: OddMakiClient,
  venueId: bigint,
  targetCount: number,
): Promise<FormattedMarketGroup[]> {
  const byId = new Map<string, FormattedMarketGroup>();
  let skip = 0;

  for (let page = 0; page < HOMEPAGE_MAX_PAGES; page += 1) {
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

      const formatted = formatRawMatchGroup(client, raw);

      byId.set(formatted.groupId, formatted);
    }

    const live = filterMatchGroupsForFeed(Array.from(byId.values()), {
      statusFilter: "Active",
      liveLeaguesOnly: true,
    });

    if (live.length >= targetCount) break;
    if (batch.length < FEED_PAGE_SIZE) break;

    skip += FEED_PAGE_SIZE;
  }

  return Array.from(byId.values());
}

/**
 * League category pages: scan the unified feed (created-sorted) and stop paginating
 * once the earliest two kickoff rounds for the league are filled.
 */
export async function fetchLeagueMatchGroupsFromUnifiedFeed(
  client: OddMakiClient,
  venueId: bigint,
  leagueSlug: string,
  statusFilter: StatusFilter,
  maxRounds = 2,
): Promise<FormattedMarketGroup[]> {
  const byId = new Map<string, FormattedMarketGroup>();
  let skip = 0;
  let prevCappedCount = -1;
  let stablePages = 0;

  while (skip < LEAGUE_FETCH_MAX_SKIP) {
    const feedData = await client.public.getUnifiedMarketFeed({
      venueId,
      first: FEED_PAGE_SIZE,
      skip,
      sortBy: "created",
    });

    const batch = feedData?.marketGroups ?? [];
    let addedEarlierKickoff = false;

    const cappedMinBefore = minKickoffInGroups(
      limitMatchGroupsToUpcomingRounds(
        filterMatchGroupsForFeed(Array.from(byId.values()), {
          statusFilter,
          leagueSlug,
        }),
        maxRounds,
      ),
    );

    for (const raw of batch) {
      const tags = (raw.tags as string[] | undefined) ?? [];

      if (isOutrightGroup(tags)) continue;
      if (!groupMatchesLeagueSlug(tags, leagueSlug)) continue;

      const formatted = formatRawMatchGroup(client, raw);
      const kickoff = kickoffUnixFromTags(tags);
      const isNew = !byId.has(formatted.groupId);

      byId.set(formatted.groupId, formatted);

      if (
        isNew &&
        kickoff != null &&
        (cappedMinBefore == null || kickoff < cappedMinBefore)
      ) {
        addedEarlierKickoff = true;
      }
    }

    const filtered = filterMatchGroupsForFeed(Array.from(byId.values()), {
      statusFilter,
      leagueSlug,
    });
    const capped = limitMatchGroupsToUpcomingRounds(filtered, maxRounds);

    if (addedEarlierKickoff) {
      stablePages = 0;
      prevCappedCount = capped.length;
    } else if (capped.length === prevCappedCount && batch.length > 0) {
      stablePages += 1;

      if (stablePages >= 2 && capped.length > 0) break;
    } else {
      stablePages = 0;
      prevCappedCount = capped.length;
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

function minKickoffInGroups(groups: FormattedMarketGroup[]): number | null {
  let min: number | null = null;

  for (const group of groups) {
    const kickoff = kickoffUnixFromTags(group.tags);

    if (kickoff == null) continue;

    min = min == null ? kickoff : Math.min(min, kickoff);
  }

  return min;
}
