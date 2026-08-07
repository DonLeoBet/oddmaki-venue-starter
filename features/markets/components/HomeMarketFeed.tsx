"use client";

import type { UnifiedFeedItem } from "../types";

import { useEffect, useMemo, useRef } from "react";

import { useUnifiedFeed } from "../hooks/useUnifiedFeed";
import { classifyMarket, isLongTermMarket } from "../utils/discovery";

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
const MAX_OTHER = 10;

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

function classifyReport(items: UnifiedFeedItem[] | undefined) {
  const list = items ?? [];
  const counts = list.reduce(
    (acc, item) => {
      acc[classifyMarket(item)] += 1;
      return acc;
    },
    { futures: 0, matches: 0, other: 0 },
  );

  return { total: list.length, ...counts };
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
    () => recentData?.pages[0]?.items ?? [],
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

  const otherItems = useMemo(
    () =>
      trendingAll
        .filter((item) => classifyMarket(item) === "other")
        .slice(0, MAX_OTHER),
    [trendingAll],
  );

  // DEBUG: targeted scan for one country that should contain only futures.
  // Stops as soon as we have 5 examples from the chosen country or run out of pages.
  const targetCountries = ["japan", "korea", "scotland", "morocco", "uae"];
  const targetExamplesRef = useRef(0);

  useEffect(() => {
    if (!recentData) return;

    const allLoaded = recentData.pages.flatMap((p) => p.items);
    const matched = allLoaded.filter((item) =>
      (item.data.tags ?? []).some((tag) =>
        targetCountries.some((c) => tag.toLowerCase().includes(c)),
      ),
    );

    const targetFound = targetExamplesRef.current + matched.length;
    targetExamplesRef.current = matched.length;

    // eslint-disable-next-line no-console
    console.log("[HomeMarketFeed] target country scan", {
      pagesLoaded: recentData.pages.length,
      totalLoaded: allLoaded.length,
      targetExamplesSoFar: matched.length,
      hasNextPage: hasRecentNextPage,
      isFetchingNextPage: isFetchingRecentNextPage,
    });

    if (matched.length >= 5 || !hasRecentNextPage) {
      // Print the exact structure of the first 5 examples.
      matched.slice(0, 5).forEach((item, idx) => {
        const tags = item.data.tags ?? [];
        const country =
          tags.find((t) => t.toLowerCase().endsWith(" football")) ?? "—";
        const league =
          tags.find(
            (t) =>
              !t.toLowerCase().startsWith("outright") &&
              !t.toLowerCase().startsWith("fixture") &&
              !t.toLowerCase().startsWith("kickoff") &&
              !t.toLowerCase().startsWith("match-markets") &&
              !t.toLowerCase().startsWith("sports") &&
              !t.toLowerCase().endsWith(" football"),
          ) ?? "—";

        // eslint-disable-next-line no-console
        console.log(`[HomeMarketFeed] target example ${idx + 1}`, {
          type: item.type,
          id:
            item.type === "standalone"
              ? item.data.marketId
              : item.type === "group"
                ? item.data.groupId
                : item.data.id,
          title:
            item.type === "standalone"
              ? item.data.question
              : item.type === "group"
                ? item.data.marketQuestion
                : item.data.title,
          question:
            item.type === "standalone"
              ? item.data.question
              : item.type === "group"
                ? item.data.outcomes[0]?.question ?? ""
                : item.data.currentMarket?.question ?? "",
          tags,
          country,
          league,
          outcomes:
            item.type === "group"
              ? item.data.outcomes.map((o) => ({
                  name: o.name,
                  question: o.question,
                }))
              : item.type === "standalone"
                ? item.data.outcomes
                : item.data.currentMarket?.outcomes,
          metadata: {
            status: item.data.status,
            totalMarkets: item.type === "group" ? item.data.totalMarkets : null,
            activeMarketCount:
              item.type === "group" ? item.data.activeMarketCount : null,
            resolvedMarketId:
              item.type === "group" ? item.data.resolvedMarketId : null,
            createdAt: item.type === "group" ? item.data.createdAt : null,
            creator: item.type === "group" ? item.data.creator : null,
            totalVolume: "totalVolume" in item.data ? item.data.totalVolume : null,
            volumeFormatted: "volumeFormatted" in item.data ? item.data.volumeFormatted : null,
          },
        });
      });

      return;
    }

    if (hasRecentNextPage && !isFetchingRecentNextPage) {
      fetchRecentNextPage();
    }
  }, [
    recentData,
    fetchRecentNextPage,
    hasRecentNextPage,
    isFetchingRecentNextPage,
  ]);

  const seriesIds = useMemo(() => {
    const all = [
      ...trendingItems,
      ...featuredItems,
      ...recentItems,
      ...otherItems,
    ];

    return all
      .filter(
        (item): item is Extract<UnifiedFeedItem, { type: "series" }> =>
          item.type === "series",
      )
      .map((item) => item.data.id);
  }, [trendingItems, featuredItems, recentItems, otherItems]);

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
    recentItems.length > 0 ||
    otherItems.length > 0;

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
      <Section
        currentWindows={seriesWindows}
        items={otherItems}
        title="Other Markets"
      />
    </div>
  );
}
