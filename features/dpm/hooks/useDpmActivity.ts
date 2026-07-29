"use client";

import type { DpmEntrySummary } from "../types";

import { useQuery } from "@tanstack/react-query";

import { useOddMakiClient } from "@/lib/oddmaki/hooks";
import { queryKeys } from "@/lib/oddmaki/queryKeys";

/** Recent pool entries for a DPM market (newest first) — the activity feed. */
export function useDpmActivity(marketId: string, first = 50) {
  const client = useOddMakiClient();

  return useQuery({
    queryKey: [...queryKeys.dpmMarket.detail(BigInt(marketId)), "activity"],
    queryFn: async (): Promise<DpmEntrySummary[]> => {
      const entries = await client.public.getDpmEntries({
        marketId: BigInt(marketId),
        first,
      });

      return (entries ?? []) as DpmEntrySummary[];
    },
    enabled: !!client && !!marketId,
    staleTime: 15_000,
    refetchInterval: 20_000,
  });
}
