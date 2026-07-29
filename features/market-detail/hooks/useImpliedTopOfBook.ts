"use client";

import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import { OrderBookFacetABI } from "@oddmaki-protocol/sdk";

import { DIAMOND_ADDRESS } from "@/lib/oddmaki/constants";

export interface ImpliedTopOfBook {
  /** Raw bid tick. Zero means no candidate exists on the bid side. */
  impliedBid: bigint;
  /** Raw ask tick. Zero means no candidate exists on the ask side. */
  impliedAsk: bigint;
  /** Decimal price string for the bid, or null when no candidate. */
  bidPrice: string | null;
  /** Decimal price string for the ask, or null when no candidate. */
  askPrice: string | null;
}

/**
 * Reads `OrderBookFacet.getImpliedTopOfBook` — the cross-outcome-aware
 * top of book that the take service evaluates against. The implied ask
 * is the cheapest takeable price for a BUY (either same-outcome ask or
 * mint complement of the opposite-outcome bid); the implied bid is the
 * richest payout for a SELL.
 *
 * This is what gates the Trade button in market mode — when the relevant
 * side is `> 0`, the take service will accept the order; when it's `0`,
 * there's no takeable liquidity and the contract would revert.
 */
export function useImpliedTopOfBook(
  marketId: string | undefined,
  outcomeId: number,
  tickSize: string | undefined,
) {
  const publicClient = usePublicClient();
  const idBig = marketId != null ? BigInt(marketId) : undefined;
  const tickSizeBig = (() => {
    try {
      return tickSize ? BigInt(tickSize) : BigInt(0);
    } catch {
      return BigInt(0);
    }
  })();

  return useQuery<ImpliedTopOfBook>({
    queryKey: ["impliedTopOfBook", marketId, outcomeId],
    queryFn: async () => {
      const result = (await publicClient!.readContract({
        address: DIAMOND_ADDRESS,
        abi: OrderBookFacetABI,
        functionName: "getImpliedTopOfBook",
        args: [idBig!, BigInt(outcomeId)],
      })) as any;

      const impliedBid = result[0] as bigint;
      const impliedAsk = result[1] as bigint;
      const fmt = (tick: bigint): string | null => {
        if (tick === BigInt(0) || tickSizeBig === BigInt(0)) return null;

        return (Number(tick * tickSizeBig) / 1e18).toFixed(2);
      };

      return {
        impliedBid,
        impliedAsk,
        bidPrice: fmt(impliedBid),
        askPrice: fmt(impliedAsk),
      };
    },
    enabled: !!publicClient && idBig != null && tickSizeBig > BigInt(0),
    staleTime: 5_000,
    refetchInterval: 10_000,
  });
}
