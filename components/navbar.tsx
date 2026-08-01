import NextLink from "next/link";
import { Suspense } from "react";
import {
  Navbar as HeroUINavbar,
  NavbarContent,
  NavbarBrand,
  NavbarItem,
} from "@heroui/navbar";

import { BrandLogo } from "@/components/brand";
import { MobileLeagueDrawer } from "@/components/mobile-league-drawer";
import { ConnectButton } from "@/features/auth";
import { WalletPanel, TopUp } from "@/features/wallet/components";
import { CreateMarketButton } from "@/features/market-creation";
import { MarketSearchBarShell } from "@/features/markets/components/MarketSearchBarShell";

export const Navbar = () => {
  return (
    <HeroUINavbar
      classNames={{
        base: "bg-background/95 backdrop-blur-xl max-w-full overflow-x-hidden",
        wrapper: "w-full max-w-full px-3 sm:px-6",
      }}
      maxWidth="full"
      position="sticky"
    >
      <NavbarContent justify="start" className="min-w-0 gap-2">
        <NavbarBrand className="flex-shrink-0 min-w-0">
          <NextLink className="flex items-center gap-2" href="/">
            <BrandLogo priority />
          </NextLink>
        </NavbarBrand>
        <NavbarItem className="lg:hidden shrink-0">
          <Suspense>
            <MobileLeagueDrawer />
          </Suspense>
        </NavbarItem>
      </NavbarContent>

      <NavbarContent
        className="hidden md:flex flex-1 max-w-2xl"
        justify="center"
      >
        <MarketSearchBarShell />
      </NavbarContent>

      <NavbarContent className="gap-1 sm:gap-2 min-w-0 shrink" justify="end">
        <NavbarItem className="hidden md:flex">
          <CreateMarketButton />
        </NavbarItem>
        <NavbarItem className="min-w-0">
          <div className="flex items-center gap-1 sm:gap-2">
            <WalletPanel />
            <TopUp className="hidden sm:flex font-semibold" />
          </div>
        </NavbarItem>
        <NavbarItem className="shrink-0">
          <ConnectButton />
        </NavbarItem>
      </NavbarContent>

      <NavbarContent className="md:hidden pb-2 basis-full" justify="center">
        <MarketSearchBarShell />
      </NavbarContent>
    </HeroUINavbar>
  );
};
