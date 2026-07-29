"use client";

import type { TopUpProps } from "./types";

import React from "react";
import { Button } from "@heroui/button";

const CIRCLE_FAUCET_URL = "https://faucet.circle.com";

/**
 * Testnet top-up: links out to the Circle faucet for test USDC.
 * No wallet connection or on-ramp provider required.
 */
export function FaucetTopUp({ className, label }: TopUpProps) {
  return (
    <Button
      as="a"
      className={className}
      color="primary"
      href={CIRCLE_FAUCET_URL}
      rel="noopener noreferrer"
      size="sm"
      target="_blank"
    >
      {label ?? "Top Up"}
    </Button>
  );
}
