"use client";

import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import { MarketsFacetABI } from "@oddmaki-protocol/sdk";

import { DIAMOND_ADDRESS } from "@/lib/oddmaki/constants";
import { getVenueId } from "@/config/venue.config";

export interface MarketVenueAccess {
  /** venueId the market actually belongs to (on-chain registry). */
  marketVenueId: bigint;
  /** True when the market belongs to this app's configured venue. */
  belongs: boolean;
}

/**
 * Guard against cross-venue access. The protocol Diamond is shared across all
 * venues, so the subgraph `getMarket(id)` happily returns a market regardless
 * of which venue owns it — letting anyone open a foreign venue's market by
 * editing the URL marketId.
 *
 * The market registry (read on-chain) carries the authoritative `venueId`, so
 * we read it and compare against the configured venue. Returns `belongs:false`
 * for foreign markets and errors (treated as not-found) for ids that don't
 * resolve to a real market.
 */
export function useMarketVenueAccess(marketId: string | undefined) {
  const publicClient = usePublicClient();
  const venueId = getVenueId();

  let idBig: bigint | undefined;

  try {
    idBig = marketId ? BigInt(marketId) : undefined;
  } catch {
    idBig = undefined;
  }

  return useQuery<MarketVenueAccess>({
    queryKey: [
      "markets",
      "venueAccess",
      marketId ?? "none",
      venueId?.toString() ?? "none",
    ],
    queryFn: async () => {
      const registry = (await publicClient!.readContract({
        address: DIAMOND_ADDRESS,
        abi: MarketsFacetABI,
        functionName: "getMarketRegistryData",
        args: [idBig!],
      })) as { venueId?: bigint };

      const marketVenueId = BigInt(registry.venueId ?? 0);

      return {
        marketVenueId,
        belongs: venueId !== undefined && marketVenueId === venueId,
      };
    },
    enabled: !!publicClient && idBig !== undefined && venueId !== undefined,
    staleTime: Infinity,
    gcTime: 60 * 60 * 1000,
    // One retry to ride out a transient RPC blip before we treat the market as
    // unverifiable (and therefore not-found).
    retry: 1,
  });
}
