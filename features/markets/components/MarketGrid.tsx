"use client";

import type { StatusFilter } from "./MarketStatusFilter";
import type { UnifiedFeedItem } from "../types";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import NextLink from "next/link";

import { useUnifiedFeed } from "../hooks/useUnifiedFeed";
import { useOutrightGroups } from "../hooks/useOutrightGroups";
import { useFilterToggle } from "../hooks/useFilterToggle";
import {
  sortUnifiedFeedItems,
  filterFeedByMinKickoff,
  filterFeedHideLegacyOutrights,
  filterFeedHideRetiredMatchMarkets,
} from "../utils/kickoffSort";
import { filterFeaturedMatches } from "../utils/featuredMatches";

import { MarketCard } from "./MarketCard";
import { MarketSkeleton } from "./MarketSkeleton";
import { EmptyState } from "./EmptyState";
import { MarketStatusFilter } from "./MarketStatusFilter";

import { MarketGroupCard } from "@/features/market-groups/components/MarketGroupCard";
import { OutrightGroupCard } from "@/features/market-groups/components/OutrightGroupCard";
import { MarketSearchResults } from "./MarketSearchResults";
import {
  PriceSeriesCard,
  useSeriesCurrentWindows,
} from "@/features/price-market-series";
import { CATEGORIES } from "@/config/tags.config";
import { LEAGUE_BY_SLUG } from "@/config/leagues";
import {
  groupMatchesLeagueSlug,
  isNewTaxonomyMatchGroup,
  isOutrightGroup,
} from "@/lib/markets/marketFilters";
import { groupMatchesCountryTag } from "@/lib/football/outright-sidebar";

function isOutrightFeedItem(item: UnifiedFeedItem): boolean {
  return item.type === "group" && isOutrightGroup(item.data.tags);
}

function isMatchGroupFeedItem(item: UnifiedFeedItem): boolean {
  return item.type === "group" && !isOutrightGroup(item.data.tags);
}

function FeedItemCard({ item }: { item: UnifiedFeedItem }) {
  if (item.type === "standalone") {
    return (
      <MarketCard
        isDpm={item.data.isDpmMarket ?? false}
        market={item.data}
      />
    );
  }

  if (item.type === "series") {
    return <PriceSeriesCard series={item.data} />;
  }

  if (isOutrightFeedItem(item)) {
    return <OutrightGroupCard group={item.data} />;
  }

  return <MarketGroupCard group={item.data} />;
}

