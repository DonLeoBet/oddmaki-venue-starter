"use client";

import type { StatusFilter } from "../components/MarketStatusFilter";
import type { FormattedMarketGroup } from "@/features/market-groups/types";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { useOddMakiClient } from "@/lib/oddmaki/hooks";
import { getVenueId } from "@/config/venue.config";
import { queryKeys } from "@/lib/oddmaki/queryKeys";
import { fetchAllMatchGroupsFromUnifiedFeed } from "@/lib/markets/fetchMatchGroups";
import { isKickoffOnOrAfterMinDate } from "@/lib/football/fixture-window";
import {
  groupMatchesLeagueSlug,
  isNewTaxonomyMatchGroup,
  isOutrightGroup,
  isRetiredBeatOnlyMatchGroup,
} from "@/lib/markets/marketFilters";
import { isPublicMatchGroup } from "@/config/matchMarkets.config";

function kickoffFromTags(tags: string[] | undefined): number | null {
  const tag = tags?.find((entry) => entry.startsWith("kickoff-"));

  if (!tag) return null;

  const unix = Number(tag.slice("kickoff-".length));

  return Number.isFinite(unix) && unix > 0 ? unix : null;
}

function filterLeagueGroups(
  groups: FormattedMarketGroup[],
  leagueSlug: string,
  statusFilter: StatusFilter,
): FormattedMarketGroup[] {
  return groups
    .filter((group) => {
      const tags = group.tags ?? [];

      if (isOutrightGroup(tags)) return false;
      if (!groupMatchesLeagueSlug(tags, leagueSlug)) return false;
      if (!isNewTaxonomyMatchGroup(tags, group.outcomes)) return false;
      if (!isPublicMatchGroup(tags)) return false;
      if (isRetiredBeatOnlyMatchGroup(tags, group.outcomes ?? [])) return false;
      if (group.status !== statusFilter) return false;

      const kickoff = kickoffFromTags(tags);

      return kickoff == null || isKickoffOnOrAfterMinDate(kickoff);
    })
    .sort(
      (a, b) =>
        (kickoffFromTags(a.tags) ?? Number.MAX_SAFE_INTEGER) -
        (kickoffFromTags(b.tags) ?? Number.MAX_SAFE_INTEGER),
    );
}

/** Full paginated fetch for a single league — avoids unified-feed pagination gaps. */
export function useLeagueMatchGroups(
  leagueSlug: string | null,
  statusFilter: StatusFilter,
) {
  const client = useOddMakiClient();
  const venueId = getVenueId();

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.leagueMatchGroups.list(
      venueId?.toString(),
      leagueSlug ?? undefined,
      statusFilter,
    ),
    queryFn: () =>
      fetchAllMatchGroupsFromUnifiedFeed(client, venueId!, "volume"),
    enabled: !!client && venueId !== undefined && leagueSlug != null,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const groups = useMemo(() => {
    if (!data || !leagueSlug) return [] as FormattedMarketGroup[];

    return filterLeagueGroups(data, leagueSlug, statusFilter);
  }, [data, leagueSlug, statusFilter]);

  return { groups, isLoading, error };
}
