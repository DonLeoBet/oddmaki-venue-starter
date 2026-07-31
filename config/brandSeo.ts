import type { BrandId } from "./brandRouting";
import type { MarketTypeId } from "./marketTypes";
import { getMarketTitle } from "./marketTypes";
import { getLeagueName } from "./leagues";
import type { Locale } from "./locales";

export interface SeoPatterns {
  categoryTitle: string;
  categoryDescription: string;
  categoryH1: string;
  matchTitle: string;
  matchH1: string;
}

type SeoTemplateVars = {
  leagueName: string;
  marketTypeLabel: string;
  seasonYear: string;
  home: string;
  away: string;
  brandName: string;
};

function fill(template: string, vars: SeoTemplateVars): string {
  return template
    .replace(/\{leagueName\}/g, vars.leagueName)
    .replace(/\{marketTypeLabel\}/g, vars.marketTypeLabel)
    .replace(/\{seasonYear\}/g, vars.seasonYear)
    .replace(/\{home\}/g, vars.home)
    .replace(/\{away\}/g, vars.away)
    .replace(/\{brandName\}/g, vars.brandName);
}

export const BRAND_SEO: Record<BrandId, SeoPatterns> = {
  polyfootball: {
    categoryTitle:
      "{brandName} – {marketTypeLabel} {leagueName} ({seasonYear})",
    categoryDescription:
      "Trade {marketTypeLabel} markets for {leagueName} fixtures on {brandName}. On-chain prediction markets on Base.",
    categoryH1: "{marketTypeLabel} – {leagueName}",
    matchTitle: "{home} vs {away} – Match Markets | {brandName}",
    matchH1: "{home} vs {away}",
  },
  topclass: {
    categoryTitle:
      "Topclass Predictions – {marketTypeLabel} {leagueName} Odds",
    categoryDescription:
      "Topclass Predictions {marketTypeLabel} odds for {leagueName}. Trade on-chain with Topclass.",
    categoryH1: "{marketTypeLabel} – {leagueName}",
    matchTitle: "{home} vs {away} – Topclass Predictions",
    matchH1: "{home} vs {away}",
  },
  glazenbol: {
    categoryTitle:
      "GlazenBol – {marketTypeLabel} {leagueName} ({seasonYear})",
    categoryDescription:
      "GlazenBol {marketTypeLabel} voor {leagueName}. Voorspel wedstrijden on-chain.",
    categoryH1: "{marketTypeLabel} {leagueName}",
    matchTitle: "{home} vs {away} – GlazenBol",
    matchH1: "{home} vs {away}",
  },
};

/**
 * Future brand SEO templates — copy when launching poly-vi, poly-de, etc.
 *
 * poly-vi example:
 *   categoryTitle: "{brandName} – {marketTypeLabel} {leagueName} ({seasonYear})"
 *   categoryDescription: "Giao dịch {marketTypeLabel} cho {leagueName} trên {brandName}."
 *   categoryH1: "{marketTypeLabel} – {leagueName}"
 */
export const FUTURE_BRAND_SEO_EXAMPLES: Record<string, Partial<SeoPatterns>> = {
  "poly-vi": {
    categoryTitle:
      "{brandName} – {marketTypeLabel} {leagueName} ({seasonYear})",
    categoryDescription:
      "Giao dịch thị trường {marketTypeLabel} cho {leagueName} trên {brandName}. Thị trường dự đoán on-chain trên Base.",
    categoryH1: "{marketTypeLabel} – {leagueName}",
    matchTitle: "{home} vs {away} – Thị trường trận đấu | {brandName}",
    matchH1: "{home} vs {away}",
  },
  "poly-de": {
    categoryTitle:
      "{brandName} – {marketTypeLabel} {leagueName} ({seasonYear})",
    categoryDescription:
      "{marketTypeLabel}-Märkte für {leagueName} auf {brandName}. On-Chain-Prognosemärkte auf Base.",
    categoryH1: "{marketTypeLabel} – {leagueName}",
  },
};

export function buildCategorySeo(
  brandId: BrandId,
  brandName: string,
  leagueSlug: string,
  marketType: MarketTypeId,
  lang: Locale,
  seasonYear: number,
): { title: string; description: string; h1: string } {
  const patterns = BRAND_SEO[brandId];
  const vars: SeoTemplateVars = {
    leagueName: getLeagueName(leagueSlug, lang),
    marketTypeLabel: getMarketTitle(marketType, lang),
    seasonYear: String(seasonYear),
    home: "",
    away: "",
    brandName,
  };

  return {
    title: fill(patterns.categoryTitle, vars),
    description: fill(patterns.categoryDescription, vars),
    h1: fill(patterns.categoryH1, vars),
  };
}

export function buildMatchSeo(
  brandId: BrandId,
  brandName: string,
  home: string,
  away: string,
): { title: string; h1: string } {
  const patterns = BRAND_SEO[brandId];
  const vars: SeoTemplateVars = {
    leagueName: "",
    marketTypeLabel: "",
    seasonYear: "",
    home,
    away,
    brandName,
  };

  return {
    title: fill(patterns.matchTitle, vars),
    h1: fill(patterns.matchH1, vars),
  };
}
