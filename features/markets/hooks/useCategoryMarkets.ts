"use client";

import type { MarketTypeId } from "@/config/marketTypes";
import { filterGroupForCategory } from "../utils/categoryMarkets";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { useOddMakiClient } from "@/lib/oddmaki/hooks";
import { getVenueId } from "@/config/venue.config";
import { queryKeys } from "@/lib/oddmaki/queryKeys";
import type { FormattedMarketGroup } from "@/features/market-groups/types";
import { fetchAllMatchGroupsFromUnifiedFeed } from "@/lib/markets/fetchMatchGroups";

export function useCategoryMarkets(
  leagueSlug: string,
  marketType: MarketTypeId,
) {
  const client = useOddMakiClient();
  const venueId = getVenueId();

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.categoryMarkets.list(
      venueId?.toString(),
      leagueSlug,
      marketType,
    ),
    queryFn: () =>
      fetchAllMatchGroupsFromUnifiedFeed(client, venueId!, "volume"),
    enabled: !!client && venueId !== undefined,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const groups = useMemo(() => {
    if (!data) return [] as FormattedMarketGroup[];

    return data
      .filter(
        (group) => filterGroupForCategory(group, leagueSlug, marketType) !== null,
      )
      .sort((a, b) => {
        const kickoff = (tags: string[] | undefined) => {
          const tag = tags?.find((entry) => entry.startsWith("kickoff-"));

          return tag ? Number(tag.slice(8)) : 0;
        };

        return kickoff(a.tags) - kickoff(b.tags);
      });
  }, [data, leagueSlug, marketType]);

  return {
    groups,
    isLoading,
    error,
    fetchNextPage: undefined,
    hasNextPage: false,
    isFetchingNextPage: false,
  };
}
