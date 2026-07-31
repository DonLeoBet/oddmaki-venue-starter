import type { FormattedMarketGroup } from "@/features/market-groups/types";
import type { Market } from "@/features/markets/types";

import { parseAncillaryData } from "@oddmaki-protocol/sdk";

import { calculateMarketPrices, formatVolume } from "./formatting";

/**
 * Transform SDK-formatted group data into FormattedMarketGroup.
 * Shared by unified feed and category market queries.
 */
export function formatMarketGroup(
  sdkFormatted: {
    groupId: string;
    marketQuestion: string;
    status: string;
    totalMarkets?: string;
    activeMarketCount?: string;
    resolvedMarketId?: string;
    createdAt?: string;
    outcomes?: Array<{
      marketId: string;
      name: string;
      question?: string;
      probability?: string;
      status: string;
      totalVolume?: string;
    }>;
  },
  rawGroup: {
    venue?: { venueId?: string | bigint | null };
    tags?: string[];
    activatedAt?: string | null;
    resolvedAt?: string | null;
    creator?: { address?: string };
    markets?: Array<{ totalVolume?: string }>;
  },
): FormattedMarketGroup {
  const outcomes = (sdkFormatted.outcomes || []).map((outcome) => ({
    marketId: outcome.marketId,
    name: outcome.name,
    question: outcome.question || "",
    probability: outcome.probability ? parseFloat(outcome.probability) * 100 : 0,
    status: outcome.status,
    totalVolume: outcome.totalVolume || "0",
    volumeFormatted: formatVolume(outcome.totalVolume || "0", 6),
    isPlaceholder: false,
  }));

  const totalVolume = (rawGroup.markets || [])
    .reduce(
      (sum, market) => sum + parseFloat(market.totalVolume || "0"),
      0,
    )
    .toString();

  return {
    groupId: sdkFormatted.groupId,
    venueId: rawGroup.venue?.venueId?.toString() ?? null,
    marketQuestion: sdkFormatted.marketQuestion,
    status: sdkFormatted.status as FormattedMarketGroup["status"],
    totalMarkets: sdkFormatted.totalMarkets || "0",
    activeMarketCount: sdkFormatted.activeMarketCount || "0",
    resolvedMarketId: sdkFormatted.resolvedMarketId || "0",
    tags: rawGroup.tags || [],
    createdAt: sdkFormatted.createdAt || "0",
    activatedAt: rawGroup.activatedAt || null,
    resolvedAt: rawGroup.resolvedAt || null,
    creator: rawGroup.creator?.address || "",
    outcomes,
    totalVolume,
    volumeFormatted: formatVolume(totalVolume, 6),
  };
}

export function formatStandaloneMarket(market: Market) {
  const { yesPrice, noPrice } = calculateMarketPrices(market);
  const { title } = parseAncillaryData(market.question);

  return {
    ...market,
    question: title,
    yesPrice,
    noPrice,
    volumeFormatted: formatVolume(market.totalVolume || "0", 6),
  };
}
