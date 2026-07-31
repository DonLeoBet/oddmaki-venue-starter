"use client";

import type { OddMakiClient } from "@oddmaki-protocol/sdk";

import { useQuery } from "@tanstack/react-query";

import type { Locale } from "@/config/locales";
import { useOddMakiClient } from "@/lib/oddmaki/hooks";
import { getVenueId } from "@/config/venue.config";
import { queryKeys } from "@/lib/oddmaki/queryKeys";
import { useBrand } from "@/features/brand/hooks/useBrand";
import {
  toMarketSearchRecord,
  type MarketSearchRecord,
} from "../utils/matchMarketSearch";

const PAGE_SIZE = 100;
const MAX_GROUPS = 1000;

async function fetchMarketSearchIndex(
  client: OddMakiClient,
  venueId: bigint,
  locale: Locale,
): Promise<MarketSearchRecord[]> {
  const records: MarketSearchRecord[] = [];

  for (let skip = 0; skip < MAX_GROUPS; skip += PAGE_SIZE) {
    const result = (await client.public.getMarketGroups({
      venueId,
      first: PAGE_SIZE,
      skip,
    })) as {
      marketGroups?: Array<{
        groupId?: string | bigint;
        marketQuestion?: string;
        tags?: string[];
        status?: string;
      }>;
    };

    const batch = result.marketGroups ?? [];

    if (batch.length === 0) break;

    for (const raw of batch) {
      const formatted = client.public.formatMarketGroupForDisplay(raw) as {
        groupId: string;
        marketQuestion: string;
        status: string;
      };

      records.push(
        toMarketSearchRecord(
          String(formatted.groupId ?? raw.groupId),
          formatted.marketQuestion ?? raw.marketQuestion ?? "",
          raw.tags ?? [],
          formatted.status ?? raw.status ?? "Active",
          locale,
        ),
      );
    }

    if (batch.length < PAGE_SIZE) break;
  }

  return records;
}

export function useMarketSearchIndex() {
  const client = useOddMakiClient();
  const venueId = getVenueId();
  const { locale } = useBrand();

  return useQuery({
    queryKey: queryKeys.marketSearch.index(venueId?.toString(), locale),
    queryFn: () => fetchMarketSearchIndex(client, venueId!, locale),
    enabled: !!client && venueId !== undefined,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
  });
}
