"use client";

import type { UnifiedFeedItem } from "../types";

import { useEffect, useMemo } from "react";

import { useUnifiedFeed } from "../hooks/useUnifiedFeed";
import { isLongTermMarket } from "../utils/discovery";

import { MarketCard } from "./MarketCard";
import { MarketSkeleton } from "./MarketSkeleton";
import { EmptyState } from "./EmptyState";

import { MarketGroupCard } from "@/features/market-groups/components/MarketGroupCard";
import {
  PriceSeriesCard,
  useSeriesCurrentWindows,
} from "@/features/price-market-series";

const MAX_TRENDING = 10;
const MAX_FEATURED = 6;
const MAX_RECENT = 10;

function MarketItem({
  item,
  currentWindow,
}: {
  item: UnifiedFeedItem;
  currentWindow?: any;
}) {
  if (item.type === "standalone") {
    return (
      <MarketCard
        key={`m-${item.data.marketId}`}
        isDpm={item.data.isDpmMarket ?? false}
        market={item.data}
      />
    );
  }

  if (item.type === "series") {
    return (
      <PriceSeriesCard
        key={`s-${item.data.id}`}
        currentWindow={currentWindow}
        series={item.data}
      />
    );
  }

  return <MarketGroupCard key={`g-${item.data.groupId}`} group={item.data} />;
}

function Section({
  title,
  items,
  currentWindows,
}: {
  title: string;
  items: UnifiedFeedItem[];
  currentWindows?: Record<string, any>;
}) {
  if (items.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((item) => (
          <MarketItem
            key={`${item.type}-${item.type === "standalone" ? item.data.marketId : item.type === "series" ? item.data.id : item.data.groupId}`}
            currentWindow={
              item.type === "series"
                ? currentWindows?.[item.data.id]
                : undefined
            }
            item={item}
          />
        ))}
      </div>
    </section>
  );
}

export function HomeMarketFeed() {
  const {
    data: trendingData,
    isLoading: trendingLoading,
    error: trendingError,
  } = useUnifiedFeed("volume", 50);
  const {
    data: recentData,
    isLoading: recentLoading,
    error: recentError,
    fetchNextPage: fetchRecentNextPage,
    hasNextPage: hasRecentNextPage,
    isFetchingNextPage: isFetchingRecentNextPage,
  } = useUnifiedFeed("created", 50);

  const trendingAll = useMemo(
    () => trendingData?.pages[0]?.items ?? [],
    [trendingData],
  );
  const recentAll = useMemo(
    () => recentData?.pages.flatMap((p) => p.items) ?? [],
    [recentData],
  );

  const trendingItems = useMemo(
    () => trendingAll.filter(isLongTermMarket).slice(0, MAX_TRENDING),
    [trendingAll],
  );

  const featuredItems = useMemo(
    () =>
      trendingAll
        .filter(
          (item): item is Extract<UnifiedFeedItem, { type: "group" }> =>
            item.type === "group" && isLongTermMarket(item),
        )
        .slice(0, MAX_FEATURED),
    [trendingAll],
  );

  const recentItems = useMemo(
    () => recentAll.filter(isLongTermMarket).slice(0, MAX_RECENT),
    [recentAll],
  );

  useEffect(() => {
    if (!recentData) return;
    if (recentItems.length >= MAX_RECENT) return;
    if (!hasRecentNextPage) return;
    if (isFetchingRecentNextPage) return;

    fetchRecentNextPage();
  }, [
    recentData,
    recentItems,
    fetchRecentNextPage,
    hasRecentNextPage,
    isFetchingRecentNextPage,
  ]);

  const seriesIds = useMemo(() => {
    const all = [
      ...trendingItems,
      ...featuredItems,
      ...recentItems,
    ];

    return all
      .filter(
        (item): item is Extract<UnifiedFeedItem, { type: "series" }> =>
          item.type === "series",
      )
      .map((item) => item.data.id);
  }, [trendingItems, featuredItems, recentItems]);

  const { data: seriesWindows } = useSeriesCurrentWindows(seriesIds);

  const isLoading = trendingLoading || recentLoading;
  const error = trendingError || recentError;

  if (error) {
    // eslint-disable-next-line no-console
    console.error("[HomeMarketFeed] error:", error);

    return (
      <EmptyState
        description={
          error instanceof Error
            ? error.message
            : "There was an error loading markets."
        }
        title="Error loading markets"
      />
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <MarketSkeleton key={`h-${i}`} />
        ))}
      </div>
    );
  }

  const hasAny =
    trendingItems.length > 0 ||
    featuredItems.length > 0 ||
    recentItems.length > 0;

  if (!hasAny) {
    return <EmptyState />;
  }

  return (
    <div className="flex flex-1 flex-col gap-8">
      <Section
        currentWindows={seriesWindows}
        items={trendingItems}
        title="Trending Futures"
      />
      <Section
        currentWindows={seriesWindows}
        items={featuredItems}
        title="Featured Leagues"
      />
      <Section
        currentWindows={seriesWindows}
        items={recentItems}
        title="Recent Futures"
      />
    </div>
  );
}
