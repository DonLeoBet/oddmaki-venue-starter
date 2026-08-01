import type { BrandId } from "./brandRouting";
import { LIVE_LEAGUE_SLUGS } from "./liveLeagues";
import type { MarketTypeId } from "./marketTypes";

export interface BrandMarketsConfig {
  visibleLeagues: string[];
  /** Full set shown on match detail pages and category routes. */
  visibleMarketTypes: MarketTypeId[];
  /**
   * Intentional subset for the header category submenu only.
   * Match pages still expose all `visibleMarketTypes`.
   * @example polyfootball/topclass: BTTS + O/U 2.5 in nav; full lines on match page.
   */
  categoryNavMarketTypes: MarketTypeId[];
  /** Market types shown on homepage fixture overview cards. */
  overviewCardMarketTypes: MarketTypeId[];
}

export const BRAND_MARKETS: Record<BrandId, BrandMarketsConfig> = {
  polyfootball: {
    visibleLeagues: [...LIVE_LEAGUE_SLUGS],
    visibleMarketTypes: [
      "1x2",
      "btts",
      "ou15",
      "ou25",
      "ou35",
    ],
    categoryNavMarketTypes: ["1x2", "btts", "ou25"],
    overviewCardMarketTypes: ["1x2"],
  },
  topclass: {
    visibleLeagues: [...LIVE_LEAGUE_SLUGS],
    visibleMarketTypes: [
      "1x2",
      "btts",
      "ou15",
      "ou25",
      "ou35",
    ],
    categoryNavMarketTypes: ["1x2", "btts", "ou25"],
    overviewCardMarketTypes: ["1x2"],
  },
  glazenbol: {
    visibleLeagues: ["eredivisie", "keuken-kampioen"],
    visibleMarketTypes: ["1x2", "btts", "ou25"],
    categoryNavMarketTypes: ["1x2", "btts", "ou25"],
    overviewCardMarketTypes: ["1x2", "btts", "ou25"],
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
    overviewCardMarketTypes: ["1x2", "btts", "ou25"],
  },
  "poly-de": {
    visibleLeagues: ["bundesliga", "premier-league", "champions-league"],
    visibleMarketTypes: ["1x2", "btts", "ou25"],
    categoryNavMarketTypes: ["1x2", "btts", "ou25"],
    overviewCardMarketTypes: ["1x2", "btts", "ou25"],
  },
  "poly-es": {
    visibleLeagues: ["la-liga", "premier-league", "champions-league"],
    visibleMarketTypes: ["1x2", "btts", "ou25"],
    categoryNavMarketTypes: ["1x2", "btts", "ou25"],
    overviewCardMarketTypes: ["1x2", "btts", "ou25"],
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

/** Market types linked from the header category submenu (subset of visible). */
export function getCategoryNavMarketTypes(
  brandId: BrandId,
): MarketTypeId[] {
  return BRAND_MARKETS[brandId].categoryNavMarketTypes;
}

/** Market types on homepage fixture overview cards. */
export function getOverviewCardMarketTypes(brandId: BrandId): MarketTypeId[] {
  return BRAND_MARKETS[brandId].overviewCardMarketTypes;
}
