/**
 * Canonical football market-type taxonomy for match groups.
 * Labels live in marketTypeLabels — on-chain data uses canonical keys only.
 */

import {
  ALL_SUPPORTED_LOCALES,
  type Locale,
  resolveLocale,
} from "./locales";
import { marketTypeLabels, type MarketTypeLocaleLabels } from "./marketTypeLabels";

export type { Locale, SupportedLang } from "./locales";

export type MarketTypeId =
  | "beat"
  | "1x2"
  | "btts"
  | "ou15"
  | "ou25"
  | "ou35"
  | "double_chance"
  | "dnb";

export interface MarketTypeDef {
  id: MarketTypeId;
  /** Legacy English prefix in older on-chain sub-market names. */
  legacyNamePrefix: string;
  outcomeKeys: readonly string[];
  sortOrder: number;
}

export const MARKET_TYPES: Record<MarketTypeId, MarketTypeDef> = {
  beat: {
    id: "beat",
    legacyNamePrefix: "Beat ·",
    outcomeKeys: ["yes", "no"],
    sortOrder: 0,
  },
  "1x2": {
    id: "1x2",
    legacyNamePrefix: "1X2 ·",
    outcomeKeys: ["home", "draw", "away"],
    sortOrder: 1,
  },
  btts: {
    id: "btts",
    legacyNamePrefix: "BTTS ·",
    outcomeKeys: ["yes", "no"],
    sortOrder: 2,
  },
  ou15: {
    id: "ou15",
    legacyNamePrefix: "O/U 1.5 ·",
    outcomeKeys: ["over", "under"],
    sortOrder: 3,
  },
  ou25: {
    id: "ou25",
    legacyNamePrefix: "O/U 2.5 ·",
    outcomeKeys: ["over", "under"],
    sortOrder: 4,
  },
  ou35: {
    id: "ou35",
    legacyNamePrefix: "O/U 3.5 ·",
    outcomeKeys: ["over", "under"],
    sortOrder: 5,
  },
  double_chance: {
    id: "double_chance",
    legacyNamePrefix: "DC ·",
    outcomeKeys: ["1x", "12", "x2"],
    sortOrder: 6,
  },
  dnb: {
    id: "dnb",
    legacyNamePrefix: "DNB ·",
    outcomeKeys: ["home", "away"],
    sortOrder: 7,
  },
};

export const ALL_MARKET_TYPE_IDS = Object.keys(MARKET_TYPES) as MarketTypeId[];

/** Canonical on-chain sub-market name: `{marketType}:{outcomeKey}`. */
export function canonicalSubMarketName(
  marketType: MarketTypeId,
  outcomeKey: string,
): string {
  return `${marketType}:${outcomeKey}`;
}

export function getMarketTypeDef(id: MarketTypeId): MarketTypeDef {
  return MARKET_TYPES[id];
}

export function getAllSupportedLocales(): Locale[] {
  return [...ALL_SUPPORTED_LOCALES];
}

function labelsFor(
  marketType: MarketTypeId,
  locale: Locale,
): MarketTypeLocaleLabels {
  const pack = marketTypeLabels[marketType] as Partial<
    Record<Locale, MarketTypeLocaleLabels>
  > & { en: MarketTypeLocaleLabels };

  return pack[locale] ?? pack.en;
}

export function getMarketLabels(
  marketType: MarketTypeId,
  locale: Locale = "en",
): MarketTypeLocaleLabels {
  return labelsFor(marketType, resolveLocale(locale));
}

export function getMarketTitle(
  marketType: MarketTypeId,
  locale: Locale = "en",
): string {
  return getMarketLabels(marketType, locale).title;
}

export function getMarketTabLabel(
  marketType: MarketTypeId,
  locale: Locale = "en",
): string {
  return getMarketLabels(marketType, locale).tabLabel;
}

export function getOutcomeLabel(
  marketType: MarketTypeId,
  outcomeKey: string,
  locale: Locale = "en",
): string {
  const labels = getMarketLabels(marketType, locale);
  return labels.outcomes[outcomeKey] ?? outcomeKey;
}

/** @deprecated Use getMarketTitle */
export function getMarketTypeLabel(
  id: MarketTypeId,
  lang: Locale = "en",
): string {
  return getMarketTitle(id, lang);
}

/** @deprecated Use getMarketTabLabel */
export function getMarketTypeTabLabel(
  id: MarketTypeId,
  lang: Locale = "en",
): string {
  return getMarketTabLabel(id, lang);
}

/** @deprecated Use MARKET_TYPES[id].outcomeKeys */
export function getMarketTypeOutcomes(id: MarketTypeId): { key: string }[] {
  return MARKET_TYPES[id].outcomeKeys.map((key) => ({ key }));
}

/** Infer marketType from a sub-market name (canonical or legacy). */
export function inferMarketTypeFromName(name: string): MarketTypeId | null {
  const trimmed = name.trim();
  const canonical = trimmed.match(/^([a-z0-9_]+):/i);
  if (canonical) {
    const id = canonical[1] as MarketTypeId;
    if (id in MARKET_TYPES) return id;
  }

  for (const def of Object.values(MARKET_TYPES)) {
    if (trimmed.startsWith(def.legacyNamePrefix)) return def.id;
  }

  if (!trimmed.includes(" · ") && !trimmed.includes(":")) return "1x2";

  return null;
}

export function sortMarketTypes(ids: MarketTypeId[]): MarketTypeId[] {
  return [...ids].sort(
    (a, b) => MARKET_TYPES[a].sortOrder - MARKET_TYPES[b].sortOrder,
  );
}
