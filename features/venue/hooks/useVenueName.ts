"use client";

import { useVenueData } from "./useVenueData";

import {
  DEFAULT_VENUE_NAME,
  getConfiguredVenueName,
} from "@/config/venue.config";

/**
 * Resolve the venue's display name.
 *
 * Precedence: NEXT_PUBLIC_VENUE_NAME (if set) → on-chain venue.name →
 * DEFAULT_VENUE_NAME. The on-chain name loads asynchronously, so this
 * returns the default until useVenueData resolves to avoid a blank label.
 */
export function useVenueName(): string {
  const configured = getConfiguredVenueName();
  const { venue } = useVenueData();

  if (configured) return configured;

  return venue?.name?.trim() || DEFAULT_VENUE_NAME;
}
