"use client";

import type { TopUpProps } from "./types";

import React from "react";
import dynamic from "next/dynamic";

import { authConfig } from "@/features/auth";
import { isFiatOnRampEnabled } from "@/config/auth.config";
import { IS_TESTNET } from "@/lib/oddmaki/chain";

/**
 * Wallet funding entry point:
 *   - testnet     → Circle USDC faucet
 *   - production  → Deposit (copy address, no KYC) by default
 *   - optional    → Privy fiat on-ramp when NEXT_PUBLIC_ENABLE_FIAT_ONRAMP=true
 */
const FaucetTopUp = dynamic(
  () => import("./FaucetTopUp").then((mod) => mod.FaucetTopUp),
  { ssr: false },
);

const DepositUsdc = dynamic(
  () => import("./DepositUsdc").then((mod) => mod.DepositUsdc),
  { ssr: false },
);

const PrivyTopUp = dynamic(
  () => import("./PrivyTopUp").then((mod) => mod.PrivyTopUp),
  { ssr: false },
);

export function TopUp(props: TopUpProps) {
  if (IS_TESTNET) return <FaucetTopUp {...props} />;

  if (authConfig.provider === "privy" && isFiatOnRampEnabled()) {
    return <PrivyTopUp {...props} />;
  }

  return <DepositUsdc {...props} />;
}
