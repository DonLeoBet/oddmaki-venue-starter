import type { StatusFilter } from "@/features/markets/components/MarketStatusFilter";
import type { FormattedMarketGroup } from "@/features/market-groups/types";

import { LIVE_LEAGUE_SLUGS } from "@/config/liveLeagues";
import { isPublicMatchGroup } from "@/config/matchMarkets.config";
import { isKickoffOnOrAfterMinDate } from "@/lib/football/fixture-window";
import {
  groupMatchesLeagueSlug,
  isNewTaxonomyMatchGroup,
  isOutrightGroup,
  isRetiredBeatOnlyMatchGroup,
} from "@/lib/markets/marketFilters";

export function kickoffUnixFromTags(tags: string[] | undefined): number | null {
  const tag = tags?.find((entry) => entry.startsWith("kickoff-"));

  if (!tag) return null;

  const unix = Number(tag.slice("kickoff-".length));

  return Number.isFinite(unix) && unix > 0 ? unix : null;
}

/** Shared fixture-group filter for homepage and league category feeds. */
export function filterMatchGroupsForFeed(
  groups: FormattedMarketGroup[],
  options: {
    statusFilter: StatusFilter;
    leagueSlug?: string;
    liveLeaguesOnly?: boolean;
  },
): FormattedMarketGroup[] {
  return groups
    .filter((group) => {
      const tags = group.tags ?? [];

      if (isOutrightGroup(tags)) return false;
      if (!isNewTaxonomyMatchGroup(tags, group.outcomes)) return false;
      if (!isPublicMatchGroup(tags)) return false;
      if (isRetiredBeatOnlyMatchGroup(tags, group.outcomes ?? [])) return false;
      if (group.status !== options.statusFilter) return false;

      if (options.leagueSlug) {
        if (!groupMatchesLeagueSlug(tags, options.leagueSlug)) return false;
      } else if (options.liveLeaguesOnly) {
        const inLiveLeague = LIVE_LEAGUE_SLUGS.some((slug) =>
          groupMatchesLeagueSlug(tags, slug),
        );

        if (!inLiveLeague) return false;
      }

      const kickoff = kickoffUnixFromTags(tags);

      return kickoff == null || isKickoffOnOrAfterMinDate(kickoff);
    })
    .sort(
      (a, b) =>
        (kickoffUnixFromTags(a.tags) ?? Number.MAX_SAFE_INTEGER) -
        (kickoffUnixFromTags(b.tags) ?? Number.MAX_SAFE_INTEGER),
    );
}

export function groupMatchesAnyLiveLeague(tags: string[] | undefined): boolean {
  if (!tags?.length) return false;

  return LIVE_LEAGUE_SLUGS.some((slug) => groupMatchesLeagueSlug(tags, slug));
}

/** Fixtures in the same domestic round usually kick off within a few days. */
export const KICKOFF_ROUND_WINDOW_SEC = 4 * 24 * 60 * 60;

/**
 * Keep fixtures from at most `maxRounds` upcoming kickoff clusters.
 * Groups without a kickoff tag are kept only when they fall inside kept rounds.
 */
export function limitMatchGroupsToUpcomingRounds(
  groups: FormattedMarketGroup[],
  maxRounds: number,
): FormattedMarketGroup[] {
  if (maxRounds <= 0 || groups.length === 0) return [];

  const sorted = [...groups].sort(
    (a, b) =>
      (kickoffUnixFromTags(a.tags) ?? Number.MAX_SAFE_INTEGER) -
      (kickoffUnixFromTags(b.tags) ?? Number.MAX_SAFE_INTEGER),
  );

  const rounds: FormattedMarketGroup[][] = [];
  let currentRound: FormattedMarketGroup[] = [];
  let roundStartUnix: number | null = null;

  for (const group of sorted) {
    const kickoff = kickoffUnixFromTags(group.tags);

    if (kickoff == null) {
      if (rounds.length < maxRounds) {
        currentRound.push(group);
      }

      continue;
    }

    if (
      roundStartUnix == null ||
      kickoff - roundStartUnix > KICKOFF_ROUND_WINDOW_SEC
    ) {
      if (currentRound.length > 0) {
        rounds.push(currentRound);

        if (rounds.length >= maxRounds) break;
      }

      currentRound = [group];
      roundStartUnix = kickoff;
    } else {
      currentRound.push(group);
    }
  }

  if (currentRound.length > 0 && rounds.length < maxRounds) {
    rounds.push(currentRound);
  }

  return rounds.slice(0, maxRounds).flat();
}

export { LIVE_LEAGUE_SLUGS };
