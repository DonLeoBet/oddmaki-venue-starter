"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";

import { DesktopMarketToolbar } from "@/features/markets/components/DesktopMarketToolbar";

export function CategoryNav() {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <div className="hidden lg:flex flex-col gap-2 pt-4">
      <div className="px-4 xl:px-6">
        <Suspense>
          <DesktopMarketToolbar />
        </Suspense>
      </div>
    </div>
  );
}