export function MarketGrid() {
  const searchParams = useSearchParams();
  const selectedCategory = searchParams.get("category");
  const leagueFilter = searchParams.get("league");
  const countryFilter = searchParams.get("country");
  const sortParam = searchParams.get("sort");
  const searchQuery = searchParams.get("q")?.trim() ?? "";
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("Active");
  const { showFilters } = useFilterToggle();

  const sortBy =
    sortParam === "new" && !selectedCategory ? "created" : "volume";

  const {
    data,
    isLoading,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useUnifiedFeed(sortBy);

  const {
    groups: outrightGroups,
    isLoading: outrightsLoading,
  } = useOutrightGroups(statusFilter);

  const items = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data],
  );

  const filteredItems = useMemo(() => {
    if (items.length === 0) return [];

    let result = items;

    if (selectedCategory) {
      const category = CATEGORIES.find((entry) => entry.id === selectedCategory);

      if (category) {
        result = result.filter((item: UnifiedFeedItem) => {
          if (item.type !== "group") {
            return item.data.tags?.some((tag: string) =>
              category.matchTags.includes(tag),
            );
          }

          const tags = item.data.tags ?? [];

          if (category.id === "outrights") {
            return isOutrightGroup(tags);
          }

          if (LEAGUE_BY_SLUG[category.id]) {
            return (
              groupMatchesLeagueSlug(tags, category.id) &&
              isNewTaxonomyMatchGroup(tags, item.data.outcomes)
            );
          }

          return tags.some((tag: string) => category.matchTags.includes(tag));
        });
      }
    }

    result = result.filter((item: UnifiedFeedItem) => {
      return item.data.status === statusFilter;
    });

    result = filterFeedByMinKickoff(result);
    result = filterFeedHideLegacyOutrights(result);
    result = filterFeedHideRetiredMatchMarkets(result);

    return sortUnifiedFeedItems(result, sortBy);
  }, [items, selectedCategory, statusFilter, sortBy]);

  const { mainGridItems, outrightSectionItems, outrightSectionTitle, outrightViewAllHref } =
    useMemo(() => {
    const outrightFeedItems: UnifiedFeedItem[] = outrightGroups.map((group) => ({
      type: "group" as const,
      data: group,
    }));

    const filterOutrightsForLeague = (slug: string) =>
      outrightFeedItems.filter((item) =>
        item.type === "group" &&
        groupMatchesLeagueSlug(item.data.tags ?? [], slug),
      );

    if (selectedCategory === "outrights") {
      let items = outrightFeedItems;

      if (leagueFilter && LEAGUE_BY_SLUG[leagueFilter]) {
        items = filterOutrightsForLeague(leagueFilter);
      } else if (countryFilter) {
        items = outrightFeedItems.filter(
          (item) =>
            item.type === "group" &&
            groupMatchesCountryTag(item.data.tags ?? [], countryFilter),
        );
      }

      return {
        mainGridItems: items,
        outrightSectionItems: [] as UnifiedFeedItem[],
        outrightSectionTitle: "Long-term odds",
        outrightViewAllHref: countryFilter
          ? `/?category=outrights&country=${countryFilter}`
          : leagueFilter
            ? `/?category=outrights&league=${leagueFilter}`
            : "/?category=outrights",
      };
    }

    if (selectedCategory && selectedCategory !== "outrights") {
      const hasLeagueFilter = Boolean(LEAGUE_BY_SLUG[selectedCategory]);

      if (hasLeagueFilter) {
        const leagueOutrights = filterOutrightsForLeague(selectedCategory);

        return {
          mainGridItems: filteredItems.filter(
            (item) => item.type !== "group" || !isOutrightGroup(item.data.tags),
          ),
          outrightSectionItems: leagueOutrights,
          outrightSectionTitle: "Long-term odds",
          outrightViewAllHref: `/?category=outrights&league=${selectedCategory}`,
        };
      }
    }

    const matchItems = filteredItems.filter((item) => !isOutrightFeedItem(item));
    const mainGridItems = !selectedCategory
      ? filterFeaturedMatches(matchItems)
      : matchItems;

    return {
      mainGridItems,
      outrightSectionItems: !selectedCategory
        ? outrightFeedItems.slice(0, 4)
        : outrightFeedItems,
      outrightSectionTitle: "Long-term odds",
      outrightViewAllHref: "/?category=outrights",
    };
  }, [filteredItems, selectedCategory, leagueFilter, countryFilter, outrightGroups]);

  const seriesIds = useMemo(
    () =>
      mainGridItems
        .filter(
          (item): item is Extract<UnifiedFeedItem, { type: "series" }> =>
            item.type === "series",
        )
        .map((item) => item.data.id),
    [mainGridItems],
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {Array.from({ length: 16 }).map((_, i) => (
          <MarketSkeleton key={`m-${i}`} />
        ))}
      </div>
    );
  }

  if (searchQuery.length >= 2) {
    return (
      <div className="flex flex-1 flex-col gap-4">
        <MarketSearchResults query={searchQuery} />
      </div>
    );
  }

  if (items.length === 0 && !isLoading && outrightGroups.length === 0 && !outrightsLoading) {
    return <EmptyState />;
  }

  const showOutrightSection =
    !outrightsLoading &&
    outrightSectionItems.length > 0 &&
    selectedCategory !== "outrights";

  return (
    <div className="flex flex-1 flex-col gap-4">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {mainGridItems.map((item: UnifiedFeedItem) => {
              if (item.type === "series") {
                return (
                  <PriceSeriesCard
                    key={`s-${item.data.id}`}
                    currentWindow={seriesWindows?.[item.data.id]}
                    series={item.data}
                  />
                );
              }

              if (item.type === "standalone") {
                return (
                  <MarketCard
                    key={`m-${item.data.marketId}`}
                    isDpm={item.data.isDpmMarket ?? false}
                    market={item.data}
                  />
                );
              }

              if (isMatchGroupFeedItem(item)) {
                return (
                  <MarketGroupCard
                    key={`g-${item.data.groupId}`}
                    group={item.data}
                  />
                );
              }

              return (
                <FeedItemCard key={`g-${item.data.groupId}`} item={item} />
              );
            })}
            {isFetchingNextPage &&
              Array.from({ length: 4 }).map((_, i) => (
                <MarketSkeleton key={`next-${i}`} />
              ))}
          </div>

          {showOutrightSection && (
            <section className="flex flex-col gap-4 pt-4">
              <div className="flex items-center justify-between gap-3 px-0.5">
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  {outrightSectionTitle}
                </h2>
                <NextLink
                  className="text-sm font-medium text-primary hover:underline"
                  href={outrightViewAllHref}
                >
                  View all
                </NextLink>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {outrightSectionItems.map((item) =>
                  item.type === "group" ?
                    <OutrightGroupCard
                      key={`outright-${item.data.groupId}`}
                      group={item.data}
                    />
                  : null,
                )}
              </div>
            </section>
          )}

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
