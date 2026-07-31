"use client";

import type { MarketTypeId } from "@/config/marketTypes";
import { inferMarketTypeFromName } from "@/config/marketTypes";
import { leagueSlugTag, parseLeagueSlugFromTags } from "@/config/leagues";
import { parseFixtureTitle } from "@/lib/football/fixture-metadata";
import type { FormattedMarketGroup } from "@/features/market-groups/types";

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
  const tagSlug = parseLeagueSlugFromTags(tags);
  if (tagSlug !== leagueSlug && !tags.includes(leagueSlugTag(leagueSlug))) {
    return null;
  }

  const parsed = parseFixtureTitle(group.marketQuestion);
  const home = parsed?.home ?? "Home";
  const away = parsed?.away ?? "Away";
  const kickoffTag = tags.find((t) => t.startsWith("kickoff-"));
  const kickoffUnix = kickoffTag ? Number(kickoffTag.slice(8)) : 0;

  const matchingMarkets = group.outcomes.filter((o) => {
    if (o.isPlaceholder) return false;
    return inferMarketTypeFromName(o.name) === marketType;
  });

  if (matchingMarkets.length === 0) return null;

  return {
    groupId: group.groupId,
    fixtureTitle: group.marketQuestion,
    home,
    away,
    kickoffUnix,
    leagueSlug,
    markets: matchingMarkets.map((o) => ({
      marketId: o.marketId,
      name: o.name,
      yesPrice: o.probability,
      noPrice: Math.max(0, 100 - o.probability),
    })),
  };
}
