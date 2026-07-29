"use client";

import type { TopUpProps } from "./types";

import React from "react";
import dynamic from "next/dynamic";

import { authConfig } from "@/features/auth";
import { IS_TESTNET } from "@/lib/oddmaki/chain";

/**
 * Single entry point for funding the wallet ("Top Up").
 *
 * The action is resolved internally:
 *   - testnet            → Circle faucet (link)
 *   - production + privy → Privy on-ramp modal
 *   - production + rk    → hidden (Coinbase Onramp requires a server-minted
 *                          session token, which this starter doesn't ship)
 *
 * Adapters are dynamically imported (ssr:false) so provider-specific deps
 * (e.g. the Privy SDK) aren't bundled or rendered for the other provider.
 */
const FaucetTopUp = dynamic(
  () => import("./FaucetTopUp").then((mod) => mod.FaucetTopUp),
  { ssr: false },
);

const PrivyTopUp = dynamic(
  () => import("./PrivyTopUp").then((mod) => mod.PrivyTopUp),
  { ssr: false },
);

export function TopUp(props: TopUpProps) {
  if (IS_TESTNET) return <FaucetTopUp {...props} />;

  if (authConfig.provider === "privy") return <PrivyTopUp {...props} />;

  // Production + RainbowKit: no native on-ramp, so render nothing.
  return null;
}
