import type { UnifiedFeedItem } from "../types";

import { FEATURED_CLUB_NAME_PATTERNS } from "@/config/featuredClubs";
import { parseFixtureTitle } from "@/lib/football/fixture-metadata";
import { isOutrightGroup } from "@/lib/markets/marketFilters";

function teamMatchesFeaturedPattern(teamName: string): boolean {
  const lower = teamName.toLowerCase();

  return FEATURED_CLUB_NAME_PATTERNS.some((pattern) =>
    lower.includes(pattern.toLowerCase()),
  );
}

export function getMatchTeamsFromFeedItem(
  item: UnifiedFeedItem,
): { home: string; away: string } | null {
  if (item.type !== "group" || isOutrightGroup(item.data.tags)) {
    return null;
  }

  return parseFixtureTitle(item.data.marketQuestion);
}

export function isFeaturedMatch(item: UnifiedFeedItem): boolean {
  const teams = getMatchTeamsFromFeedItem(item);

  if (!teams) return false;

  return (
    teamMatchesFeaturedPattern(teams.home) ||
    teamMatchesFeaturedPattern(teams.away)
  );
}

export function filterFeaturedMatches(
  items: UnifiedFeedItem[],
  options?: { maxItems?: number },
): UnifiedFeedItem[] {
  const maxItems = options?.maxItems ?? 24;
  const featured = items.filter(isFeaturedMatch);
  const result = featured.length > 0 ? featured : items;

  return result.slice(0, maxItems);
}
