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

function isPathActive(pathname: string, href: string): boolean {
  if (href.startsWith("/?")) return false;

  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Flush-left desktop navigation — leagues only, no per-market sub-links. */
export function SidebarNav({ onNavigate }: { onNavigate?: () => void } = {}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const category = searchParams.get("category");
  const { brandId, locale } = useBrand();

  const leagues = getSidebarLeagueLinks(brandId as BrandId, locale);
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
            leagues.some((league) => category === league.slug)
          }
          id="sports-football"
          label="Football"
          level={0}
        >
          <SidebarSubheading>Top leagues</SidebarSubheading>
          {leagues.map((league) => (
            <SidebarLink
              key={league.slug}
              active={pathname === "/" && category === league.slug}
              href={league.href}
              label={league.label}
              onNavigate={onNavigate}
              sub
            />
          ))}

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
