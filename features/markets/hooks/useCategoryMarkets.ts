"use client";

import type { CategoryMarketRow } from "../utils/categoryMarkets";
import { filterGroupForCategory } from "../utils/categoryMarkets";

import { useMemo } from "react";

import type { MarketTypeId } from "@/config/marketTypes";
import { useUnifiedFeed } from "./useUnifiedFeed";

export function useCategoryMarkets(
  leagueSlug: string,
  marketType: MarketTypeId,
) {
  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useUnifiedFeed("volume");

  const rows = useMemo(() => {
    if (!data?.pages) return [] as CategoryMarketRow[];

    const all: CategoryMarketRow[] = [];

    for (const page of data.pages) {
      for (const item of page.items) {
        if (item.type !== "group") continue;
        const row = filterGroupForCategory(item.data, leagueSlug, marketType);
        if (row) all.push(row);
      }
    }

    return all.sort((a, b) => a.kickoffUnix - b.kickoffUnix);
  }, [data, leagueSlug, marketType]);

  return {
    rows,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
}
