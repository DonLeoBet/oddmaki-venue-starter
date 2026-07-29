"use client";

import { useQuery } from "@tanstack/react-query";

import { useOddMakiClient } from "@/lib/oddmaki/hooks";
import { queryKeys } from "@/lib/oddmaki/queryKeys";

export interface OddsPoint {
  /** Unix seconds. */
  time: number;
  /** Each outcome's implied percent (0–100), index = outcome index. */
  pcts: number[];
}

/** Per-outcome implied-odds time series for a DPM market (oldest first). */
export function useDpmOddsSeries(marketId: string) {
  const client = useOddMakiClient();

  return useQuery({
    queryKey: [...queryKeys.dpmMarket.detail(BigInt(marketId)), "odds-series"],
    queryFn: async (): Promise<OddsPoint[]> => {
      const series = await client.public.getDpmOddsSeries({
        marketId: BigInt(marketId),
      });

      return series ?? [];
    },
    enabled: !!client && !!marketId,
    staleTime: 15_000,
    refetchInterval: 20_000,
  });
}
