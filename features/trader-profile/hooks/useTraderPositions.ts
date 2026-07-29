"use client";

import { useQuery } from "@tanstack/react-query";

import { useOddMakiClient } from "@/lib/oddmaki/hooks";
import { queryKeys } from "@/lib/oddmaki/queryKeys";
import { getVenueId } from "@/config/venue.config";

export function useTraderPositions(address: string) {
  const client = useOddMakiClient();
  const venueId = getVenueId();

  return useQuery({
    queryKey: queryKeys.trader.positions(address, venueId?.toString()),
    queryFn: async () => {
      const result = await client.public.getTraderVenuePositions({
        trader: address,
        venueId: venueId!,
      });

      return result.traderPositions ?? [];
    },
    enabled: !!address && venueId !== undefined,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

export function useTraderClosedPositions(address: string) {
  const client = useOddMakiClient();
  const venueId = getVenueId();

  return useQuery({
    queryKey: queryKeys.trader.closedPositions(address, venueId?.toString()),
    queryFn: async () => {
      const result = await client.public.getTraderVenueClosedPositions({
        trader: address,
        venueId: venueId!,
      });

      return result.traderPositions ?? [];
    },
    enabled: !!address && venueId !== undefined,
    staleTime: 30_000,
  });
}
