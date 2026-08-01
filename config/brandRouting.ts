import type { MarketTypeId } from "./marketTypes";

export type BrandId = "polyfootball" | "topclass" | "glazenbol";

export interface BrandRoutingConfig {
  basePath: string;
  /** URL segment order for category pages. */
  categoryPathOrder: "league-first" | "market-first";
  leagueSlugMappings: Record<string, string>;
  marketTypeSlugMappings: Record<MarketTypeId, string>;
  /** Final segment for match group SEO pages, e.g. /{league}/{match}/markets */
  matchMarketsSegment: string;
}

const SHARED_LEAGUE_SLUGS: Record<string, string> = {
  eredivisie: "eredivisie",
  "keuken-kampioen": "keuken-kampioen",
  "premier-league": "premier-league",
  "champions-league": "champions-league",
  "europa-league": "europa-league",
  "la-liga": "la-liga",
  "serie-a": "serie-a",
  bundesliga: "bundesliga",
  "ligue-1": "ligue-1",
};

/**
 * Future country brands — uncomment and extend BrandId when launching.
 *
 * poly-vi: basePath "", categoryPathOrder "league-first", Vietnamese slugs optional
 * poly-de / poly-es / poly-tr / poly-id / poly-th: same routing shape as polyfootball
 */
export const FUTURE_BRAND_ROUTING_EXAMPLES: Record<
  string,
  BrandRoutingConfig
> = {
  "poly-vi": {
    basePath: "",
    categoryPathOrder: "league-first",
    leagueSlugMappings: SHARED_LEAGUE_SLUGS,
    matchMarketsSegment: "markets",
    marketTypeSlugMappings: {
      "1x2": "1x2",
      btts: "btts",
      ou15: "ou15",
      ou25: "ou25",
      ou35: "ou35",
      double_chance: "double-chance",
      dnb: "dnb",
    },
  },
};

export const BRAND_ROUTING: Record<BrandId, BrandRoutingConfig> = {
  polyfootball: {
    basePath: "",
    categoryPathOrder: "league-first",
    leagueSlugMappings: SHARED_LEAGUE_SLUGS,
    matchMarketsSegment: "markets",
    marketTypeSlugMappings: {
      "1x2": "1x2",
      btts: "btts",
      ou15: "ou15",
      ou25: "ou25",
      ou35: "ou35",
      double_chance: "double-chance",
      dnb: "dnb",
    },
  },
  topclass: {
    basePath: "/predictions",
    categoryPathOrder: "league-first",
    leagueSlugMappings: SHARED_LEAGUE_SLUGS,
    matchMarketsSegment: "markets",
    marketTypeSlugMappings: {
      "1x2": "match-result",
      btts: "both-teams-to-score",
      ou15: "over-15-goals",
      ou25: "over-25-goals",
      ou35: "over-35-goals",
      double_chance: "double-chance",
      dnb: "draw-no-bet",
    },
  },
  glazenbol: {
    basePath: "/glazenbol",
    categoryPathOrder: "market-first",
    leagueSlugMappings: SHARED_LEAGUE_SLUGS,
    matchMarketsSegment: "markets",
    marketTypeSlugMappings: {
      "1x2": "1x2",
      btts: "beide-scoren",
      ou15: "over-onder-15",
      ou25: "over-onder-25",
      ou35: "over-onder-35",
      double_chance: "dubbele-kans",
      dnb: "draw-no-bet",
    },
  },
};

export function resolveBrandId(raw: string | undefined): BrandId {
  if (raw === "topclass" || raw === "glazenbol" || raw === "polyfootball") {
    return raw;
  }
  return "polyfootball";
}

export function marketTypeFromSlug(
  brandId: BrandId,
  slug: string,
): MarketTypeId | null {
  const routing = BRAND_ROUTING[brandId];
  for (const [id, mapped] of Object.entries(routing.marketTypeSlugMappings)) {
    if (mapped === slug) return id as MarketTypeId;
  }
  if (slug in routing.marketTypeSlugMappings) return slug as MarketTypeId;
  return null;
}

export function marketTypeToSlug(
  brandId: BrandId,
  marketType: MarketTypeId,
): string {
  return BRAND_ROUTING[brandId].marketTypeSlugMappings[marketType];
}

export function leagueSlugFromRoute(
  brandId: BrandId,
  slug: string,
): string | null {
  const routing = BRAND_ROUTING[brandId];
  if (slug in routing.leagueSlugMappings) return slug;
  const entry = Object.entries(routing.leagueSlugMappings).find(
    ([, v]) => v === slug,
  );
  return entry?.[0] ?? null;
}

export function buildCategoryPath(
  brandId: BrandId,
  leagueSlug: string,
  marketType: MarketTypeId,
): string {
  const routing = BRAND_ROUTING[brandId];
  const mtSlug = marketTypeToSlug(brandId, marketType);
  const league = routing.leagueSlugMappings[leagueSlug] ?? leagueSlug;
  const base = routing.basePath.replace(/\/$/, "");

  if (routing.categoryPathOrder === "market-first") {
    return `${base}/${mtSlug}/${league}`;
  }
  if (base) {
    return `${base}/${league}/${mtSlug}`;
  }
  return `/markets/${league}/${mtSlug}`;
}

/** SEO-friendly match group page, e.g. /premier-league/arsenal-vs-coventry/markets */
export function buildMatchGroupPath(
  brandId: BrandId,
  leagueSlug: string,
  matchSlug: string,
): string {
  const routing = BRAND_ROUTING[brandId];
  const league = routing.leagueSlugMappings[leagueSlug] ?? leagueSlug;
  const segment = routing.matchMarketsSegment;
  const base = routing.basePath.replace(/\/$/, "");
  const matchPrefix = brandId === "glazenbol" ? "match/" : "";
  const path = `${matchPrefix}${league}/${matchSlug}/${segment}`;

  return base ? `${base}/${path}` : `/${path}`;
}

/** Legacy internal route — kept for backwards compatibility. */
export function buildLegacyMatchGroupPath(groupId: string): string {
  return `/market/multi/${groupId}`;
}
