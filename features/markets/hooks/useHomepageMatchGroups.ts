"use client";

import type { StatusFilter } from "../components/MarketStatusFilter";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { isFeaturedMatch } from "../utils/featuredMatches";
import type { UnifiedFeedItem } from "../types";

import { useOddMakiClient } from "@/lib/oddmaki/hooks";
import { getVenueId } from "@/config/venue.config";
import { queryKeys } from "@/lib/oddmaki/queryKeys";
import { fetchHomepageMatchGroupsFromUnifiedFeed } from "@/lib/markets/fetchMatchGroups";
import { filterMatchGroupsForFeed } from "@/lib/markets/filterMatchGroups";

const HOMEPAGE_MAX = 24;
/** Fetch a bit more than we show so featured picks still have room. */
const HOMEPAGE_FETCH_TARGET = 40;

/** Capped feed fetch for homepage — does not drain every market on the venue. */
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

    const result = featured.length > 0 ? featured : live;

    return result.slice(0, HOMEPAGE_MAX);
  }, [data, statusFilter]);

  return { groups, isLoading: enabled && isLoading, error };
}
