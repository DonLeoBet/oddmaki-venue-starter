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
import { CATEGORIES } from "@/config/tags.config";

type FeedTab = "futures" | "matches";

const FUTURE_PHRASES = [
  "win the",
  "winning the",
  "winner of",
  "winners of",
  "champions of",
  "champion of",
  "championship",
  "top scorer",
  "top goalscorer",
  "golden boot",
  "futures",
  "outright",
  "tournament winner",
  "league winner",
  "season",
  "to be relegated",
  "to qualify",
];

const MATCH_PHRASES = [
  " vs ",
  " v ",
  "1x2",
  "matchday",
  "round",
  "fixture",
  "week ",
];

function getMarketText(item: UnifiedFeedItem): string {
  if (item.type === "standalone") {
    return `${item.data.question} ${item.data.tags?.join(" ") ?? ""}`;
  }

  if (item.type === "group") {
    return `${item.data.marketQuestion} ${item.data.tags?.join(" ") ?? ""} ${item.data.outcomes.map((o) => o.name).join(" ")}`;
  }

  return `${item.data.title} ${item.data.tags?.join(" ") ?? ""}`;
}

function isLongTermMarket(item: UnifiedFeedItem): boolean {
  const text = getMarketText(item).toLowerCase();

  if (MATCH_PHRASES.some((p) => text.includes(p))) {
    return false;
  }

  if (FUTURE_PHRASES.some((p) => text.includes(p))) {
    return true;
  }

  const tags = (item.data.tags ?? []).map((t) => t.toLowerCase());

  return tags.some(
    (t) =>
      t === "futures" ||
      t.includes("winner") ||
      t.includes("champion") ||
      t.includes("outright") ||
      t.includes("season") ||
      t.includes("tournament") ||
      t.includes("long-term"),
  );
}

export function MarketGrid() {
  const searchParams = useSearchParams();
  const selectedCategory = searchParams.get("category");
  const sortParam = searchParams.get("sort");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("Active");
  const [activeTab, setActiveTab] = useState<FeedTab>("futures");
  const { showFilters } = useFilterToggle();

  // Futures should surface the newest markets first so long-term markets with
  // $0 volume are not buried. Matches keep the volume-based trending default.
  const querySortBy: "created" | "volume" =
    activeTab === "futures"
      ? "created"
      : sortParam === "new" && !selectedCategory
        ? "created"
        : "volume";

  const {
    data,
    isLoading,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useUnifiedFeed(querySortBy);

  const items = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data],
  );

  const filteredItems = useMemo(() => {
    if (items.length === 0) return [];

    let result = items;

    // Filter by category
    if (selectedCategory) {
      const category = CATEGORIES.find((c) => c.id === selectedCategory);

      if (category && category.matchTags.length > 0) {
        result = result.filter((item: UnifiedFeedItem) => {
          return item.data.tags?.some((tag: string) =>
            category.matchTags.includes(tag),
          );
        });
      }
    }

    // Split by tab and status
    result = result.filter((item: UnifiedFeedItem) => {
      const isFuture = isLongTermMarket(item);

      if (activeTab === "futures" && !isFuture) return false;
      if (activeTab === "matches" && isFuture) return false;

      if (statusFilter === "Resolved") {
        return item.data.status === MarketStatus.RESOLVED;
      }

      // Active filter: futures include DRAFT as UPCOMING; matches stay Active only
      if (activeTab === "futures") {
        return (
          item.data.status === MarketStatus.ACTIVE ||
          item.data.status === MarketStatus.DRAFT
        );
      }

      return item.data.status === MarketStatus.ACTIVE;
    });

    return result;
  }, [items, selectedCategory, activeTab, statusFilter]);

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

      {/* Filter controls — toggled via filter icon in category bar */}
      {showFilters && (
        <div className="flex items-center gap-2">
          <MarketStatusFilter value={statusFilter} onChange={setStatusFilter} />
        </div>
      )}

      {filteredItems.length === 0 && !hasNextPage ? (
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
