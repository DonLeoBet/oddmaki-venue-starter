"use client";

import { useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { SidebarLink } from "@/components/sidebar/SidebarAccordion";
import { useOutrightGroups } from "@/features/markets/hooks/useOutrightGroups";
import { countrySlugToFlagEmoji } from "@/lib/football/country-labels";
import { buildOutrightCountryTree } from "@/lib/football/outright-sidebar";

/** Flat country links for long-term markets — flag + country name. */
export function OutrightCountriesNav({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const category = searchParams.get("category");
  const countryFilter = searchParams.get("country");

  const { groups, isLoading } = useOutrightGroups();

  const countries = useMemo(
    () => buildOutrightCountryTree(groups),
    [groups],
  );

  if (isLoading && countries.length === 0) {
    return <p className="px-3 py-1.5 text-sm text-default-500">Loading…</p>;
  }

  if (countries.length === 0) return null;

  return (
    <>
      {countries.map((country) => {
        const countryActive =
          pathname === "/" &&
          category === "outrights" &&
          countryFilter === country.countrySlug;

        return (
          <SidebarLink
            key={country.countrySlug}
            active={countryActive}
            href={`/?category=outrights&country=${country.countrySlug}`}
            label={country.countryLabel}
            leading={countrySlugToFlagEmoji(country.countrySlug)}
            onNavigate={onNavigate}
          />
        );
      })}
    </>
  );
}
