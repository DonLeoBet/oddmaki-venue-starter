"use client";

import type { StatusFilter } from "./MarketStatusFilter";
import type { UnifiedFeedItem } from "../types";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";


import { useUnifiedFeed } from "../hooks/useUnifiedFeed";
import { useFilterToggle } from "../hooks/useFilterToggle";
import { classifyMarket } from "../utils/discovery";
import { MarketStatus } from "../types";

import { MarketCard } from "./MarketCard";
import { MarketSkeleton } from "./MarketSkeleton";
import { EmptyState } from "./EmptyState";
import { MarketStatusFilter } from "./MarketStatusFilter";

import { MarketGroupCard } from "@/features/market-groups/components/MarketGroupCard";
import {
  PriceSeriesCard,
  useSeriesCurrentWindows,
} from "@/features/price-market-series";
import { CATEGORIES } from "@/config/tags.config";

export function MarketGrid() {
  const searchParams = useSearchParams();
  const selectedCategory = searchParams.get("category");
  const sortParam = searchParams.get("sort");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("Active");
  const { showFilters } = useFilterToggle();

  const querySortBy: "created" | "volume" =
    sortParam === "popular" ? "volume" : "created";

  const {
    data,
    isLoading,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useUnifiedFeed(querySortBy, 12);

  const items = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data],
  );

  const filteredItems = useMemo(() => {
    if (items.length === 0) return [];

    let result = items;

    // Category filter
    if (selectedCategory) {
      const category = CATEGORIES.find((c) => c.id === selectedCategory);

      if (category && category.matchTags.length > 0) {
        const mustMatchAll = category.matchAll ?? false;

        result = result.filter((item: UnifiedFeedItem) => {
          const itemTags = item.data.tags ?? [];

          if (mustMatchAll) {
            return category.matchTags.every((tag) => itemTags.includes(tag));
          }

          return itemTags.some((tag) => category.matchTags.includes(tag));
        });
      }
    }

    // Show only long-term futures markets.
    result = result.filter((item: UnifiedFeedItem) => classifyMarket(item) === "futures");

    // Status filter
    if (statusFilter === "Resolved") {
      result = result.filter(
        (item: UnifiedFeedItem) => item.data.status === MarketStatus.RESOLVED,
      );
    } else {
      // Active includes Active and Draft (UPCOMING)
      result = result.filter(
        (item: UnifiedFeedItem) =>
          item.data.status === MarketStatus.ACTIVE ||
          item.data.status === MarketStatus.DRAFT,
      );
    }

    return result;
  }, [items, selectedCategory, statusFilter]);

  // The subgraph no longer denormalizes a series' current window, so derive it
  // for the visible series in one batched query and pass it to each card.
  const seriesIds = useMemo(
    () =>
      filteredItems
        .filter(
          (item): item is Extract<UnifiedFeedItem, { type: "series" }> =>
            item.type === "series",
        )
        .map((item) => item.data.id),
    [filteredItems],
  );
  const { data: seriesWindows } = useSeriesCurrentWindows(seriesIds);

  if (error) {
    // eslint-disable-next-line no-console
    console.error("[MarketGrid] unified feed error:", error);

    return (
      <EmptyState
        description={
          error instanceof Error
            ? error.message
            : "There was an error loading markets. Please try again later."
        }
        title="Error loading markets"
      />
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 16 }).map((_, i) => (
          <MarketSkeleton key={`m-${i}`} />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <h2 className="text-lg font-semibold">Futures</h2>

      {/* Filter controls — toggled via filter icon in category bar */}
      {showFilters && (
        <div className="flex items-center gap-2">
          <MarketStatusFilter value={statusFilter} onChange={setStatusFilter} />
        </div>
      )}

      {filteredItems.length === 0 ? (
        <EmptyState
          description="No markets match the current filters. Try adjusting your selection."
          title="No markets found"
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredItems.map((item: UnifiedFeedItem) => {
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
                    currentWindow={seriesWindows?.[item.data.id]}
                    series={item.data}
                  />
                );
              }

              return (
                <MarketGroupCard
                  key={`g-${item.data.groupId}`}
                  group={item.data}
                />
              );
            })}
            {isFetchingNextPage &&
              Array.from({ length: 4 }).map((_, i) => (
                <MarketSkeleton key={`next-${i}`} />
              ))}
          </div>
          <InfiniteScrollSentinel
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            onLoadMore={fetchNextPage}
          />
        </>
      )}
    </div>
  );
}

function InfiniteScrollSentinel({
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
}) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasNextPage) return;
    const node = sentinelRef.current;

    if (!node) return;

    // eslint-disable-next-line no-console
    console.log("[InfiniteScrollSentinel] observe", {
      hasNextPage,
      isFetchingNextPage,
    });

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) {
          // eslint-disable-next-line no-console
          console.log("[InfiniteScrollSentinel] onLoadMore");
          onLoadMore();
        }
      },
      { rootMargin: "400px 0px" },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, onLoadMore]);

  if (!hasNextPage) return null;

  return <div ref={sentinelRef} aria-hidden className="h-1 w-full" />;
}
