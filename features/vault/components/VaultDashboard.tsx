"use client";

import NextLink from "next/link";
import { Button } from "@heroui/button";

import { VaultErrorBoundary } from "./VaultErrorBoundary";
import { VaultFaq } from "./VaultFaq";
import { VaultStakingCard } from "./VaultStakingCard";
import { VaultStatsGrid } from "./VaultStatsGrid";
import { VaultWalletBanner } from "./VaultWalletBanner";

import { BrandLogo } from "@/components/brand/BrandLogo";
import { BRAND_CONFIG } from "@/config/brand.config";
import { venueConfig } from "@/config/venue.config";
import { fonts } from "@/lib/tokens";

export function VaultDashboard() {
  const { primaryColor, backgroundColor } = BRAND_CONFIG.theme;
  const brandName = venueConfig.branding.name;

  return (
    <section className="flex flex-1 flex-col gap-6 pb-12 pt-4 md:gap-8 md:pt-6 md:pb-16">
      <div
        className="relative overflow-hidden rounded-2xl border p-5 sm:p-7 md:p-8"
        style={{
          backgroundColor,
          borderColor: `${primaryColor}40`,
          boxShadow: `0 0 40px ${primaryColor}12`,
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-20 blur-3xl"
          style={{ background: primaryColor }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full opacity-10 blur-3xl"
          style={{ background: primaryColor }}
        />

        <div className="relative flex flex-wrap items-start justify-between gap-5">
          <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-center">
            <BrandLogo priority height={48} />
            <div
              className="min-w-0 sm:border-l sm:pl-5"
              style={{ borderColor: `${primaryColor}33` }}
            >
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.2em]"
                style={{ color: primaryColor, fontFamily: fonts.sans }}
              >
                {brandName} · Liquidity Vault
              </p>
              <h1
                className="mt-1 text-2xl font-bold sm:text-3xl md:text-4xl"
                style={{
                  fontFamily: fonts.sans,
                  letterSpacing: "-0.03em",
                  lineHeight: 1.1,
                }}
              >
                House Pool for prediction markets
              </h1>
              <p
                className="mt-2 max-w-2xl text-sm leading-relaxed sm:text-base"
                style={{ color: "#9a9a9a", fontFamily: fonts.sans }}
              >
                Stake USDC to back {brandName} markets as the house. Earn a share
                of trading fees and spread — powering liquidity from cold start to
                scale.
              </p>
            </div>
          </div>

          <Button
            as={NextLink}
            href="/"
            size="sm"
            variant="flat"
          >
            ← Markets
          </Button>
        </div>
      </div>

      <VaultErrorBoundary>
        <VaultWalletBanner />
      </VaultErrorBoundary>

      <VaultErrorBoundary>
        <VaultStatsGrid />
      </VaultErrorBoundary>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:items-start lg:gap-8">
        <VaultErrorBoundary>
          <VaultFaq />
        </VaultErrorBoundary>
        <VaultErrorBoundary>
          <VaultStakingCard />
        </VaultErrorBoundary>
      </div>
    </section>
  );
}
