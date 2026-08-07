"use client";

import type {
  FormattedMarketGroup,
  FormattedGroupOutcome,
  MarketGroupStatus,
} from "../types";

import { useQuery } from "@tanstack/react-query";

import { useOddMakiClient } from "@/lib/oddmaki/hooks";
import { queryKeys } from "@/lib/oddmaki/queryKeys";
import { formatVolume } from "@/features/markets/utils/formatting";

export function useMarketGroupDetail(groupId: string) {
  const client = useOddMakiClient();

  return useQuery<FormattedMarketGroup | null>({
    queryKey: queryKeys.marketGroups.detail(groupId),
    queryFn: async () => {
      const group = await client.public.getMarketGroup(BigInt(groupId));

      if (!group) return null;

      const formatted = client.public.formatMarketGroupForDisplay(group);

      const outcomes: FormattedGroupOutcome[] = (formatted.outcomes || []).map(
        (o: any) => ({
          marketId: o.marketId,
          name: o.name,
          question: o.question || "",
          probability: o.probability ? parseFloat(o.probability) * 100 : 0,
          status: o.status,
          totalVolume: o.totalVolume || "0",
          volumeFormatted: formatVolume(o.totalVolume || "0", 6),
          isPlaceholder: false,
        }),
      );

      // Sum volume and unique traders across all child markets

      const totalVolume = (group.markets || [])
        .reduce(
          (sum: number, m: any) => sum + parseFloat(m.totalVolume || "0"),
          0,
        )
        .toString();

      const participantCount = (group.markets || []).reduce(
        (sum: number, m: any) => sum + parseInt(m.uniqueTraders || "0", 10),
        0,
      );

      return {
        groupId: formatted.groupId,
        venueId:
          (group as { venue?: { venueId?: string } }).venue?.venueId ?? null,
        marketQuestion: formatted.marketQuestion,
        status: formatted.status as MarketGroupStatus,
        totalMarkets: formatted.totalMarkets || "0",
        activeMarketCount: formatted.activeMarketCount || "0",
        resolvedMarketId: formatted.resolvedMarketId || "0",
        tags: group.tags || [],
        createdAt: formatted.createdAt || "0",
        activatedAt: group.activatedAt || null,
        resolvedAt: group.resolvedAt || null,
        creator: group.creator?.address || "",
        outcomes,
        totalVolume,
        volumeFormatted: formatVolume(totalVolume, 6),
        participantCount,
      };
    },
    enabled: !!groupId && !!client,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}
