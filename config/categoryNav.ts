import type { BrandId } from "./brandRouting";
import { buildCategoryPath } from "./brandRouting";
import { BRAND_MARKETS, getCategoryNavMarketTypes } from "./brandMarkets";
import type { MarketTypeId } from "./marketTypes";
import { getMarketTitle, getMarketTabLabel } from "./marketTypes";
import { getLeagueName, LEAGUE_BY_SLUG } from "./leagues";
import type { Locale } from "./locales";

export interface CategoryNavLink {
  href: string;
  label: string;
  leagueSlug: string;
  marketType: MarketTypeId;
}

export interface CategoryNavLeagueGroup {
  leagueSlug: string;
  leagueLabel: string;
  links: CategoryNavLink[];
}

function navLinkLabel(
  brandId: BrandId,
  leagueSlug: string,
  marketType: MarketTypeId,
  locale: Locale,
): string {
  if (brandId === "glazenbol") {
    return `${getMarketTitle(marketType, locale)} ${getLeagueName(leagueSlug, locale)}`;
  }
  return getMarketTabLabel(marketType, locale);
}

/** Build league-grouped category nav links for the active brand. */
export function getCategoryNavGroups(
  brandId: BrandId,
  locale: Locale,
): CategoryNavLeagueGroup[] {
  const { visibleLeagues } = BRAND_MARKETS[brandId];
  const categoryNavMarketTypes = getCategoryNavMarketTypes(brandId);

  return visibleLeagues
    .filter((slug) => LEAGUE_BY_SLUG[slug])
    .map((leagueSlug) => ({
      leagueSlug,
      leagueLabel: getLeagueName(leagueSlug, locale),
      links: categoryNavMarketTypes.map((marketType) => ({
        href: buildCategoryPath(brandId, leagueSlug, marketType),
        label: navLinkLabel(brandId, leagueSlug, marketType, locale),
        leagueSlug,
        marketType,
      })),
    }));
}

/** Flat list (useful for GlazenBol-style single-row nav). */
export function getCategoryNavLinks(
  brandId: BrandId,
  locale: Locale,
): CategoryNavLink[] {
  return getCategoryNavGroups(brandId, locale).flatMap((g) => g.links);
}
