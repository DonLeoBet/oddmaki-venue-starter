"use client";

import type { SortMode } from "@/config/tags.config";

import { useCallback } from "react";
import { Button } from "@heroui/button";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

import { useFilterToggle } from "../hooks/useFilterToggle";

import { SORT_MODES } from "@/config/tags.config";
import { FilterIcon } from "@/components/icons";

/** Compact sort + filter bar for desktop content area (no league/submarket chips). */
export function DesktopMarketToolbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { showFilters, toggleFilters } = useFilterToggle();

  const isHomePage = pathname === "/";
  const currentSort = searchParams.get("sort");
  const currentCategory = isHomePage ? searchParams.get("category") : null;
  const activeSortMode: SortMode = currentSort === "new" ? "new" : "trending";

  const handleSortClick = useCallback(
    (sortId: SortMode) => {
      if (sortId === "trending") {
        router.push(currentCategory ? `/?category=${currentCategory}` : "/");
      } else {
        router.push(
          currentCategory ? `/?category=${currentCategory}&sort=new` : "/?sort=new",
        );
      }
    },
    [router, currentCategory],
  );

  const isSortActive = (sortId: SortMode) =>
    isHomePage && activeSortMode === sortId;

  if (!isHomePage && !pathname.startsWith("/markets") && !pathname.startsWith("/predictions") && !pathname.startsWith("/glazenbol")) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 border-b border-default-100/40 pb-3">
      <div className="flex items-center gap-1">
        {SORT_MODES.map((mode) => (
          <Button
            key={mode.id}
            className={`text-sm font-medium ${
              isSortActive(mode.id) ? "" : "text-default-500"
            }`}
            color={isSortActive(mode.id) ? "primary" : "default"}
            size="sm"
            variant={isSortActive(mode.id) ? "flat" : "light"}
            onPress={() => handleSortClick(mode.id)}
          >
            {mode.label}
          </Button>
        ))}
      </div>
      <div className="ml-auto">
        <Button
          isIconOnly
          aria-label="Toggle filters"
          className={showFilters ? "text-primary" : "text-default-500"}
          size="sm"
          variant="light"
          onPress={toggleFilters}
        >
          <FilterIcon size={20} />
        </Button>
      </div>
    </div>
  );
}
