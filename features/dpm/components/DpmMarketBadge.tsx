"use client";

import { Chip } from "@heroui/chip";

import { colors, alpha } from "@/lib/tokens";

interface DpmMarketBadgeProps {
  size?: "sm" | "md";
}

/**
 * Small brand-cyan "Pool" chip marking a DPM (pari-mutuel) market.
 * Reused by the market card header and the market detail header.
 */
export function DpmMarketBadge({ size = "sm" }: DpmMarketBadgeProps) {
  return (
    <Chip
      className="font-semibold"
      size={size}
      style={{
        color: colors.neonCyan,
        backgroundColor: alpha(colors.neonCyan, 0.12),
        border: `1px solid ${alpha(colors.neonCyan, 0.4)}`,
      }}
      variant="flat"
    >
      Pool
    </Chip>
  );
}
