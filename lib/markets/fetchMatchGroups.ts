import type { OddMakiClient } from "@oddmaki-protocol/sdk";

import type { FormattedMarketGroup } from "@/features/market-groups/types";
import { formatMarketGroup } from "@/features/markets/utils/formatMarketGroup";
import { isOutrightGroup } from "@/lib/markets/marketFilters";

const FEED_PAGE_SIZE = 50;

/**
 * Paginate the unified feed (volume-sorted) and collect all non-outright match groups.
 * Category pages must use the same source as the homepage — plain getMarketGroups
 * pagination caps at 1000 and misses high-volume leagues like PL / Serie A.
 */
export async function fetchAllMatchGroupsFromUnifiedFeed(
  client: OddMakiClient,
  venueId: bigint,
  sortBy: "volume" | "created" = "volume",
): Promise<FormattedMarketGroup[]> {
  const byId = new Map<string, FormattedMarketGroup>();
  let skip = 0;

  while (true) {
    const feedData = await client.public.getUnifiedMarketFeed({
      venueId,
      first: FEED_PAGE_SIZE,
      skip,
      sortBy,
    });

    const batch = feedData?.marketGroups ?? [];

    for (const raw of batch) {
      const tags = (raw.tags as string[] | undefined) ?? [];

      if (isOutrightGroup(tags)) continue;

      const formatted = client.public.formatMarketGroupForDisplay(raw) as {
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
      };

      byId.set(formatted.groupId, formatMarketGroup(formatted, raw));
    }

    if (batch.length < FEED_PAGE_SIZE) break;

    skip += FEED_PAGE_SIZE;
  }

  return Array.from(byId.values());
}
