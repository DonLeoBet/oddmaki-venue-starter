"use client";

import type { TopUpProps } from "./types";

import React from "react";
import { useFundWallet, usePrivy } from "@privy-io/react-auth";
import { useAccount } from "wagmi";
import { Button } from "@heroui/button";
import { toast } from "sonner";

import { ACTIVE_CHAIN } from "@/lib/oddmaki/chain";

/**
 * Production top-up via Privy's fiat on-ramp.
 *
 * Opens Privy's funding modal (card on-ramp, exchange transfer, or
 * transfer-from-wallet) prefilled with USDC on the active chain. If no wallet
 * is connected yet, prompts login first so there's an address to fund.
 *
 * On-ramp providers must be enabled in the Privy dashboard under Funding.
 */
export function PrivyTopUp({ className, label }: TopUpProps) {
  const { address } = useAccount();
  const { login } = usePrivy();
  const { fundWallet } = useFundWallet();

  const handlePress = async () => {
    if (!address) {
      login();

      return;
    }

    try {
      await fundWallet({
        address,
        options: {
          chain: ACTIVE_CHAIN,
          asset: "USDC",
          amount: "25",
        },
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not open funding";

      toast.error("Funding unavailable", { description: message });
    }
  };

  return (
    <Button
      className={className}
      color="primary"
      size="sm"
      onPress={handlePress}
    >
      {label ?? "Top Up"}
    </Button>
  );
}
