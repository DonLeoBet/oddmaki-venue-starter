"use client";

import type { PythLivePrice } from "./usePythLivePrice";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/oddmaki/queryKeys";

const PYTH_HERMES_BASE = "https://hermes.pyth.network";

/**
 * Fetch the Pyth price for `feedId` at (or just after) a past `timestamp`
 * (unix seconds). Used to show a market's *close price* — the asset price at
 * its closeTime — once it has expired, so arrivals see how it ended rather
 * than the still-moving live price.
 */
async function fetchPythPriceAt(
  feedId: string,
  timestamp: number,
): Promise<PythLivePrice> {
  const res = await fetch(
    `${PYTH_HERMES_BASE}/v2/updates/price/${timestamp}?ids[]=${feedId}`,
  );

  if (!res.ok) {
    throw new Error(`Pyth Hermes error (${res.status})`);
  }
  const data = await res.json();
  const parsed = data?.parsed?.[0];

  if (!parsed?.price) {
    throw new Error("No price data returned from Pyth");
  }

  const expo = parsed.price.expo as number;
  const factor = Math.pow(10, expo);

  return {
    price: Number(parsed.price.price) * factor,
    publishTime: parsed.price.publish_time as number,
    confidence: Number(parsed.price.conf) * factor,
  };
}

/**
 * Query the asset price at a fixed past timestamp. The value is immutable once
 * the timestamp is in the past, so it never refetches. Pass `enabled: false`
 * (e.g. while the market is still live) to skip the request entirely.
 */
export function usePythPriceAt(
  feedId: string | undefined,
  timestamp: number | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.pyth.priceAt(feedId ?? "", timestamp ?? 0),
    queryFn: () => fetchPythPriceAt(feedId!, timestamp!),
    enabled: enabled && !!feedId && !!timestamp && timestamp > 0,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
