"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";

import { CategoryNav } from "@/components/category-nav";
import { SidebarNav } from "@/components/sidebar-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideSidebar = pathname.startsWith("/admin");

  if (hideSidebar) {
    return (
      <main className="mx-auto flex w-full max-w-7xl flex-grow flex-col px-4 pt-2 sm:px-6">
        {children}
      </main>
    );
  }

  return (
      <div className="flex min-h-0 w-full flex-1 flex-col overflow-x-hidden lg:flex-row">
      {/* Flush-left sidebar — tone shift only, no hard divider */}
      <aside className="hidden lg:flex lg:w-[240px] xl:w-[260px] lg:shrink-0 lg:flex-col lg:bg-background/95">
        <div className="sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto overflow-x-hidden px-1 py-3 [scrollbar-width:thin]">
          <Suspense>
            <SidebarNav />
          </Suspense>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col bg-background">
        <CategoryNav />
        <main className="flex w-full min-w-0 flex-grow flex-col px-3 py-2 pb-20 sm:px-4 xl:px-6 lg:pb-2">
          {children}
        </main>
      </div>
    </div>
  );
}
