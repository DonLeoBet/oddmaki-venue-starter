"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";

import { CategoryFilter } from "@/features/markets/components/CategoryFilter";
import { CategoryMarketLinks } from "@/features/markets/components/CategoryMarketLinks";

export function CategoryNav() {
  const pathname = usePathname();

  if (pathname.startsWith("/admin") || pathname.startsWith("/vault")) {
    return null;
  }

  return (
    <div className="container mx-auto max-w-7xl px-3 sm:px-6 pt-2 flex flex-col gap-2">
      <Suspense>
        <CategoryFilter />
      </Suspense>
      <CategoryMarketLinks />
    </div>
  );
}
