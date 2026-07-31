import type { MarketTypeId } from "@/config/marketTypes";
import {
  MARKET_TYPES,
  getOutcomeLabel,
  getMarketTabLabel,
} from "@/config/marketTypes";
import type { Locale } from "@/config/locales";
import { getTeamLogo } from "@/lib/football/team-logo";

export interface SubMarketIdentity {
  marketType: MarketTypeId;
  outcomeKey: string;
}

/** Legacy English suffix → canonical outcome key. */
const LEGACY_SUFFIX_TO_KEY: Record<string, string> = {
  yes: "yes",
  no: "no",
  over: "over",
  under: "under",
  draw: "draw",
  "1x": "1x",
  "12": "12",
  "x2": "x2",
};

function normalizeLegacySuffix(raw: string): string {
  const lower = raw.trim().toLowerCase();
  return LEGACY_SUFFIX_TO_KEY[lower] ?? lower;
}

export interface FixtureTeamSide {
  name: string;
  id?: number;
  logo?: string | null;
}

export interface FixtureTeams {
  home: FixtureTeamSide;
  away: FixtureTeamSide;
}

function resolveOutcomeDisplay(
  marketType: MarketTypeId,
  outcomeKey: string,
  locale: Locale,
  teams?: FixtureTeams,
): string {
  if (teams) {
    if (outcomeKey === "home") return teams.home.name;
    if (outcomeKey === "away") return teams.away.name;
  }
  return getOutcomeLabel(marketType, outcomeKey, locale);
}

/** Team crest for team-specific outcome rows (1x2, DNB, Double Chance). */
export function getOutcomeTeamLogo(
  marketType: MarketTypeId | null | undefined,
  outcomeKey: string | null | undefined,
  teams?: FixtureTeams,
): string | null {
  if (!marketType || !outcomeKey || !teams) return null;

  if (marketType === "1x2") {
    if (outcomeKey === "home") return getTeamLogo(teams.home);
    if (outcomeKey === "away") return getTeamLogo(teams.away);
    return null;
  }

  if (marketType === "dnb") {
    if (outcomeKey === "home") return getTeamLogo(teams.home);
    if (outcomeKey === "away") return getTeamLogo(teams.away);
    return null;
  }

  if (marketType === "double_chance") {
    if (outcomeKey === "1x") return getTeamLogo(teams.home);
    if (outcomeKey === "x2") return getTeamLogo(teams.away);
    return null;
  }

  return null;
}

export function isTeamSpecificMarketType(
  marketType: MarketTypeId | null | undefined,
): boolean {
  return marketType === "1x2" || marketType === "dnb" || marketType === "double_chance";
}

/**
 * Parse a sub-market name into canonical marketType + outcomeKey.
 * Supports new format (`btts:yes`) and legacy bot names (`BTTS · Yes`).
 */
export function parseSubMarketIdentity(name: string): SubMarketIdentity | null {
  const trimmed = name.trim();
  const canonical = trimmed.match(/^([a-z0-9_]+):([a-z0-9]+)$/i);
  if (canonical) {
    const marketType = canonical[1] as MarketTypeId;
    if (marketType in MARKET_TYPES) {
      return { marketType, outcomeKey: canonical[2].toLowerCase() };
    }
  }

  for (const def of Object.values(MARKET_TYPES)) {
    if (trimmed.startsWith(def.legacyNamePrefix)) {
      const suffix = trimmed.slice(def.legacyNamePrefix.length).trim();
      const outcomeKey = normalizeLegacySuffix(suffix);
      if (def.outcomeKeys.includes(outcomeKey)) {
        return { marketType: def.id, outcomeKey };
      }
    }
  }

  if (!trimmed.includes(" · ") && !trimmed.includes(":")) {
    return { marketType: "1x2", outcomeKey: "home" };
  }

  return null;
}

/** Compact outcome label for overview/list pages (draw → X, team names for 1X2). */
export function formatOverviewOutcomeLabel(
  marketType: MarketTypeId,
  outcomeKey: string,
  locale: Locale,
  teams?: FixtureTeams,
): string {
  if (marketType === "1x2" && outcomeKey === "draw") {
    return "X";
  }

  if (marketType === "double_chance") {
    const key = outcomeKey.toLowerCase();

    if (key === "1x") return "1X";
    if (key === "12") return "12";
    if (key === "x2") return "X2";
  }

  return resolveOutcomeDisplay(marketType, outcomeKey, locale, teams);
}

/** Localized label for one sub-market row (outcome selection). */
export function formatSubMarketLabel(
  name: string,
  locale: Locale,
  teams?: FixtureTeams,
): string {
  const trimmed = name.trim();
  const canonical = trimmed.match(/^([a-z0-9_]+):([a-z0-9]+)$/i);
  if (canonical) {
    const marketType = canonical[1] as MarketTypeId;
    const outcomeKey = canonical[2].toLowerCase();
    if (marketType in MARKET_TYPES) {
      return resolveOutcomeDisplay(marketType, outcomeKey, locale, teams);
    }
  }

  for (const def of Object.values(MARKET_TYPES)) {
    if (trimmed.startsWith(def.legacyNamePrefix)) {
      const suffix = trimmed.slice(def.legacyNamePrefix.length).trim();
      const outcomeKey = normalizeLegacySuffix(suffix);
      if (def.outcomeKeys.includes(outcomeKey)) {
        return resolveOutcomeDisplay(def.id, outcomeKey, locale, teams);
      }
      return suffix;
    }
  }

  return name;
}

/** Tab/section title for a market type. */
export function formatMarketTypeTabLabel(
  marketType: MarketTypeId,
  locale: Locale,
): string {
  return getMarketTabLabel(marketType, locale);
}

export function inferMarketTypeFromSubMarketName(
  name: string,
): MarketTypeId | null {
  const identity = parseSubMarketIdentity(name);
  if (identity) return identity.marketType;

  for (const def of Object.values(MARKET_TYPES)) {
    if (name.trim().startsWith(def.legacyNamePrefix)) return def.id;
  }

  if (!name.includes(" · ") && !name.includes(":")) return "1x2";

  return null;
}
