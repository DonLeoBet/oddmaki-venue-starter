"use client";

import { Suspense, useState } from "react";
import { Button } from "@heroui/button";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
} from "@heroui/drawer";

import { SidebarNav } from "@/components/sidebar-nav";

/** Mobile league navigation — full sidebar in a slide-over drawer. */
export function MobileLeagueDrawer() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        className="font-semibold shrink-0"
        size="sm"
        variant="flat"
        onPress={() => setOpen(true)}
      >
        Countries
      </Button>
      <Drawer
        isOpen={open}
        placement="left"
        size="xs"
        onOpenChange={setOpen}
      >
        <DrawerContent>
          {() => (
            <>
              <DrawerHeader className="border-b border-white/[0.06] pb-3">
                Browse countries
              </DrawerHeader>
              <DrawerBody className="overflow-y-auto px-1 py-2 [scrollbar-width:thin]">
                <Suspense>
                  <SidebarNav onNavigate={() => setOpen(false)} />
                </Suspense>
              </DrawerBody>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </>
  );
}
