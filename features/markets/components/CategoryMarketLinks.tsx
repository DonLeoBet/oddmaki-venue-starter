"use client";

import { usePathname, useSearchParams } from "next/navigation";

import {
  SidebarAccordion,
  SidebarLink,
} from "@/components/sidebar/SidebarAccordion";
import { useBrand } from "@/features/brand";
import { getSidebarLeagueLinks } from "@/config/sidebarNav";
import type { BrandId } from "@/config/brandRouting";
import { buildCategoryPath } from "@/config/brandRouting";
import { getMarketTabLabel } from "@/config/marketTypes";
import { getOverviewCardMarketTypes } from "@/config/brandMarkets";

function isPathActive(pathname: string, href: string): boolean {
  if (href.startsWith("/?")) return false;

  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Mobile/tablet league nav — submarkets hidden until league is expanded. */
export function CategoryMarketLinks() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const category = searchParams.get("category");
  const { brandId, locale } = useBrand();

  const leagues = getSidebarLeagueLinks(brandId as BrandId, locale);
  const marketTypes = getOverviewCardMarketTypes(brandId as BrandId);

  if (leagues.length === 0) return null;

  return (
    <nav
      aria-label="Leagues and markets"
      className="flex flex-col gap-1 border-b border-white/[0.06] pb-3"
    >
      {leagues.map((league) => {
        const marketLinks = marketTypes.map((marketType) => ({
          href: buildCategoryPath(brandId as BrandId, league.slug, marketType),
          label: getMarketTabLabel(marketType, locale),
        }));
        const leagueFeedActive = pathname === "/" && category === league.slug;
        const leagueRouteActive = marketLinks.some((link) =>
          isPathActive(pathname, link.href),
        );

        return (
          <SidebarAccordion
            key={league.slug}
            forceOpen={leagueFeedActive || leagueRouteActive || category === league.slug}
            id={`mobile-league-${league.slug}`}
            label={league.label}
            level={1}
          >
            <SidebarLink
              active={leagueFeedActive}
              href={league.href}
              label="All matches"
            />
            {marketLinks.map((link) => (
              <SidebarLink
                key={link.href}
                active={isPathActive(pathname, link.href)}
                href={link.href}
                label={link.label}
                sub
              />
            ))}
          </SidebarAccordion>
        );
      })}
    </nav>
  );
}
