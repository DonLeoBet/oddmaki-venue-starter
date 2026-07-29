import { cache } from "react";
import { createPublicClient, http } from "viem";
import { VenueFacetABI } from "@oddmaki-protocol/sdk";

import { ACTIVE_CHAIN } from "./chain";
import { DIAMOND_ADDRESS } from "./constants";

import {
  DEFAULT_VENUE_NAME,
  getConfiguredVenueName,
  getVenueId,
} from "@/config/venue.config";

/**
 * Server-side venue name resolution for metadata / SSR.
 *
 * Mirrors the useVenueName hook for contexts that can't use React hooks
 * (e.g. generateMetadata). Precedence: NEXT_PUBLIC_VENUE_NAME →
 * on-chain venue.name → DEFAULT_VENUE_NAME. Wrapped in React.cache so a
 * single request reads the contract at most once. Any RPC/config failure
 * falls back to the default rather than breaking the render.
 */
export const resolveVenueName = cache(async (): Promise<string> => {
  const configured = getConfiguredVenueName();

  if (configured) return configured;

  const venueId = getVenueId();

  if (venueId === undefined) return DEFAULT_VENUE_NAME;

  try {
    const client = createPublicClient({
      chain: ACTIVE_CHAIN,
      transport: http(),
    });

    const venue = (await client.readContract({
      address: DIAMOND_ADDRESS,
      abi: VenueFacetABI,
      functionName: "getVenue",
      args: [venueId],
    })) as { name?: string };

    return venue.name?.trim() || DEFAULT_VENUE_NAME;
  } catch {
    return DEFAULT_VENUE_NAME;
  }
});
