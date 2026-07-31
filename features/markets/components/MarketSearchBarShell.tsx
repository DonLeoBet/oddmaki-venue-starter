"use client";

import { Suspense } from "react";

import { MarketSearchBar } from "./MarketSearchBar";

function SearchFallback() {
  return (
    <div
      aria-hidden
      className="h-10 w-full max-w-xl rounded-medium bg-default-100 animate-pulse"
    />
  );
}

export function MarketSearchBarShell() {
  return (
    <Suspense fallback={<SearchFallback />}>
      <MarketSearchBar />
    </Suspense>
  );
}
