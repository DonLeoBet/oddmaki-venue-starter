"use client";

import type { FormattedPriceMarketSeries } from "../types";

import { useQuery } from "@tanstack/react-query";

import { calculateMarketPrices } from "@/features/markets/utils/formatting";
import { useOddMakiClient } from "@/lib/oddmaki/hooks";

export type SeriesCurrentWindow = NonNullable<
  FormattedPriceMarketSeries["currentMarket"]
>;

/**
 * Derive the current live/next window for a set of price series.
 *
 * The subgraph no longer maintains a `currentMarket` pointer (it dragged
 * indexing), so the grid resolves it here in one bounded query. Returns a map of
 * seriesId → window, formatted like the legacy `series.currentMarket`.
 */
export function useSeriesCurrentWindows(seriesIds: string[]) {
  const client = useOddMakiClient();
  const key = [...seriesIds].sort().join(",");

  return useQuery({
    queryKey: ["seriesCurrentWindows", key],
    queryFn: async (): Promise<Record<string, SeriesCurrentWindow>> => {
      if (seriesIds.length === 0) return {};

      const raw = await client.public.getSeriesCurrentWindows({ seriesIds });
      const out: Record<string, SeriesCurrentWindow> = {};

      for (const sid of Object.keys(raw)) {
        const m = raw[sid];
        const { yesPrice, noPrice } = calculateMarketPrices(m);

        out[sid] = {
          marketId: m.marketId,
          question: m.question ?? "",
          outcomes: m.outcomes ?? ["Up", "Down"],
          yesPrice,
          noPrice,
          metadataURI: m.metadataURI ?? null,
          openTime: m.priceMarket?.openTime ?? "0",
          closeTime: m.priceMarket?.closeTime ?? "0",
        };
      }

      return out;
    },
    enabled: !!client && seriesIds.length > 0,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
