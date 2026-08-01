import type { FormattedMarketGroup } from "@/features/market-groups/types";

import { LEAGUE_BY_ID } from "@/config/leagues";
import { getTopLeagueById } from "@/config/top-leagues";
import {
  countryTagToKey,
  countryTagToLabel,
  countryTagToSlug,
} from "@/lib/football/country-labels";
import { getOutrightCardMeta } from "@/lib/football/outright-display";
import { parseOutrightTag } from "@/lib/markets/marketFilters";

export interface OutrightLeagueNavItem {
  leagueId: number;
  leagueName: string;
  leagueSlug: string;
  href: string;
}

export interface OutrightCountryNavItem {
  countrySlug: string;
  countryLabel: string;
  countryTag: string;
  leagues: OutrightLeagueNavItem[];
}

export { countryTagToLabel, countryTagToSlug } from "@/lib/football/country-labels";

function resolveLeagueSlug(leagueId: number, leagueName: string): string {
  return LEAGUE_BY_ID[leagueId]?.slug ?? `league-${leagueId}`;
}

/** Group on-chain outright markets into Football → Countries → leagues. */
export function buildOutrightCountryTree(
  groups: FormattedMarketGroup[],
): OutrightCountryNavItem[] {
  const byCountry = new Map<string, Map<number, OutrightLeagueNavItem>>();
  const countryLabels = new Map<string, string>();

  for (const group of groups) {
    const tags = group.tags ?? [];
    const meta = getOutrightCardMeta(tags, group.marketQuestion);
    const parsed = tags
      .map((tag) => parseOutrightTag(tag))
      .find((entry) => entry != null);
    const leagueId = meta.leagueId ?? parsed?.leagueId ?? null;

    if (leagueId == null) continue;

    const topLeague = getTopLeagueById(leagueId);
    const countryTag =
      topLeague?.countryTag ??
      tags.find(
        (tag) =>
          tag.endsWith(" Football") &&
          tag !== "sports" &&
          !tag.startsWith("outright-"),
      ) ??
      "International Football";

    const leagueName = topLeague?.tag ?? meta.leagueName;
    const leagueSlug = resolveLeagueSlug(leagueId, leagueName);

    const countryKey = countryTagToKey(countryTag);

    if (!byCountry.has(countryKey)) {
      byCountry.set(countryKey, new Map());
      countryLabels.set(countryKey, countryTagToLabel(countryTag));
    }

    const leagues = byCountry.get(countryKey)!;

    if (!leagues.has(leagueId)) {
      leagues.set(leagueId, {
        leagueId,
        leagueName,
        leagueSlug,
        href: `/?category=outrights&league=${leagueSlug}`,
      });
    }
  }

  return Array.from(byCountry.entries())
    .map(([countryKey, leaguesMap]) => ({
      countryTag: countryLabels.get(countryKey) ?? countryKey,
      countrySlug: countryKey,
      countryLabel: countryLabels.get(countryKey) ?? countryKey,
      leagues: Array.from(leaguesMap.values()).sort((a, b) =>
        a.leagueName.localeCompare(b.leagueName),
      ),
    }))
    .sort((a, b) => a.countryLabel.localeCompare(b.countryLabel));
}

export function groupMatchesCountryTag(
  tags: string[] | undefined,
  countrySlug: string,
): boolean {
  if (!tags?.length) return false;

  for (const tag of tags) {
    if (
      tag.endsWith(" Football") &&
      tag !== "sports" &&
      !tag.startsWith("outright-") &&
      countryTagToSlug(tag) === countrySlug
    ) {
      return true;
    }
  }

  const outrightTag = tags.find((tag) => tag.startsWith("outright-"));
  const parsed = outrightTag ? parseOutrightTag(outrightTag) : null;

  if (parsed?.leagueId != null) {
    const topLeague = getTopLeagueById(parsed.leagueId);

    if (
      topLeague &&
      countryTagToSlug(topLeague.countryTag) === countrySlug
    ) {
      return true;
    }
  }

  return false;
}
