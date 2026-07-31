"use client";

import type { UnifiedFeedItem } from "../types";

import { useInfiniteQuery } from "@tanstack/react-query";

import { formatMarketGroup, formatStandaloneMarket } from "../utils/formatMarketGroup";
import { sortUnifiedFeedItems } from "../utils/kickoffSort";

import { useOddMakiClient } from "@/lib/oddmaki/hooks";
import { getVenueId } from "@/config/venue.config";
import { queryKeys } from "@/lib/oddmaki/queryKeys";
import { formatPriceMarketSeries } from "@/features/price-market-series";

export const UNIFIED_FEED_PAGE_SIZE = 50;

type UnifiedFeedPage = {
  items: UnifiedFeedItem[];
  hasMore: boolean;
};

export function useUnifiedFeed(sortBy: "created" | "volume" = "created") {
  const client = useOddMakiClient();
  const venueId = getVenueId();

  return useInfiniteQuery({
    queryKey: queryKeys.unifiedFeed.list(venueId?.toString(), sortBy),
    initialPageParam: 0,
    queryFn: async ({ pageParam }): Promise<UnifiedFeedPage> => {
      const feedData = await client.public.getUnifiedMarketFeed({
        venueId,
        first: UNIFIED_FEED_PAGE_SIZE,
        skip: pageParam,
        sortBy,
      });

      const merged = client.public.mergeAndSortFeed(feedData, sortBy);

      const items = sortUnifiedFeedItems(
        merged.map((item: any): UnifiedFeedItem => {
          if (item.type === "standalone") {
            return { type: "standalone", data: formatStandaloneMarket(item) };
          } else if (item.type === "series") {
            return { type: "series", data: formatPriceMarketSeries(item) };
          } else {
            const formatted = client.public.formatMarketGroupForDisplay(item);

            return { type: "group", data: formatMarketGroup(formatted, item) };
          }
        }),
        sortBy,
      );

      // SDK fetches up to `first` of each kind. If any bucket came back
      // full, there is likely another page.
      const standaloneCount = feedData?.standaloneMarkets?.length ?? 0;
      const groupCount = feedData?.marketGroups?.length ?? 0;
      const seriesCount = feedData?.priceMarketSeries?.length ?? 0;
      const hasMore =
        standaloneCount >= UNIFIED_FEED_PAGE_SIZE ||
        groupCount >= UNIFIED_FEED_PAGE_SIZE ||
        seriesCount >= UNIFIED_FEED_PAGE_SIZE;

      return { items, hasMore };
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.hasMore ? allPages.length * UNIFIED_FEED_PAGE_SIZE : undefined,
    enabled: !!client && venueId !== undefined,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
