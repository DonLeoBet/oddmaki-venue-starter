"use client";

import type { CategoryMarketRow } from "../utils/categoryMarkets";
import { filterGroupForCategory } from "../utils/categoryMarkets";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import type { MarketTypeId } from "@/config/marketTypes";
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

  const rows = useMemo(() => {
    if (!data) return [] as CategoryMarketRow[];

    return data
      .map((group) => filterGroupForCategory(group, leagueSlug, marketType))
      .filter((row): row is CategoryMarketRow => row !== null)
      .sort((a, b) => a.kickoffUnix - b.kickoffUnix);
  }, [data, leagueSlug, marketType]);

  return {
    rows,
    isLoading,
    error,
    fetchNextPage: undefined,
    hasNextPage: false,
    isFetchingNextPage: false,
  };
}
