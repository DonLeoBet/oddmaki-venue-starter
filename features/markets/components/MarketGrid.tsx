"use client";

import type { StatusFilter } from "./MarketStatusFilter";
import type { UnifiedFeedItem } from "../types";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Tabs, Tab } from "@heroui/tabs";

import { useUnifiedFeed } from "../hooks/useUnifiedFeed";
import { useFilterToggle } from "../hooks/useFilterToggle";
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
import { isLongTermMarket } from "../utils/discovery";

import { CATEGORIES } from "@/config/tags.config";

const ENABLE_MATCH_MARKETS =
  process.env.NEXT_PUBLIC_ENABLE_MATCH_MARKETS === "true";

type FeedTab = "futures" | "matches";

export function MarketGrid() {
  const searchParams = useSearchParams();
  const selectedCategory = searchParams.get("category");
  const sortParam = searchParams.get("sort");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("Active");
  const [activeTab, setActiveTab] = useState<FeedTab>("futures");
  const { showFilters } = useFilterToggle();

  const querySortBy: "created" | "volume" =
    sortParam === "new" ? "created" : "volume";

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

  // DEBUG: bypass all classification filters to confirm the data source works.
  const filteredItems = useMemo(() => {
    // eslint-disable-next-line no-console
    console.log("[MarketGrid] raw items", items.length);

    return items;
  }, [items]);

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

  // eslint-disable-next-line no-console
  console.log("[MarketGrid] render", {
    selectedCategory,
    activeTab,
    querySortBy,
    items: items.length,
    filteredItems: filteredItems.length,
    hasNextPage,
    isFetchingNextPage,
  });

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
      {ENABLE_MATCH_MARKETS && (
        <Tabs
          aria-label="Market feed"
          fullWidth
          selectedKey={activeTab}
          size="md"
          variant="underlined"
          onSelectionChange={(key) => setActiveTab(key as FeedTab)}
        >
          <Tab key="futures" title="Futures" />
          <Tab key="matches" title="Matches" />
        </Tabs>
      )}

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

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) {
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
