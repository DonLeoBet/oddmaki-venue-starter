"use client";

import type { FormattedMarketGroup } from "@/features/market-groups/types";
import { formatMarketGroup } from "../utils/formatMarketGroup";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import type { OddMakiClient } from "@oddmaki-protocol/sdk";

import { useOddMakiClient } from "@/lib/oddmaki/hooks";
import { getVenueId } from "@/config/venue.config";
import { queryKeys } from "@/lib/oddmaki/queryKeys";
import {
  buildMaxOutrightRevisionMap,
  isOutrightGroup,
  isSupersededOutrightInBatch,
} from "@/lib/markets/marketFilters";
import { isPublicOutrightGroup } from "@/config/outrights.config";

const PAGE_SIZE = 100;
/** Cap outright scan — homepage/sidebar only need public Active outrights. */
const MAX_PAGES = 5;

async function fetchOutrightMarketGroups(
  client: OddMakiClient,
  venueId: bigint,
): Promise<FormattedMarketGroup[]> {
  const groups: FormattedMarketGroup[] = [];

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const skip = page * PAGE_SIZE;
    const result = (await client.public.getMarketGroups({
      venueId,
      first: PAGE_SIZE,
      skip,
    })) as {
      marketGroups?: Array<Record<string, unknown>>;
    };

    const batch = result.marketGroups ?? [];

    if (batch.length === 0) break;

    for (const raw of batch) {
      const tags = (raw.tags as string[] | undefined) ?? [];

      if (!isOutrightGroup(tags)) continue;

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

      groups.push(formatMarketGroup(formatted, raw));
    }

    if (batch.length < PAGE_SIZE) break;
  }

  const maxRevision = buildMaxOutrightRevisionMap(
    groups.map((group) => ({ tags: group.tags })),
  );

  return groups.filter(
    (group) =>
      !isSupersededOutrightInBatch(group.tags, maxRevision) &&
      isPublicOutrightGroup(group.tags),
  );
}

/** Dedicated outright fetch — unified feed pagination often omits long-term odds. */
export function useOutrightGroups(status: string = "Active") {
  const client = useOddMakiClient();
  const venueId = getVenueId();

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.marketGroups.outrights(venueId?.toString(), status),
    queryFn: () => fetchOutrightMarketGroups(client, venueId!),
    enabled: !!client && venueId !== undefined,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const groups = useMemo(() => {
    if (!data) return [] as FormattedMarketGroup[];

    return [...data]
      .filter((group) => group.status === status)
      .sort(
        (a, b) => parseFloat(b.totalVolume ?? "0") - parseFloat(a.totalVolume ?? "0"),
      );
  }, [data, status]);

  return { groups, isLoading, error };
}
