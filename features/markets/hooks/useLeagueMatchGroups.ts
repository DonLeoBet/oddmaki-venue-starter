"use client";

import type { StatusFilter } from "../components/MarketStatusFilter";
import type { FormattedMarketGroup } from "@/features/market-groups/types";

import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useOddMakiClient } from "@/lib/oddmaki/hooks";
import { getVenueId } from "@/config/venue.config";
import { queryKeys } from "@/lib/oddmaki/queryKeys";
import { fetchLeagueMatchGroupsFromUnifiedFeed } from "@/lib/markets/fetchMatchGroups";
import { isMatchMarketsUiEnabled } from "@/config/matchMarkets.config";

/** League fetch streams partials so first matches paint without a hang/flicker. */
export function useLeagueMatchGroups(
  leagueSlug: string | null,
  statusFilter: StatusFilter,
) {
  const client = useOddMakiClient();
  const venueId = getVenueId();
  const queryClient = useQueryClient();
  const matchesEnabled = isMatchMarketsUiEnabled();
  const queryKey = queryKeys.leagueMatchGroups.list(
    venueId?.toString(),
    leagueSlug ?? undefined,
    statusFilter,
  );

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey,
    queryFn: () =>
      fetchLeagueMatchGroupsFromUnifiedFeed(
        client,
        venueId!,
        leagueSlug!,
        statusFilter,
        4,
        (partial) => {
          queryClient.setQueryData<FormattedMarketGroup[]>(queryKey, partial);
        },
      ),
    enabled:
      matchesEnabled &&
      !!client &&
      venueId !== undefined &&
      leagueSlug != null,
    staleTime: 60_000,
    refetchInterval: 120_000,
    placeholderData: (previous) => previous,
  });

  const groups = useMemo((): FormattedMarketGroup[] => {
    if (!matchesEnabled) return [];

    return data ?? [];
  }, [data, matchesEnabled]);

  return {
    groups,
    isLoading: isLoading && groups.length === 0,
    isFetching,
    error,
  };
}
