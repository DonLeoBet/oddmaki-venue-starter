"use client";

import type { DpmPositionSummary } from "../types";

import { useQuery } from "@tanstack/react-query";

import { useOddMakiClient } from "@/lib/oddmaki/hooks";
import { queryKeys } from "@/lib/oddmaki/queryKeys";

/**
 * All positions in a pool (top holders by shares). Refetches on an interval so
 * current-payout numbers tick as the pool moves. One query feeds both the
 * holders table and the connected user's current payout.
 */
export function useDpmPositions(marketId: string, first = 100) {
  const client = useOddMakiClient();

  return useQuery({
    queryKey: queryKeys.dpmMarket.positions(marketId),
    queryFn: async (): Promise<DpmPositionSummary[]> => {
      const rows = await client.public.getDpmPositions({
        marketId: BigInt(marketId),
        first,
      });

      return (rows ?? []) as DpmPositionSummary[];
    },
    enabled: !!client && !!marketId,
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
}
