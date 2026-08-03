"use client";

import { usePathname, useSearchParams } from "next/navigation";

import { OutrightCountriesNav } from "@/components/sidebar/OutrightCountriesNav";
import {
  SidebarLink,
  SidebarSection,
} from "@/components/sidebar/SidebarAccordion";
import { useBrand } from "@/features/brand";
import { getSidebarContentLinks } from "@/config/sidebarNav";
import type { BrandId } from "@/config/brandRouting";

function isPathActive(pathname: string, href: string): boolean {
  if (href.startsWith("/?")) return false;

  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Flush-left desktop navigation — long-term countries (+ content). */
export function SidebarNav({ onNavigate }: { onNavigate?: () => void } = {}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const category = searchParams.get("category");
  const { brandId } = useBrand();

  const contentLinks = getSidebarContentLinks(brandId as BrandId).filter(
    (link) => link.enabled !== false,
  );

  const isHomeActive = pathname === "/" && !category;
  const isOutrightsActive = pathname === "/" && category === "outrights";

  return (
    <nav aria-label="Site navigation" className="flex flex-col">
      <SidebarSection title="Browse">
        <SidebarLink
          active={isHomeActive || isOutrightsActive}
          href="/?category=outrights"
          label="All long-term"
          onNavigate={onNavigate}
        />
      </SidebarSection>

      <SidebarSection title="Countries">
        <OutrightCountriesNav onNavigate={onNavigate} />
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
