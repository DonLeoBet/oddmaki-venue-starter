"use client";

import { useQuery } from "@tanstack/react-query";

import { useOddMakiClient } from "@/lib/oddmaki/hooks";
import { queryKeys } from "@/lib/oddmaki/queryKeys";

export interface Trade {
  id: string;
  market: { marketId: string };
  outcome: string;
  tick: string;
  amount: string;
  cost: string;
  tradeType: string;
  buyTrader: { id: string } | null;
  sellTrader: { id: string } | null;
  avgPrice: string | null;
  timestamp: string;
  blockNumber: string;
  transactionHash: string;
}

/**
 * Subgraph workaround (subgraph v1.6.4+): `handleOrderFilled` creates a
 * ghost Trade entity for market-taker normal fills (taker side has
 * `orderId == 0` on-chain → Subgraph stores empty `buyTrader` /
 * `sellTrader` on the Trade row). The taker's canonical user-facing trade
 * already exists via the `MarketOrder` Trade entity from
 * `handleMarketOrderBuy` / `handleMarketOrderSell`. Filter the duplicates
 * client-side until the indexer-side gating can be re-applied without
 * stalling the indexer.
 *
 * A legitimate Trade entity always has:
 *   - tradeType === 'MarketOrder' → exactly ONE of (buyTrader, sellTrader)
 *   - tradeType === 'OrderFill' (matching-engine cross) → BOTH set
 *   - tradeType === 'MintFill' → buyTrader set (subgraph creates per maker)
 * The ghost we want to drop: tradeType === 'OrderFill' AND one of
 * (buyTrader, sellTrader) is null/empty — that's a market-taker normal fill
 * leaking through.
 */
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

function isEmptyTrader(t: { id: string } | null | undefined): boolean {
  if (!t) return true;
  const id = (t.id ?? "").toLowerCase();

  return id === "" || id === ZERO_ADDRESS;
}

function isGhostTrade(trade: Trade): boolean {
  // OrderFill ghost: market-taker normal fill leaks an empty-buyer or
  // empty-seller row (the canonical user-facing row is the MarketOrder Trade
  // from handleMarketOrderBuy/Sell).
  if (trade.tradeType === "OrderFill") {
    return isEmptyTrader(trade.buyTrader) || isEmptyTrader(trade.sellTrader);
  }
  // MintFill ghost: market-taker mint leaks a buyer-less row (the canonical
  // user-facing row is again the MarketOrder Trade). Legit MintFill rows
  // come from matching-engine crosses and always have buyTrader set.
  if (trade.tradeType === "MintFill") {
    return isEmptyTrader(trade.buyTrader);
  }

  return false;
}

/**
 * Hook to fetch recent trade history for a market.
 */
export function useTradeHistory(marketId: string) {
  const client = useOddMakiClient();

  return useQuery<Trade[]>({
    queryKey: queryKeys.trades.byMarket(marketId),
    queryFn: async () => {
      const result = (await client.public.getTradeHistory({
        marketId: BigInt(marketId),
        first: 50,
      })) as any;

      const trades: Trade[] = result.trades || [];

      return trades.filter((t) => !isGhostTrade(t));
    },
    enabled: !!marketId,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}
