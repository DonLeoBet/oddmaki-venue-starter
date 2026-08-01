"use client";

import { usePathname, useSearchParams } from "next/navigation";

import { SidebarLink } from "@/components/sidebar/SidebarAccordion";
import { useBrand } from "@/features/brand";
import { getSidebarLeagueLinks } from "@/config/sidebarNav";
import type { BrandId } from "@/config/brandRouting";

/** Mobile/tablet league nav — one link per league, no market-type submenus. */
export function CategoryMarketLinks() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const category = searchParams.get("category");
  const { brandId, locale } = useBrand();

  const leagues = getSidebarLeagueLinks(brandId as BrandId, locale);

  if (leagues.length === 0) return null;

  return (
    <nav
      aria-label="Leagues"
      className="flex flex-col gap-0.5 border-b border-white/[0.06] pb-3"
    >
      {leagues.map((league) => (
        <SidebarLink
          key={league.slug}
          active={pathname === "/" && category === league.slug}
          href={league.href}
          label={league.label}
        />
      ))}
    </nav>
  );
}
