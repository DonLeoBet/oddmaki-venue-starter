import type { BrandId } from "./brandRouting";
import type { MarketTypeId } from "./marketTypes";
import { ALL_LEAGUE_SLUGS } from "./leagues";

export interface BrandMarketsConfig {
  visibleLeagues: string[];
  visibleMarketTypes: MarketTypeId[];
  /** Market types shown in category nav (subset of visible). */
  categoryNavMarketTypes: MarketTypeId[];
}

export const BRAND_MARKETS: Record<BrandId, BrandMarketsConfig> = {
  polyfootball: {
    visibleLeagues: ALL_LEAGUE_SLUGS,
    visibleMarketTypes: [
      "1x2",
      "btts",
      "ou15",
      "ou25",
      "ou35",
      "double_chance",
      "dnb",
    ],
    categoryNavMarketTypes: ["btts", "ou25"],
  },
  topclass: {
    visibleLeagues: ALL_LEAGUE_SLUGS,
    visibleMarketTypes: [
      "1x2",
      "btts",
      "ou15",
      "ou25",
      "ou35",
      "double_chance",
      "dnb",
    ],
    categoryNavMarketTypes: ["btts", "ou25"],
  },
  glazenbol: {
    visibleLeagues: ["eredivisie", "keuken-kampioen"],
    visibleMarketTypes: ["1x2", "btts", "ou25"],
    categoryNavMarketTypes: ["1x2", "btts", "ou25"],
  },
};

/**
 * Future country brands — activate by extending BrandId + entries below.
 * No new on-chain markets needed; set NEXT_PUBLIC_BRAND_ID and locale env vars.
 *
 * @example poly-vi (Vietnam)
 * visibleLeagues: premier-league, la-liga, serie-a, bundesliga, eredivisie, champions-league
 * visibleMarketTypes: ["1x2", "btts", "ou25"]
 * defaultLocale: "vi" (see FUTURE_BRAND_LOCALE_EXAMPLES in brand.config.ts)
 *
 * @example poly-de — Bundesliga, PL, UCL focus, defaultLocale "de"
 * @example poly-es — La Liga focus, defaultLocale "es"
 * @example poly-tr, poly-id, poly-th — same pattern
 */
export const FUTURE_BRAND_MARKETS_EXAMPLES: Record<
  string,
  BrandMarketsConfig
> = {
  "poly-vi": {
    visibleLeagues: [
      "premier-league",
      "la-liga",
      "serie-a",
      "bundesliga",
      "eredivisie",
      "champions-league",
    ],
    visibleMarketTypes: ["1x2", "btts", "ou25"],
    categoryNavMarketTypes: ["1x2", "btts", "ou25"],
  },
  "poly-de": {
    visibleLeagues: ["bundesliga", "premier-league", "champions-league"],
    visibleMarketTypes: ["1x2", "btts", "ou25"],
    categoryNavMarketTypes: ["1x2", "btts", "ou25"],
  },
  "poly-es": {
    visibleLeagues: ["la-liga", "premier-league", "champions-league"],
    visibleMarketTypes: ["1x2", "btts", "ou25"],
    categoryNavMarketTypes: ["1x2", "btts", "ou25"],
  },
};

export function isLeagueVisibleForBrand(
  brandId: BrandId,
  leagueSlug: string,
): boolean {
  return BRAND_MARKETS[brandId].visibleLeagues.includes(leagueSlug);
}

export function isMarketTypeVisibleForBrand(
  brandId: BrandId,
  marketType: MarketTypeId,
): boolean {
  return BRAND_MARKETS[brandId].visibleMarketTypes.includes(marketType);
}
