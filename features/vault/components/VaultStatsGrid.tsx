"use client";

import type { ReactNode } from "react";

import { Chip } from "@heroui/chip";
import { Skeleton } from "@heroui/skeleton";

import { BRAND_CONFIG } from "@/config/brand.config";
import type { HousePoolStatus } from "@/config/vault.config";
import { formatUsd } from "@/features/dpm/lib/format";
import { getVaultConfigSafe } from "@/lib/vault/safe-config";
import { fonts } from "@/lib/tokens";

const STATUS_LABEL: Record<HousePoolStatus, string> = {
  active: "Active · Accepting deposits",
  paused: "Paused",
  full: "Full · Waitlist open",
};

const STATUS_COLOR: Record<HousePoolStatus, "success" | "warning" | "default"> =
  {
    active: "success",
    paused: "warning",
    full: "default",
  };

interface StatCardProps {
  label: string;
  value: string;
  hint: string;
  accent?: boolean;
  badge?: ReactNode;
}

function StatCard({ label, value, hint, accent, badge }: StatCardProps) {
  const primaryColor = BRAND_CONFIG.theme.primaryColor;

  return (
    <div
      className="relative overflow-hidden rounded-xl border p-5"
      style={{
        background: accent ? `${primaryColor}08` : "#111214",
        borderColor: accent ? `${primaryColor}35` : "#ffffff0c",
        boxShadow: accent ? `0 0 24px ${primaryColor}10` : undefined,
      }}
    >
      <p
        className="text-[10px] font-semibold uppercase tracking-widest"
        style={{ color: "#666", fontFamily: fonts.sans }}
      >
        {label}
      </p>
      <div className="mt-2 flex flex-wrap items-end gap-2">
        <p
          className="text-2xl font-bold sm:text-3xl"
          style={{
            fontFamily: fonts.sans,
            letterSpacing: "-0.02em",
            color: accent ? primaryColor : "#fff",
          }}
        >
          {value}
        </p>
        {badge}
      </div>
      <p
        className="mt-2 text-xs leading-relaxed"
        style={{ color: "#888", fontFamily: fonts.sans }}
      >
        {hint}
      </p>
    </div>
  );
}

export function VaultStatsGrid() {
  const { demoStats, estimatedApyPercent } = getVaultConfigSafe();
  const primaryColor = BRAND_CONFIG.theme.primaryColor;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        accent
        hint={`${demoStats.utilizationPercent}% deployed across ${demoStats.activeMarketsBacked} active markets`}
        label="Total Value Locked"
        value={formatUsd(demoStats.tvlUsd)}
      />

      <StatCard
        hint="Projected net yield from fee share + house spread (not guaranteed)"
        label="Estimated APY"
        value={`${estimatedApyPercent.toFixed(1)}%`}
        badge={
          <Chip
            size="sm"
            style={{ borderColor: `${primaryColor}44` }}
            variant="bordered"
          >
            Projected
          </Chip>
        }
      />

      <StatCard
        hint="Cumulative USDC distributed to vault depositors to date"
        label="Fee rewards paid"
        value={formatUsd(demoStats.totalRewardsPaidUsd)}
      />

      <StatCard
        hint="House liquidity engine backing order books & pool markets"
        label="House Pool"
        value={
          demoStats.housePoolStatus === "active"
            ? "Operational"
            : demoStats.housePoolStatus === "paused"
              ? "Paused"
              : "At capacity"
        }
        badge={
          <Chip
            color={STATUS_COLOR[demoStats.housePoolStatus]}
            size="sm"
            variant="flat"
          >
            {STATUS_LABEL[demoStats.housePoolStatus]}
          </Chip>
        }
      />
    </div>
  );
}

export function VaultStatsGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-32 rounded-xl" />
      ))}
    </div>
  );
}
