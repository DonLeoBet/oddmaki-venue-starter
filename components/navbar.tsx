import NextLink from "next/link";
import {
  Navbar as HeroUINavbar,
  NavbarContent,
  NavbarBrand,
  NavbarItem,
} from "@heroui/navbar";

import { BrandLogo } from "@/components/brand";
import { BRAND_CONFIG } from "@/config/brand.config";
import { ConnectButton } from "@/features/auth";
import { WalletPanel, TopUp } from "@/features/wallet/components";
import { CreateMarketButton } from "@/features/market-creation";
import { MarketSearchBarShell } from "@/features/markets/components/MarketSearchBarShell";

export const Navbar = () => {
  const isWiseguy = BRAND_CONFIG.domain.includes("wiseguy");
  const logoHeight = isWiseguy ? 42 : 28;

  return (
    <header className="sticky top-0 z-40 w-full max-w-[100vw] overflow-x-hidden bg-background/95 backdrop-blur-xl">
      <HeroUINavbar
        classNames={{
          base: "bg-transparent max-w-full relative z-10",
          wrapper: `w-full max-w-full px-3 sm:px-6 ${isWiseguy ? "h-16 min-h-16" : "h-14 min-h-14"}`,
        }}
        height={isWiseguy ? "4rem" : "3.5rem"}
        maxWidth="full"
        position="static"
      >
        <NavbarContent className="min-w-0 gap-2" justify="start">
          <NavbarBrand className="flex-shrink-0 min-w-0 max-w-[70vw] sm:max-w-none">
            <NextLink className="flex min-w-0 items-center gap-2" href="/">
              <BrandLogo
                className={
                  isWiseguy ?
                    "h-[42px] w-auto max-w-full shrink-0 object-contain object-left sm:h-11"
                  : "h-7 w-auto max-w-full shrink-0 object-contain object-left sm:h-8"
                }
                height={logoHeight}
                priority
              />
            </NextLink>
          </NavbarBrand>
        </NavbarContent>

        <NavbarContent
          className="hidden md:flex flex-1 max-w-2xl"
          justify="center"
        >
          <MarketSearchBarShell />
        </NavbarContent>

        <NavbarContent className="gap-1 sm:gap-2 min-w-0 shrink-0" justify="end">
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
      </HeroUINavbar>

      <div className="border-b border-default-100/60 px-3 pb-2.5 md:hidden">
        <MarketSearchBarShell />
      </div>
    </header>
  );
};
