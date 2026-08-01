"use client";

import type { StatusFilter } from "../components/MarketStatusFilter";
import type { FormattedMarketGroup } from "@/features/market-groups/types";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { useOddMakiClient } from "@/lib/oddmaki/hooks";
import { getVenueId } from "@/config/venue.config";
import { queryKeys } from "@/lib/oddmaki/queryKeys";
import { fetchLeagueMatchGroupsFromUnifiedFeed } from "@/lib/markets/fetchMatchGroups";

/** Paginated league fetch with early stop after two upcoming kickoff rounds. */
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
      fetchLeagueMatchGroupsFromUnifiedFeed(
        client,
        venueId!,
        leagueSlug!,
        statusFilter,
      ),
    enabled: !!client && venueId !== undefined && leagueSlug != null,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  const groups = useMemo((): FormattedMarketGroup[] => data ?? [], [data]);

  return {
    groups,
    isLoading,
    error,
  };
}
