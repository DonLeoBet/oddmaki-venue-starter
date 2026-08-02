"use client";

import type { StatusFilter } from "./MarketStatusFilter";
import type { UnifiedFeedItem } from "../types";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import NextLink from "next/link";
import { Button } from "@heroui/button";

import { useUnifiedFeed } from "../hooks/useUnifiedFeed";
import { useLeagueMatchGroups } from "../hooks/useLeagueMatchGroups";
import { useHomepageMatchGroups } from "../hooks/useHomepageMatchGroups";
import { useOutrightGroups } from "../hooks/useOutrightGroups";
import { useFilterToggle } from "../hooks/useFilterToggle";
import {
  sortUnifiedFeedItems,
  filterFeedByMinKickoff,
  filterFeedHideLegacyOutrights,
  filterFeedHideRetiredMatchMarkets,
} from "../utils/kickoffSort";

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
import { getLeagueName, LEAGUE_BY_SLUG } from "@/config/leagues";
import {
  groupMatchesLeagueSlug,
  isNewTaxonomyMatchGroup,
  isOutrightGroup,
} from "@/lib/markets/marketFilters";
import { groupMatchesCountryTag } from "@/lib/football/outright-sidebar";
import { HOMEPAGE_PRIORITY_LEAGUES } from "@/lib/markets/diversifyMatchGroups";
import { useBrand } from "@/features/brand";

