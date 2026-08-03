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
import { isMatchMarketsUiEnabled } from "@/config/matchMarkets.config";
import {
  buildMaxOutrightRevisionMap,
  isNewTaxonomyMatchGroup,
  isOutrightGroup,
  isSupersededOutrightInBatch,
} from "@/lib/markets/marketFilters";
import { isPublicOutrightGroup } from "@/config/outrights.config";

const PAGE_SIZE = 100;
const MAX_GROUPS = 1000;

async function fetchMarketSearchIndex(
  client: OddMakiClient,
  venueId: bigint,
  locale: Locale,
): Promise<MarketSearchRecord[]> {
  const records: MarketSearchRecord[] = [];
  const rawGroups: Array<{
    formatted: {
      groupId: string;
      marketQuestion: string;
      status: string;
      outcomes?: Array<{ name: string; isPlaceholder?: boolean }>;
    };
    tags: string[];
    outcomes: Array<{ name: string }>;
  }> = [];

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
        markets?: Array<{ marketName?: string; name?: string }>;
      }>;
    };

    const batch = result.marketGroups ?? [];

    if (batch.length === 0) break;

    for (const raw of batch) {
      const formatted = client.public.formatMarketGroupForDisplay(raw) as {
        groupId: string;
        marketQuestion: string;
        status: string;
        outcomes?: Array<{ name: string; isPlaceholder?: boolean }>;
      };

      const tags = raw.tags ?? [];
      const outcomes = (formatted.outcomes ?? raw.markets ?? []).map(
        (outcome: { name?: string; marketName?: string }) => ({
          name: outcome.name ?? outcome.marketName ?? "",
        }),
      );

      rawGroups.push({ formatted, tags, outcomes });
    }

    if (batch.length < PAGE_SIZE) break;
  }

  const maxRevision = buildMaxOutrightRevisionMap(
    rawGroups.map((entry) => ({ tags: entry.tags })),
  );

  const matchesEnabled = isMatchMarketsUiEnabled();

  for (const { formatted, tags, outcomes } of rawGroups) {
    if (isOutrightGroup(tags)) {
      if (!isPublicOutrightGroup(tags)) continue;
      if (isSupersededOutrightInBatch(tags, maxRevision)) continue;
    } else {
      // Single-match markets are permanently excluded from search.
      if (!matchesEnabled) continue;
      if (!isNewTaxonomyMatchGroup(tags, outcomes)) continue;
    }

    records.push(
      toMarketSearchRecord(
        String(formatted.groupId ?? ""),
        formatted.marketQuestion ?? "",
        tags,
        formatted.status ?? "Active",
        locale,
      ),
    );
  }

  return records;
}

export function useMarketSearchIndex() {
  const client = useOddMakiClient();
  const venueId = getVenueId();
  const { locale } = useBrand();

  return useQuery({
    queryKey: queryKeys.marketSearch.index(
      venueId?.toString(),
      locale,
      isMatchMarketsUiEnabled() ? "matches-on" : "matches-off",
    ),
    queryFn: () => fetchMarketSearchIndex(client, venueId!, locale),
    enabled: !!client && venueId !== undefined,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
  });
}
