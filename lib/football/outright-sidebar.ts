import type { FormattedMarketGroup } from "@/features/market-groups/types";

import { LEAGUE_BY_ID } from "@/config/leagues";
import { getTopLeagueById } from "@/config/top-leagues";
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

export function countryTagToSlug(countryTag: string): string {
  return countryTag
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function countryTagToLabel(countryTag: string): string {
  const base = countryTag.replace(/ Football$/, "").trim();

  if (base === "US") return "United States";
  if (base === "South American") return "South America";
  if (base === "European") return "Europe";

  return base;
}

function resolveLeagueSlug(leagueId: number, leagueName: string): string {
  return LEAGUE_BY_ID[leagueId]?.slug ?? `league-${leagueId}`;
}

/** Group on-chain outright markets into Football → Countries → leagues. */
export function buildOutrightCountryTree(
  groups: FormattedMarketGroup[],
): OutrightCountryNavItem[] {
  const byCountry = new Map<
    string,
    Map<number, OutrightLeagueNavItem>
  >();

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

    if (!byCountry.has(countryTag)) {
      byCountry.set(countryTag, new Map());
    }

    const leagues = byCountry.get(countryTag)!;

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
    .map(([countryTag, leaguesMap]) => ({
      countryTag,
      countrySlug: countryTagToSlug(countryTag),
      countryLabel: countryTagToLabel(countryTag),
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
    if (tag.endsWith(" Football") && countryTagToSlug(tag) === countrySlug) {
      return true;
    }
  }

  const outrightTag = tags.find((tag) => tag.startsWith("outright-"));
  const parsed = outrightTag ? parseOutrightTag(outrightTag) : null;

  if (parsed?.leagueId != null) {
    const topLeague = getTopLeagueById(parsed.leagueId);

    if (topLeague && countryTagToSlug(topLeague.countryTag) === countrySlug) {
      return true;
    }
  }

  return false;
}
