"use client";

import type { StatusFilter } from "../components/MarketStatusFilter";
import type { FormattedMarketGroup } from "@/features/market-groups/types";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { useOddMakiClient } from "@/lib/oddmaki/hooks";
import { getVenueId } from "@/config/venue.config";
import { queryKeys } from "@/lib/oddmaki/queryKeys";
import { fetchAllMatchGroupsFromUnifiedFeed } from "@/lib/markets/fetchMatchGroups";
import { filterMatchGroupsForFeed } from "@/lib/markets/filterMatchGroups";

/** Full paginated fetch for a single league — avoids unified-feed pagination gaps. */
export function useLeagueMatchGroups(
  leagueSlug: string | null,
  statusFilter: StatusFilter,
) {
  const client = useOddMakiClient();
  const venueId = getVenueId();

  const { data, isLoading, error, isFetching } = useQuery({
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

  const groups = useMemo((): FormattedMarketGroup[] => {
    if (!data || !leagueSlug) return [];

    return filterMatchGroupsForFeed(data, {
      statusFilter,
      leagueSlug,
    });
  }, [data, leagueSlug, statusFilter]);

  return {
    groups,
    isLoading: isLoading || isFetching,
    error,
  };
}
