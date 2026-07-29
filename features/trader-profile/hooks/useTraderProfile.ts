"use client";

import { useQuery } from "@tanstack/react-query";

import { useOddMakiClient } from "@/lib/oddmaki/hooks";
import { queryKeys } from "@/lib/oddmaki/queryKeys";
import { getVenueId } from "@/config/venue.config";

export function useTraderProfile(address: string) {
  const client = useOddMakiClient();
  const venueId = getVenueId();

  return useQuery({
    queryKey: queryKeys.trader.profile(address, venueId?.toString()),
    queryFn: async () => {
      const result = await client.public.getTraderVenueProfile({
        trader: address,
        venueId: venueId!,
      });

      return result.userVenueStat ?? null;
    },
    enabled: !!address && venueId !== undefined,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
