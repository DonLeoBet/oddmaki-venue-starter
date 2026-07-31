"use client";

import { useEffect, useMemo, useState } from "react";

import { filterMarketSearch, type MarketSearchHit } from "../utils/matchMarketSearch";

import { useMarketSearchIndex } from "./useMarketSearchIndex";

const DEBOUNCE_MS = 250;

export function useMarketSearch(query: string) {
  const { data: index = [], isLoading, isFetching, error } = useMarketSearchIndex();
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(handle);
  }, [query]);

  const results = useMemo((): MarketSearchHit[] => {
    return filterMarketSearch(debouncedQuery, index);
  }, [debouncedQuery, index]);

  const isSearching =
    query.trim().length >= 2 &&
    (isLoading || isFetching || debouncedQuery !== query);

  return {
    results,
    isSearching,
    isIndexLoading: isLoading,
    indexSize: index.length,
    error,
  };
}
