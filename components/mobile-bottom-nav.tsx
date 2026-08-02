"use client";

import { Suspense, useState } from "react";
import NextLink from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
} from "@heroui/drawer";

import { SidebarNav } from "@/components/sidebar-nav";

function TabIcon({
  children,
  active,
}: {
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <span
      className={`flex h-6 w-6 items-center justify-center text-base leading-none ${
        active ? "text-primary" : "text-default-500"
      }`}
    >
      {children}
    </span>
  );
}

function MobileBottomNavInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [leaguesOpen, setLeaguesOpen] = useState(false);

  const category = searchParams.get("category");
  const isHome = pathname === "/" && !category;
  const isOutrights = pathname === "/" && category === "outrights";
  const isLeaderboard = pathname.startsWith("/leaderboard");

  const tabClass = (active: boolean) =>
    `flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-semibold ${
      active ? "text-primary" : "text-default-500"
    }`;

  return (
    <>
      <nav
        aria-label="Mobile"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-default-100/80 bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
      >
        <div className="mx-auto flex h-14 max-w-lg items-stretch">
          <NextLink className={tabClass(isHome)} href="/">
            <TabIcon active={isHome}>⌂</TabIcon>
            Home
          </NextLink>

          <button
            className={tabClass(leaguesOpen)}
            type="button"
            onClick={() => setLeaguesOpen(true)}
          >
            <TabIcon active={leaguesOpen}>☰</TabIcon>
            Leagues
          </button>

          <NextLink
            className={tabClass(isOutrights)}
            href="/?category=outrights"
          >
            <TabIcon active={isOutrights}>★</TabIcon>
            Long-term
          </NextLink>

          <NextLink className={tabClass(isLeaderboard)} href="/leaderboard">
            <TabIcon active={isLeaderboard}>#</TabIcon>
            Board
          </NextLink>
        </div>
      </nav>

      <Drawer
        isOpen={leaguesOpen}
        placement="bottom"
        size="lg"
        onOpenChange={setLeaguesOpen}
      >
        <DrawerContent>
          {() => (
            <>
              <DrawerHeader className="border-b border-white/[0.06] pb-3">
                Browse leagues
              </DrawerHeader>
              <DrawerBody className="max-h-[70vh] overflow-y-auto px-1 py-2 [scrollbar-width:thin]">
                <Suspense>
                  <SidebarNav onNavigate={() => setLeaguesOpen(false)} />
                </Suspense>
              </DrawerBody>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </>
  );
}

/** Fixed bottom tabs on phone — keeps the top header for logo / wallet only. */
export function MobileBottomNav() {
  return (
    <Suspense fallback={null}>
      <MobileBottomNavInner />
    </Suspense>
  );
}
