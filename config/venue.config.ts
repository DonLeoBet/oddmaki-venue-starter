/**
 * Venue Configuration
 *
 * venueId comes exclusively from the NEXT_PUBLIC_VENUE_ID env var.
 * If not set, VenueSetupGuard shows a notice instructing the developer
 * to set the env var and restart.
 */

import { BRAND_CONFIG } from "./brand.config";

import { ACTIVE_CHAIN_ID } from "@/lib/oddmaki/chain";

const envVenueIdRaw = process.env.NEXT_PUBLIC_VENUE_ID;
const envVenueId =
  envVenueIdRaw !== undefined && envVenueIdRaw !== ""
    ? BigInt(envVenueIdRaw)
    : undefined;

/** Fallback venue name used when neither the env var nor on-chain data resolve. */
export const DEFAULT_VENUE_NAME = "OddMaki Markets";

const envVenueName =
  process.env.NEXT_PUBLIC_VENUE_NAME?.trim() ||
  process.env.NEXT_PUBLIC_BRAND_NAME?.trim() ||
  undefined;

/**
 * Get the configured venueId from the NEXT_PUBLIC_VENUE_ID env var.
 * Returns undefined when no venueId is configured.
 */
export function getVenueId(): bigint | undefined {
  return envVenueId;
}

/**
 * Get the venue name explicitly set via NEXT_PUBLIC_VENUE_NAME.
 * Returns undefined when unset/blank so callers can fall back to the
 * on-chain venue name (see useVenueName / resolveVenueName).
 */
export function getConfiguredVenueName(): string | undefined {
  return envVenueName;
}

export const venueConfig = {
  // Venue identification - use getVenueId() at runtime for client code
  venueId: envVenueId,

  // Branding & UI
  branding: {
    name: envVenueName ?? BRAND_CONFIG.name,
    description: "Trade on prediction markets powered by OddMaki Protocol",
    logo: BRAND_CONFIG.logoUrl,
    favicon: BRAND_CONFIG.logoUrl,
    domain: BRAND_CONFIG.domain,
    traditionalBookieUrl: BRAND_CONFIG.traditionalBookieUrl,
    // Note: Theme colors are configured in theme.config.json + brand.config.ts
  },

  // Network settings — driven by NEXT_PUBLIC_CHAIN_ID (see lib/oddmaki/chain.ts)
  network: {
    defaultChainId: ACTIVE_CHAIN_ID,
    supportedChains: [ACTIVE_CHAIN_ID],
  },

  // UI settings
  ui: {
    marketsPerPage: 12,
    enableAnimations: true,
    defaultTheme: "dark" as const,
  },
} as const;

export type VenueConfig = typeof venueConfig;
