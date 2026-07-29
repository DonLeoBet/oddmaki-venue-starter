"use client";

import { useQuery } from "@tanstack/react-query";

import { useOddMakiClient } from "@/lib/oddmaki/hooks";
import { queryKeys } from "@/lib/oddmaki/queryKeys";
import { getVenueId } from "@/config/venue.config";

export function useTraderTrades(address: string) {
  const client = useOddMakiClient();
  const venueId = getVenueId();

  return useQuery({
    queryKey: queryKeys.trader.trades(address, venueId?.toString()),
    queryFn: async () => {
      const result = await client.public.getTraderVenueTrades({
        trader: address,
        venueId: venueId!,
      });

      return result.fills ?? [];
    },
    enabled: !!address && venueId !== undefined,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}
