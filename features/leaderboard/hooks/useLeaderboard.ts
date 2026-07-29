"use client";

import { useQuery } from "@tanstack/react-query";

import { useOddMakiClient } from "@/lib/oddmaki/hooks";
import { queryKeys } from "@/lib/oddmaki/queryKeys";
import { getVenueId } from "@/config/venue.config";

export type LeaderboardSortField =
  | "totalVolume"
  | "totalRealizedPnL"
  | "totalTradeCount";

export function useLeaderboard(
  orderBy: LeaderboardSortField = "totalVolume",
  first: number = 50,
) {
  const client = useOddMakiClient();
  const venueId = getVenueId();

  return useQuery({
    queryKey: queryKeys.leaderboard.venue(venueId?.toString(), orderBy),
    queryFn: async () => {
      const result = await client.public.getVenueLeaderboard({
        venueId: venueId!,
        orderBy,
        orderDirection: "desc",
        first,
      });

      return result.userVenueStats ?? [];
    },
    enabled: venueId !== undefined,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
