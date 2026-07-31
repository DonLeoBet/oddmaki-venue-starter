/**
 * Auth Provider Configuration
 *
 * Reads NEXT_PUBLIC_AUTH_PROVIDER and provider-specific env vars.
 * Validates at import time so missing config fails fast.
 */

import type { AuthProviderType } from "./types";

const explicitProvider = process.env.NEXT_PUBLIC_AUTH_PROVIDER?.trim();

/** Prefer Privy when an app ID is configured (common setup mistake: ID set but provider left default). */
const raw =
  explicitProvider ??
  (process.env.NEXT_PUBLIC_PRIVY_APP_ID?.trim() ? "privy" : "rainbowkit");

function validateProvider(value: string): AuthProviderType {
  if (value === "privy" || value === "rainbowkit") return value;
  console.warn(
    `[auth] Invalid NEXT_PUBLIC_AUTH_PROVIDER="${value}", falling back to "rainbowkit"`,
  );

  return "rainbowkit";
}

export const authConfig = {
  provider: validateProvider(raw),
  privy: {
    appId: process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "",
  },
} as const;
