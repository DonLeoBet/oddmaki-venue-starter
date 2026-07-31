import type { PrivyClientConfig } from "@privy-io/react-auth";

import { BRAND_CONFIG } from "./brand.config";

/**
 * Customer-facing login methods (Privy).
 * Enable matching providers in https://dashboard.privy.io → Login methods.
 */
export const PRIVY_LOGIN_METHODS: NonNullable<
  PrivyClientConfig["loginMethods"]
> = ["email", "google", "twitter", "apple", "wallet"];

/** Absolute logo URL for Privy / OAuth modals (must be HTTPS in production). */
export function getPrivyLogoUrl(): string {
  const logo = BRAND_CONFIG.logoUrl;

  if (logo.startsWith("http://") || logo.startsWith("https://")) {
    return logo;
  }

  return `https://${BRAND_CONFIG.domain}${logo.startsWith("/") ? logo : `/${logo}`}`;
}

/** WalletConnect via Reown — requires domain on https://cloud.reown.com allowlist. */
export function isWalletConnectEnabled(): boolean {
  return (
    Boolean(process.env.NEXT_PUBLIC_WALLETCONNECT_ID) &&
    process.env.NEXT_PUBLIC_DISABLE_WALLETCONNECT !== "true"
  );
}

/** Fiat on-ramp (card/bank) — usually requires KYC via Privy partners. Off by default. */
export function isFiatOnRampEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_FIAT_ONRAMP === "true";
}
