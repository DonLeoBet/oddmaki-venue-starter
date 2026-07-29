"use client";

import {
  Navbar as HeroUINavbar,
  NavbarContent,
  NavbarBrand,
  NavbarItem,
} from "@heroui/navbar";
import NextLink from "next/link";
import Image from "next/image"; // Toegevoegd voor jouw PNG-logo

import { ConnectButton } from "@/features/auth";
import { WalletPanel, TopUp } from "@/features/wallet/components";
import { CreateMarketButton } from "@/features/market-creation";

export const Navbar = () => {
  return (
    <HeroUINavbar
      classNames={{ wrapper: "px-3 sm:px-6" }}
      maxWidth="xl"
      position="sticky"
    >
      {/* Left - Logo and App Name */}
      <NavbarContent justify="start">
        <NavbarBrand>
          <NextLink className="flex items-center gap-2" href="/">
            {/* Oude Logo en Tekst vervangen door jouw eigen PNG-afbeelding */}
            <Image src="/logo.png" alt="Poly.Football Logo" width={200} height={56} priority />

          </NextLink>
        </NavbarBrand>
      </NavbarContent>

      {/* Right - Wallet, Connect */}
      <NavbarContent className="gap-1 sm:gap-2" justify="end">
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
    </HeroUINavbar>
  );
};
