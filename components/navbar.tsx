import NextLink from "next/link";
import {
  Navbar as HeroUINavbar,
  NavbarContent,
  NavbarBrand,
  NavbarItem,
} from "@heroui/navbar";
import { Button } from "@heroui/button";

import { BrandLogo } from "@/components/brand";
import { ConnectButton } from "@/features/auth";
import { WalletPanel, TopUp } from "@/features/wallet/components";
import { CreateMarketButton } from "@/features/market-creation";
import { MarketSearchBarShell } from "@/features/markets/components/MarketSearchBarShell";

export const Navbar = () => {
  return (
    <HeroUINavbar
      classNames={{ wrapper: "px-3 sm:px-6 gap-2" }}
      maxWidth="xl"
      position="sticky"
    >
      <NavbarContent justify="start">
        <NavbarBrand className="flex-shrink-0">
          <NextLink className="flex items-center gap-2" href="/">
            <BrandLogo priority />
          </NextLink>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent className="hidden md:flex flex-1 max-w-xl" justify="center">
        <MarketSearchBarShell />
      </NavbarContent>

      <NavbarContent className="gap-1 sm:gap-2" justify="end">
        <NavbarItem>
          <Button
            as={NextLink}
            className="font-semibold px-2 sm:px-3"
            href="/vault"
            size="sm"
            variant="flat"
          >
            Vault
          </Button>
        </NavbarItem>
        <NavbarItem>
          <CreateMarketButton />
        </NavbarItem>
        <NavbarItem>
          <div className="flex items-center gap-1 sm:gap-2">
            <WalletPanel />
            <TopUp className="font-semibold" />
          </div>
        </NavbarItem>
        <NavbarItem>
          <ConnectButton />
        </NavbarItem>
      </NavbarContent>

      <NavbarContent className="md:hidden pb-2 basis-full" justify="center">
        <MarketSearchBarShell />
      </NavbarContent>
    </HeroUINavbar>
  );
};
