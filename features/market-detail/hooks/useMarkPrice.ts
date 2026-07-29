"use client";

import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import { OrderBookFacetABI } from "@oddmaki-protocol/sdk";

import { DIAMOND_ADDRESS } from "@/lib/oddmaki/constants";

export interface MarkPrice {
  priceTick: bigint;
  isDefined: boolean;
  /** Decimal string ("0.48") when defined, otherwise null. */
  price: string | null;
}

/**
 * Reads the on-chain mark price for an outcome via OrderBookFacet.getMarkPrice.
 * This is the "% chance" / probability badge value — implied midpoint or
 * last-trade fallback, honest `(0, false)` when wide spread + no trades.
 *
 * NOTE: Mark price is NOT what gates market-order execution. The take
 * service anchors against the first-step crossable tick (which always
 * exists when the implied book has any takeable supply). Use
 * `useImpliedTopOfBook` for the trade-execution anchor; this hook is for
 * the informational badge.
 */
export function useMarkPrice(
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

  return useQuery<MarkPrice>({
    queryKey: ["markPrice", marketId, outcomeId],
    queryFn: async () => {
      const result = (await publicClient!.readContract({
        address: DIAMOND_ADDRESS,
        abi: OrderBookFacetABI,
        functionName: "getMarkPrice",
        args: [idBig!, BigInt(outcomeId)],
      })) as any;

      const priceTick = result[0] as bigint;
      const isDefined = result[1] as boolean;
      const price =
        isDefined && tickSizeBig > BigInt(0)
          ? (Number(priceTick * tickSizeBig) / 1e18).toFixed(2)
          : null;

      return { priceTick, isDefined, price };
    },
    enabled: !!publicClient && idBig != null && tickSizeBig > BigInt(0),
    staleTime: 5_000,
    refetchInterval: 10_000,
  });
}
