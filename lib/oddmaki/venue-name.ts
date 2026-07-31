import { cache } from "react";
import { VenueFacetABI } from "@oddmaki-protocol/sdk";

import {
  DEFAULT_VENUE_NAME,
  getConfiguredVenueName,
  getVenueId,
} from "@/config/venue.config";
import { DIAMOND_ADDRESS } from "./constants";
import { cachedReadContract, getPublicClient } from "@/lib/rpc/baseClient";

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
    const client = getPublicClient({ bot: false });

    const venue = (await cachedReadContract(client, {
      address: DIAMOND_ADDRESS,
      abi: VenueFacetABI,
      functionName: "getVenue",
      args: [venueId],
    }, {
      cacheKey: `venue:${venueId}:name`,
    })) as { name?: string };

    return venue.name?.trim() || DEFAULT_VENUE_NAME;
  } catch {
    return DEFAULT_VENUE_NAME;
  }
});
