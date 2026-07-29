"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import { useOddMakiClient } from "@/lib/oddmaki/hooks";
import { queryKeys } from "@/lib/oddmaki/queryKeys";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const PAGE_SIZE = 50;

interface RawTrade {
  id: string;
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

interface RawMergeFill {
  id: string;
  outcome: string;
  tick: string;
  amount: string;
  cost: string;
  trader: { id: string };
  timestamp: string;
  blockNumber: string;
  transactionHash: string;
}

interface ActivityCursor {
  /** Last received Trade timestamp; undefined means no more trades to fetch. */
  tradeBefore?: bigint;
  /** Last received MergeFill timestamp; undefined means no more merges to fetch. */
  fillBefore?: bigint;
}

export interface ActivityRow {
  /** Stable per-row key — derived from source id + side. Used for React keys AND cross-page dedup. */
  key: string;
  trader: string;
  side: "bought" | "sold";
  outcome: number;
  tick: string;
  amount: string;
  cost: string;
  timestamp: string;
  transactionHash: string;
  tradeType: string;
}

function isEmpty(addr: string | null | undefined): boolean {
  if (!addr) return true;
  const a = addr.toLowerCase();

  return a === "" || a === ZERO_ADDRESS;
}

/**
 * Expand a Trade entity into 0..2 activity rows.
 *
 * Each side of a Trade renders independently. Empty/null trader on a side
 * is a market-taker leak (taker's orderId is 0 in the fill event, so the
 * subgraph can't attribute that side). The taker's row lives in the sibling
 * `MarketOrder` Trade in the same tx — so we drop only the empty side, not
 * the whole Trade, to keep the maker's real activity visible.
 */
function flattenTrade(trade: RawTrade): ActivityRow[] {
  const outcome = parseInt(trade.outcome);
  const base = {
    outcome,
    tick: trade.tick,
    amount: trade.amount,
    cost: trade.cost,
    timestamp: trade.timestamp,
    transactionHash: trade.transactionHash,
    tradeType: trade.tradeType,
  };
  const rows: ActivityRow[] = [];

  if (trade.tradeType === "MarketOrder") {
    if (!isEmpty(trade.buyTrader?.id)) {
      rows.push({
        ...base,
        key: `${trade.id}:buy`,
        trader: trade.buyTrader!.id,
        side: "bought",
      });
    } else if (!isEmpty(trade.sellTrader?.id)) {
      rows.push({
        ...base,
        key: `${trade.id}:sell`,
        trader: trade.sellTrader!.id,
        side: "sold",
      });
    }

    return rows;
  }

  if (trade.tradeType === "OrderFill") {
    if (!isEmpty(trade.buyTrader?.id)) {
      rows.push({
        ...base,
        key: `${trade.id}:buy`,
        trader: trade.buyTrader!.id,
        side: "bought",
      });
    }
    if (!isEmpty(trade.sellTrader?.id)) {
      rows.push({
        ...base,
        key: `${trade.id}:sell`,
        trader: trade.sellTrader!.id,
        side: "sold",
      });
    }

    return rows;
  }

  if (trade.tradeType === "MintFill") {
    if (!isEmpty(trade.buyTrader?.id)) {
      rows.push({
        ...base,
        key: `${trade.id}:buy`,
        trader: trade.buyTrader!.id,
        side: "bought",
      });
    }

    return rows;
  }

  return rows;
}

/**
 * Flatten a MergeFill Fill entity into a `sold` activity row. Merges don't
 * write Trade entities (position exits, not market trades — see v1.7.0 fix),
 * but each merge produces two Fills (yes + no), both with real traders.
 */
function flattenMergeFill(fill: RawMergeFill): ActivityRow {
  return {
    key: `mergefill:${fill.id}`,
    trader: fill.trader.id,
    side: "sold",
    outcome: parseInt(fill.outcome),
    tick: fill.tick,
    amount: fill.amount,
    cost: fill.cost,
    timestamp: fill.timestamp,
    transactionHash: fill.transactionHash,
    tradeType: "MergeFill",
  };
}

/**
 * Unified, paginated market activity feed. One SDK call per page returns
 * both Trade and MergeFill rows interleaved. Two independent cursors keep
 * each underlying stream from over-skipping the other when their densities
 * differ (trades dense, merges sparse).
 *
 * Pagination model: the SDK uses `timestamp_lte` so boundary items at the
 * cursor timestamp aren't missed. The trade-off is at-most-one duplicated
 * row per page (the cursor item itself), which we dedupe by `key`.
 */
export function useMarketActivity(marketId: string) {
  const client = useOddMakiClient();

  const query = useInfiniteQuery({
    queryKey: queryKeys.activity.byMarket(marketId),
    initialPageParam: {} as ActivityCursor,
    queryFn: async ({ pageParam }) => {
      const result = (await client.public.getMarketActivity({
        marketId: BigInt(marketId),
        tradeBefore: pageParam.tradeBefore,
        fillBefore: pageParam.fillBefore,
        first: PAGE_SIZE,
      })) as { trades: RawTrade[]; mergeFills: RawMergeFill[] };

      const trades = result.trades ?? [];
      const fills = result.mergeFills ?? [];

      const rows = [
        ...trades.flatMap(flattenTrade),
        ...fills.map(flattenMergeFill),
      ];

      // Each stream's next cursor = timestamp of its own last item, or
      // undefined when the stream is exhausted (fewer than PAGE_SIZE returned).
      const lastTrade = trades[trades.length - 1];
      const lastFill = fills[fills.length - 1];
      const nextCursor: ActivityCursor = {
        tradeBefore:
          trades.length === PAGE_SIZE && lastTrade
            ? BigInt(lastTrade.timestamp)
            : undefined,
        fillBefore:
          fills.length === PAGE_SIZE && lastFill
            ? BigInt(lastFill.timestamp)
            : undefined,
      };

      return { rows, nextCursor };
    },
    getNextPageParam: (last) => {
      // Stop paging only when BOTH streams are exhausted.
      if (!last.nextCursor.tradeBefore && !last.nextCursor.fillBefore) {
        return undefined;
      }

      return last.nextCursor;
    },
    enabled: !!marketId,
    staleTime: 10_000,
    refetchInterval: 15_000,
  });

  // Accumulate, dedupe by key, sort by timestamp desc + key desc for stable order.
  const allRows = query.data?.pages.flatMap((p) => p.rows) ?? [];
  const seen = new Set<string>();
  const rows: ActivityRow[] = [];

  for (const row of allRows) {
    if (seen.has(row.key)) continue;
    seen.add(row.key);
    rows.push(row);
  }
  rows.sort((a, b) => {
    const dt = parseInt(b.timestamp) - parseInt(a.timestamp);

    if (dt !== 0) return dt;

    return b.key.localeCompare(a.key);
  });

  return {
    rows,
    isLoading: query.isLoading,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage ?? false,
    isFetchingNextPage: query.isFetchingNextPage,
  };
}