/** Initial match cards on a league page before "See more". */
const LEAGUE_MATCH_PREVIEW = 12;

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
  const { locale } = useBrand();
  const selectedCategory = searchParams.get("category");
  const leagueFilter = searchParams.get("league");
  const countryFilter = searchParams.get("country");
  const sortParam = searchParams.get("sort");
  const searchQuery = searchParams.get("q")?.trim() ?? "";
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("Active");
  const [leagueExpanded, setLeagueExpanded] = useState(false);
  const { showFilters } = useFilterToggle();

  const isHomepage = !selectedCategory && searchQuery.length < 2;

  const sortBy =
    sortParam === "new" && !selectedCategory ? "created" : "volume";

  const leagueCategorySlug =
    selectedCategory && LEAGUE_BY_SLUG[selectedCategory] ?
      selectedCategory
    : null;

  useEffect(() => {
    setLeagueExpanded(false);
  }, [leagueCategorySlug]);

  // Non-league category browsing (crypto etc.) — not used for football leagues.
  const useUnifiedFeedEnabled =
    !isHomepage &&
    !leagueCategorySlug &&
    selectedCategory !== "outrights";

  const {
    groups: leagueGroups,
    isLoading: leagueGroupsLoading,
    error: leagueGroupsError,
  } = useLeagueMatchGroups(leagueCategorySlug, statusFilter);

  const {
    data,
    isLoading,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useUnifiedFeed(sortBy, useUnifiedFeedEnabled);

  const {
    groups: homepageGroups,
    isLoading: homepageLoading,
    error: homepageError,
  } = useHomepageMatchGroups(statusFilter, isHomepage);

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

  const homepageFeedItems = useMemo(
    (): UnifiedFeedItem[] =>
      homepageGroups.map((group) => ({
        type: "group" as const,
        data: group,
      })),
    [homepageGroups],
  );

  const leagueFeedItems = useMemo(
    (): UnifiedFeedItem[] =>
      leagueGroups.map((group) => ({
        type: "group" as const,
        data: group,
      })),
    [leagueGroups],
  );

  const { mainGridItems, outrightSectionItems, outrightSectionTitle, outrightViewAllHref } =
    useMemo(() => {
    const outrightFeedItems: UnifiedFeedItem[] = outrightGroups.map((group) => ({
      type: "group" as const,
      data: group,
    }));

    const filterOutrightsForLeague = (slug: string) =>
      outrightFeedItems.filter(
        (item) =>
          item.type === "group" &&
          groupMatchesLeagueSlug(item.data.tags ?? [], slug),
      );

    const priorityOutrights = outrightFeedItems
      .filter((item) => {
        if (item.type !== "group") return false;

        return HOMEPAGE_PRIORITY_LEAGUES.some((slug) =>
          groupMatchesLeagueSlug(item.data.tags ?? [], slug),
        );
      })
      .slice(0, 4);

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

    if (leagueCategorySlug) {
      const leagueOutrights = filterOutrightsForLeague(leagueCategorySlug);
      const matches =
        leagueExpanded ?
          leagueFeedItems
        : leagueFeedItems.slice(0, LEAGUE_MATCH_PREVIEW);

      return {
        mainGridItems: matches,
        // Always surface the league winner market in the first row when present.
        outrightSectionItems: leagueOutrights.slice(0, 2),
        outrightSectionTitle: "Long-term odds",
        outrightViewAllHref: `/?category=outrights&league=${leagueCategorySlug}`,
      };
    }

    if (isHomepage) {
      return {
        mainGridItems: homepageFeedItems,
        outrightSectionItems:
          priorityOutrights.length > 0 ?
            priorityOutrights
          : outrightFeedItems.slice(0, 4),
        outrightSectionTitle: "Long-term odds",
        outrightViewAllHref: "/?category=outrights",
      };
    }

    const matchItems = filteredItems.filter((item) => !isOutrightFeedItem(item));

    return {
      mainGridItems: matchItems,
      outrightSectionItems: outrightFeedItems,
      outrightSectionTitle: "Long-term odds",
      outrightViewAllHref: "/?category=outrights",
    };
  }, [
    filteredItems,
    selectedCategory,
    leagueCategorySlug,
    leagueFeedItems,
    leagueExpanded,
    homepageFeedItems,
    isHomepage,
    leagueFilter,
    countryFilter,
    outrightGroups,
  ]);

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

  if (error || homepageError || leagueGroupsError) {
    const feedError = leagueGroupsError ?? homepageError ?? error;

    // eslint-disable-next-line no-console
    console.error("[MarketGrid] feed error:", feedError);

    return (
      <EmptyState
        description={
          feedError instanceof Error
            ? feedError.message
            : "There was an error loading markets. Please try again later."
        }
        title="Error loading markets"
      />
    );
  }

  // Only block the whole grid on the first load — never flash empty skeletons
  // over existing cards (that caused the hang/flicker while paging).
  const feedLoading =
    (isHomepage && homepageLoading && homepageFeedItems.length === 0) ||
    (Boolean(leagueCategorySlug) &&
      leagueGroupsLoading &&
      leagueFeedItems.length === 0) ||
    (useUnifiedFeedEnabled && isLoading && filteredItems.length === 0);

  if (feedLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
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

  if (
    !isHomepage &&
    !leagueCategorySlug &&
    items.length === 0 &&
    !isLoading &&
    outrightGroups.length === 0 &&
    !outrightsLoading
  ) {
    return <EmptyState />;
  }

  const showOutrightSection =
    outrightSectionItems.length > 0 && selectedCategory !== "outrights";

  const outrightOnTop = Boolean(
    (leagueCategorySlug || isHomepage) && showOutrightSection,
  );

  const leagueName =
    leagueCategorySlug ? getLeagueName(leagueCategorySlug, locale) : null;

  const canShowMoreLeagueMatches =
    Boolean(leagueCategorySlug) &&
    !leagueExpanded &&
    leagueFeedItems.length > LEAGUE_MATCH_PREVIEW;

  const gridEmpty =
    isHomepage ?
      mainGridItems.length === 0 && !homepageLoading
    : leagueCategorySlug ?
      mainGridItems.length === 0 &&
      !leagueGroupsLoading &&
      outrightSectionItems.length === 0
    : filteredItems.length === 0 && !hasNextPage;

  const outrightSection = showOutrightSection ? (
    <section className="flex flex-col gap-3 sm:gap-4">
      <div className="flex items-center justify-between gap-3 px-0.5">
        <h2 className="text-base font-bold tracking-tight text-foreground sm:text-xl">
          {leagueName ? `${leagueName} winner` : outrightSectionTitle}
        </h2>
        <NextLink
          className="text-sm font-medium text-primary hover:underline"
          href={outrightViewAllHref}
        >
          View all
        </NextLink>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4">
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
  ) : null;

  return (
    <div className="flex flex-1 flex-col gap-4">
      {showFilters && (
        <div className="flex items-center gap-2">
          <MarketStatusFilter value={statusFilter} onChange={setStatusFilter} />
        </div>
      )}

      {gridEmpty ? (
        <EmptyState
          description="No markets match the current filters. Try adjusting your selection."
          title="No markets found"
        />
      ) : (
        <>
          {outrightOnTop && outrightSection}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4">
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

          {canShowMoreLeagueMatches && (
            <div className="flex justify-center pt-2">
              <Button
                className="font-semibold"
                color="primary"
                variant="flat"
                onPress={() => setLeagueExpanded(true)}
              >
                See more {leagueName ?? "league"} markets
              </Button>
            </div>
          )}

          {showOutrightSection && !outrightOnTop && outrightSection}

          {useUnifiedFeedEnabled && (
            <InfiniteScrollSentinel
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              onLoadMore={fetchNextPage}
            />
          )}
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
