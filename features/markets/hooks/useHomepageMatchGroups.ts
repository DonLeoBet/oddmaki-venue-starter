"use client";

import type { StatusFilter } from "../components/MarketStatusFilter";

import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { isFeaturedMatch } from "../utils/featuredMatches";
import type { UnifiedFeedItem } from "../types";

import { useOddMakiClient } from "@/lib/oddmaki/hooks";
import { getVenueId } from "@/config/venue.config";
import { queryKeys } from "@/lib/oddmaki/queryKeys";
import {
  diversifyMatchGroupsByLeague,
  HOMEPAGE_PRIORITY_LEAGUES,
} from "@/lib/markets/diversifyMatchGroups";
import { fetchHomepageMatchGroupsFromUnifiedFeed } from "@/lib/markets/fetchMatchGroups";
import { filterMatchGroupsForFeed } from "@/lib/markets/filterMatchGroups";
import { parseLeagueSlugFromTags } from "@/config/leagues";
import type { FormattedMarketGroup } from "@/features/market-groups/types";
import { isMatchMarketsUiEnabled } from "@/config/matchMarkets.config";

const HOMEPAGE_MAX = 24;
const HOMEPAGE_FETCH_TARGET = 80;
const FEATURED_SLOTS = 6;
const MAX_PER_PRIORITY = 3;

/** Capped homepage feed — big leagues first, minor leagues at most one card. */
export function useHomepageMatchGroups(
  statusFilter: StatusFilter,
  enabled = true,
) {
  const client = useOddMakiClient();
  const venueId = getVenueId();
  const queryClient = useQueryClient();
  const queryKey = queryKeys.homepageMatchGroups.list(venueId?.toString());
  const matchesEnabled = isMatchMarketsUiEnabled();

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey,
    queryFn: () =>
      fetchHomepageMatchGroupsFromUnifiedFeed(
        client,
        venueId!,
        HOMEPAGE_FETCH_TARGET,
        (partial) => {
          queryClient.setQueryData<FormattedMarketGroup[]>(queryKey, partial);
        },
      ),
    enabled:
      enabled &&
      matchesEnabled &&
      !!client &&
      venueId !== undefined,
    staleTime: 60_000,
    refetchInterval: 120_000,
    placeholderData: (previous) => previous,
  });

  const groups = useMemo(() => {
    if (!data) return [];

    const live = filterMatchGroupsForFeed(data, {
      statusFilter,
      liveLeaguesOnly: true,
    });

    const prioritySet = new Set<string>(HOMEPAGE_PRIORITY_LEAGUES);
    const priorityHits = live.filter((group) => {
      const slug = parseLeagueSlugFromTags(group.tags ?? []);

      return slug != null && prioritySet.has(slug);
    }).length;

    // Don't paint Saudi/Austria-only flash while the catalog is still scanning
    // for Premier League / Eredivisie / etc.
    if (isFetching && priorityHits === 0) {
      return [];
    }

    const featured = live.filter((group) => {
      if (
        !isFeaturedMatch({
          type: "group",
          data: group,
        } satisfies UnifiedFeedItem)
      ) {
        return false;
      }

      const slug = parseLeagueSlugFromTags(group.tags ?? []);

      // Featured clubs only boost when they're in priority leagues
      return slug != null && prioritySet.has(slug);
    });

    const result: typeof live = [];
    const seen = new Set<string>();

    for (const group of featured.slice(0, FEATURED_SLOTS)) {
      result.push(group);
      seen.add(group.groupId);
    }

    const rest = diversifyMatchGroupsByLeague(
      live.filter((group) => !seen.has(group.groupId)),
      HOMEPAGE_MAX - result.length,
      MAX_PER_PRIORITY,
    );

    result.push(...rest);

    return result.slice(0, HOMEPAGE_MAX);
  }, [data, statusFilter, isFetching]);

  return {
    groups,
    isLoading: enabled && (isLoading || (isFetching && groups.length === 0)),
    isFetching: enabled && isFetching,
    error,
  };
}
