"use client";

import { authConfig } from "../config";

import { useSessionPrivy } from "./useSessionPrivy";
import { useSessionRainbowkit } from "./useSessionRainbowkit";

/**
 * Unified session hook — provider selected at build time via NEXT_PUBLIC_AUTH_PROVIDER.
 * Logged in when Privy-authenticated OR when an EVM wallet is connected with an address.
 */
const useSessionImpl =
  authConfig.provider === "privy" ? useSessionPrivy : useSessionRainbowkit;

export const useSession = useSessionImpl;
