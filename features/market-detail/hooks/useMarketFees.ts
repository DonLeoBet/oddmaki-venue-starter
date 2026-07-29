"use client";

import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import { MarketsFacetABI, OPERATOR_FEE_BPS } from "@oddmaki-protocol/sdk";

import { queryKeys } from "@/lib/oddmaki/queryKeys";
import { DIAMOND_ADDRESS } from "@/lib/oddmaki/constants";

export interface MarketFees {
  protocolFeeBps: bigint;
  venueFeeBps: bigint;
  operatorFeeBps: bigint;
  /** Sum of all three — what the matching engine uses for mint/merge feasibility. */
  totalFeeBps: bigint;
}

/**
 * Read the per-market snapshotted fees from the Diamond. Fees are fixed at
 * market creation, so this is safe to cache aggressively.
 */
export function useMarketFees(marketId: string | bigint | undefined) {
  const publicClient = usePublicClient();
  const idBig = marketId != null ? BigInt(marketId) : undefined;

  return useQuery<MarketFees>({
    queryKey:
      idBig != null
        ? queryKeys.markets.registry(idBig)
        : ["markets", "registry", "none"],
    queryFn: async () => {
      const registry = (await publicClient!.readContract({
        address: DIAMOND_ADDRESS,
        abi: MarketsFacetABI,
        functionName: "getMarketRegistryData",
        args: [idBig!],
      })) as any;

      const protocolFeeBps = BigInt(registry.protocolFeeBps ?? 0);
      const venueFeeBps = BigInt(registry.venueFeeBps ?? 0);
      const operatorFeeBps = OPERATOR_FEE_BPS;

      return {
        protocolFeeBps,
        venueFeeBps,
        operatorFeeBps,
        totalFeeBps: protocolFeeBps + venueFeeBps + operatorFeeBps,
      };
    },
    enabled: !!publicClient && idBig != null,
    staleTime: Infinity,
    gcTime: 60 * 60 * 1000,
  });
}
