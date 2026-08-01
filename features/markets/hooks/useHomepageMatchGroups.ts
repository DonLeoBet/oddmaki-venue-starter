"use client";

import type { StatusFilter } from "../components/MarketStatusFilter";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { isFeaturedMatch } from "../utils/featuredMatches";
import type { UnifiedFeedItem } from "../types";

import { useOddMakiClient } from "@/lib/oddmaki/hooks";
import { getVenueId } from "@/config/venue.config";
import { queryKeys } from "@/lib/oddmaki/queryKeys";
import { fetchAllMatchGroupsFromUnifiedFeed } from "@/lib/markets/fetchMatchGroups";
import { filterMatchGroupsForFeed } from "@/lib/markets/filterMatchGroups";

const HOMEPAGE_MAX = 24;

/** Full feed fetch for homepage — avoids volume-sorted pagination flash. */
export function useHomepageMatchGroups(statusFilter: StatusFilter) {
  const client = useOddMakiClient();
  const venueId = getVenueId();

  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: queryKeys.homepageMatchGroups.list(
      venueId?.toString(),
      statusFilter,
    ),
    queryFn: () =>
      fetchAllMatchGroupsFromUnifiedFeed(client, venueId!, "volume"),
    enabled: !!client && venueId !== undefined,
    staleTime: 30_000,
    refetchInterval: 60_000,
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

    const result = featured.length > 0 ? featured : live;

    return result.slice(0, HOMEPAGE_MAX);
  }, [data, statusFilter]);

  return { groups, isLoading: isLoading || isFetching, error };
}
