"use client";

import type { MarketTypeId } from "@/config/marketTypes";
import { parseFixtureTitle } from "@/lib/football/fixture-metadata";
import { parseSubMarketIdentity } from "@/lib/markets/marketDisplay";
import type { FormattedMarketGroup } from "@/features/market-groups/types";
import {
  filterCanonicalSubMarkets,
  groupMatchesLeagueSlug,
  isNewTaxonomyMatchGroup,
  isOutrightGroup,
} from "@/lib/markets/marketFilters";

export interface CategoryMarketRow {
  groupId: string;
  fixtureTitle: string;
  home: string;
  away: string;
  kickoffUnix: number;
  leagueSlug: string;
  markets: Array<{
    marketId: string;
    name: string;
    yesPrice: number;
    noPrice: number;
  }>;
}

export function filterGroupForCategory(
  group: FormattedMarketGroup,
  leagueSlug: string,
  marketType: MarketTypeId,
): CategoryMarketRow | null {
  const tags = group.tags ?? [];

  if (isOutrightGroup(tags)) return null;
  if (!groupMatchesLeagueSlug(tags, leagueSlug)) return null;
  if (!isNewTaxonomyMatchGroup(tags, group.outcomes)) return null;

  const parsed = parseFixtureTitle(group.marketQuestion);
  const home = parsed?.home ?? "Home";
  const away = parsed?.away ?? "Away";
  const kickoffTag = tags.find((tag) => tag.startsWith("kickoff-"));
  const kickoffUnix = kickoffTag ? Number(kickoffTag.slice(8)) : 0;

  const matchingMarkets = filterCanonicalSubMarkets(group.outcomes).filter(
    (outcome) => parseSubMarketIdentity(outcome.name)?.marketType === marketType,
  );

  if (matchingMarkets.length === 0) return null;

  return {
    groupId: group.groupId,
    fixtureTitle: group.marketQuestion,
    home,
    away,
    kickoffUnix,
    leagueSlug,
    markets: matchingMarkets.map((outcome) => ({
      marketId: outcome.marketId,
      name: outcome.name,
      yesPrice: outcome.probability,
      noPrice: Math.max(0, 100 - outcome.probability),
    })),
  };
}
