"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";

import { CategoryFilter } from "@/features/markets/components/CategoryFilter";
import { CategoryMarketLinks } from "@/features/markets/components/CategoryMarketLinks";
import { DesktopMarketToolbar } from "@/features/markets/components/DesktopMarketToolbar";

export function CategoryNav() {
  const pathname = usePathname();

  if (pathname.startsWith("/admin") || pathname.startsWith("/vault")) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 pt-2 lg:pt-4">
      {/* Desktop: sort/filter only — leagues & submarkets live in the sidebar. */}
      <div className="hidden lg:block px-4 xl:px-6">
        <Suspense>
          <DesktopMarketToolbar />
        </Suspense>
      </div>

      {/* Mobile/tablet: compact top nav with collapsible league submarkets. */}
      <div className="lg:hidden flex flex-col gap-2">
        <Suspense>
          <CategoryFilter />
        </Suspense>
        <Suspense>
          <CategoryMarketLinks />
        </Suspense>
      </div>
    </div>
  );
}
