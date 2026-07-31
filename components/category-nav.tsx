"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";

import { MobileLeagueDrawer } from "@/components/mobile-league-drawer";
import { CategoryFilter } from "@/features/markets/components/CategoryFilter";
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

      {/* Mobile/tablet: category chips + leagues drawer (no inline accordion tree). */}
      <div className="flex min-w-0 items-center gap-2 px-3 sm:px-4 lg:hidden">
        <Suspense>
          <CategoryFilter />
        </Suspense>
        <Suspense>
          <MobileLeagueDrawer />
        </Suspense>
      </div>
    </div>
  );
}
