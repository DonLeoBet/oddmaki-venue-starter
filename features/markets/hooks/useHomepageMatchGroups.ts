"use client";

import type { StatusFilter } from "../components/MarketStatusFilter";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { isFeaturedMatch } from "../utils/featuredMatches";
import type { UnifiedFeedItem } from "../types";

import { useOddMakiClient } from "@/lib/oddmaki/hooks";
import { getVenueId } from "@/config/venue.config";
import { queryKeys } from "@/lib/oddmaki/queryKeys";
import { diversifyMatchGroupsByLeague } from "@/lib/markets/diversifyMatchGroups";
import { fetchHomepageMatchGroupsFromUnifiedFeed } from "@/lib/markets/fetchMatchGroups";
import { filterMatchGroupsForFeed } from "@/lib/markets/filterMatchGroups";

const HOMEPAGE_MAX = 24;
const HOMEPAGE_FETCH_TARGET = 60;
const FEATURED_SLOTS = 8;
const MAX_PER_LEAGUE = 3;

/** Capped + diversified homepage feed — mix of leagues, not one import flood. */
export function useHomepageMatchGroups(
  statusFilter: StatusFilter,
  enabled = true,
) {
  const client = useOddMakiClient();
  const venueId = getVenueId();

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.homepageMatchGroups.list(venueId?.toString()),
    queryFn: () =>
      fetchHomepageMatchGroupsFromUnifiedFeed(
        client,
        venueId!,
        HOMEPAGE_FETCH_TARGET,
      ),
    enabled: enabled && !!client && venueId !== undefined,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  const groups = useMemo(() => {
    if (!data) return [];

    const live = filterMatchGroupsForFeed(data, {
      statusFilter,
      liveLeaguesOnly: true,
    });

    const featured = live.filter((group) =>
      isFeaturedMatch({
        type: "group",
        data: group,
      } satisfies UnifiedFeedItem),
    );

    const result: typeof live = [];
    const seen = new Set<string>();

    for (const group of featured.slice(0, FEATURED_SLOTS)) {
      result.push(group);
      seen.add(group.groupId);
    }

    const rest = diversifyMatchGroupsByLeague(
      live.filter((group) => !seen.has(group.groupId)),
      HOMEPAGE_MAX - result.length,
      MAX_PER_LEAGUE,
    );

    result.push(...rest);

    return result.slice(0, HOMEPAGE_MAX);
  }, [data, statusFilter]);

  return { groups, isLoading: enabled && isLoading, error };
}
