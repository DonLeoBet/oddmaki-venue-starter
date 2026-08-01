"use client";

import { usePathname, useSearchParams } from "next/navigation";

import { OutrightCountriesNav } from "@/components/sidebar/OutrightCountriesNav";
import {
  SidebarAccordion,
  SidebarLink,
  SidebarSection,
  SidebarSubheading,
} from "@/components/sidebar/SidebarAccordion";
import { useBrand } from "@/features/brand";
import {
  getSidebarContentLinks,
  getSidebarLeagueLinks,
} from "@/config/sidebarNav";
import type { BrandId } from "@/config/brandRouting";
import { buildCategoryPath } from "@/config/brandRouting";
import { getMarketTabLabel } from "@/config/marketTypes";
import { getOverviewCardMarketTypes } from "@/config/brandMarkets";

function isPathActive(pathname: string, href: string): boolean {
  if (href.startsWith("/?")) return false;

  return pathname === href || pathname.startsWith(`${href}/`);
}

function LeagueNavItem({
  leagueSlug,
  leagueLabel,
  leagueHref,
  marketLinks,
  pathname,
  category,
  forceOpen,
  onNavigate,
}: {
  leagueSlug: string;
  leagueLabel: string;
  leagueHref: string;
  marketLinks: Array<{ href: string; label: string }>;
  pathname: string;
  category: string | null;
  forceOpen: boolean;
  onNavigate?: () => void;
}) {
  const leagueFeedActive = pathname === "/" && category === leagueSlug;
  const leagueRouteActive = marketLinks.some((link) =>
    isPathActive(pathname, link.href),
  );

  return (
    <SidebarAccordion
      forceOpen={forceOpen || leagueFeedActive || leagueRouteActive}
      id={`league-${leagueSlug}`}
      label={leagueLabel}
      level={2}
    >
      <SidebarLink
        active={leagueFeedActive}
        href={leagueHref}
        label="All matches"
        onNavigate={onNavigate}
        sub
      />
      {marketLinks.map((link) => (
        <SidebarLink
          key={link.href}
          active={isPathActive(pathname, link.href)}
          depth={2}
          href={link.href}
          label={link.label}
          onNavigate={onNavigate}
          sub
        />
      ))}
    </SidebarAccordion>
  );
}

/** Premium flush-left desktop navigation with collapsible league submarkets. */
export function SidebarNav({ onNavigate }: { onNavigate?: () => void } = {}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const category = searchParams.get("category");
  const { brandId, locale } = useBrand();

  const leagues = getSidebarLeagueLinks(brandId as BrandId, locale);
  const sidebarMarketTypes = getOverviewCardMarketTypes(brandId as BrandId);
  const contentLinks = getSidebarContentLinks(brandId as BrandId).filter(
    (link) => link.enabled !== false,
  );

  const isHomeActive = pathname === "/" && !category;
  const matchCategoryActive =
    category != null && category !== "outrights";

  return (
    <nav aria-label="Site navigation" className="flex flex-col">
      <SidebarSection title="Live">
        <SidebarLink
          active={isHomeActive}
          href="/"
          label="All matches"
          onNavigate={onNavigate}
        />
      </SidebarSection>

      <SidebarSection title="Football">
        <SidebarAccordion
          defaultOpen
          forceOpen={
            matchCategoryActive ||
            category === "outrights" ||
            leagues.some((l) => isPathActive(pathname, l.href))
          }
          id="sports-football"
          label="Football"
          level={0}
        >
          <SidebarSubheading>Top leagues</SidebarSubheading>
          {leagues.map((league) => {
            const marketLinks = sidebarMarketTypes.map((marketType) => ({
              href: buildCategoryPath(
                brandId as BrandId,
                league.slug,
                marketType,
              ),
              label: getMarketTabLabel(marketType, locale),
            }));

            return (
              <LeagueNavItem
                key={league.slug}
                category={category}
                forceOpen={category === league.slug}
                leagueHref={league.href}
                leagueLabel={league.label}
                leagueSlug={league.slug}
                marketLinks={marketLinks}
                pathname={pathname}
                onNavigate={onNavigate}
              />
            );
          })}

          <OutrightCountriesNav onNavigate={onNavigate} />
        </SidebarAccordion>
      </SidebarSection>

      {contentLinks.length > 0 && (
        <SidebarSection title="Content">
          {contentLinks.map((link) => (
            <SidebarLink
              key={`${link.href}-${link.label}`}
              active={isPathActive(pathname, link.href)}
              href={link.href}
              label={link.label}
              onNavigate={onNavigate}
            />
          ))}
        </SidebarSection>
      )}
    </nav>
  );
}
