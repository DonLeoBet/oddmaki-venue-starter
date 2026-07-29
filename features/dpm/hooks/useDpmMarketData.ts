"use client";

import type { DpmMarketDataResult, DpmMarketSummary } from "../types";

import { useQuery } from "@tanstack/react-query";

import { useOddMakiClient } from "@/lib/oddmaki/hooks";
import { queryKeys } from "@/lib/oddmaki/queryKeys";

/**
 * Fetch DPM ("Pool") market data for a given market.
 *
 * Mirrors `usePriceMarketData`: returns a discriminated union so callers can
 * branch on `isDpmMarket`. `getDpmMarket` returns `null` for non-DPM markets.
 */
export function useDpmMarketData(marketId: bigint) {
  const client = useOddMakiClient();

  return useQuery<DpmMarketDataResult>({
    queryKey: queryKeys.dpmMarket.detail(marketId),
    queryFn: async () => {
      const data = (await client.public.getDpmMarket(
        marketId,
      )) as DpmMarketSummary | null;

      if (!data) {
        return { isDpmMarket: false as const, data: null };
      }

      return { isDpmMarket: true as const, data };
    },
    staleTime: 15_000,
    refetchInterval: 20_000,
  });
}
