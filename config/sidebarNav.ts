import type { BrandId } from "./brandRouting";
import { BRAND_MARKETS } from "./brandMarkets";
import { LEAGUE_BY_SLUG, getLeagueName } from "./leagues";
import type { Locale } from "./locales";

export interface SidebarContentLink {
  href: string;
  label: string;
  /** When false, link is hidden until CMS/content exists. */
  enabled?: boolean;
}

/** CMS-ready content links shown in the desktop sidebar. */
export function getSidebarContentLinks(_brandId: BrandId): SidebarContentLink[] {
  return [
    { href: "/blog", label: "News & previews", enabled: true },
    { href: "/blog", label: "Match previews", enabled: false },
  ];
}

export interface SidebarLeagueLink {
  slug: string;
  label: string;
  href: string;
}

export function getSidebarLeagueLinks(
  brandId: BrandId,
  locale: Locale,
): SidebarLeagueLink[] {
  return BRAND_MARKETS[brandId].visibleLeagues
    .filter((slug) => LEAGUE_BY_SLUG[slug])
    .map((slug) => ({
      slug,
      label: getLeagueName(slug, locale),
      href: `/?category=${slug}`,
    }));
}
