"use client";

import { useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import {
  SidebarAccordion,
  SidebarLink,
  SidebarSubheading,
} from "@/components/sidebar/SidebarAccordion";
import { useOutrightGroups } from "@/features/markets/hooks/useOutrightGroups";
import { buildOutrightCountryTree } from "@/lib/football/outright-sidebar";

export function OutrightCountriesNav({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const category = searchParams.get("category");
  const leagueFilter = searchParams.get("league");
  const countryFilter = searchParams.get("country");

  const { groups, isLoading } = useOutrightGroups();

  const countries = useMemo(
    () => buildOutrightCountryTree(groups),
    [groups],
  );

  const outrightsOpen =
    category === "outrights" || countryFilter != null || leagueFilter != null;

  if (isLoading) {
    return (
      <SidebarSubheading>Countries</SidebarSubheading>
    );
  }

  if (countries.length === 0) return null;

  return (
    <>
      <SidebarSubheading>Countries</SidebarSubheading>
      <SidebarAccordion
        forceOpen={outrightsOpen}
        id="football-countries"
        label="Countries"
        level={1}
      >
        {countries.map((country) => {
          const countryActive =
            pathname === "/" &&
            category === "outrights" &&
            countryFilter === country.countrySlug &&
            !leagueFilter;

          return (
            <SidebarAccordion
              key={country.countrySlug}
              forceOpen={
                countryFilter === country.countrySlug ||
                country.leagues.some((league) => league.leagueSlug === leagueFilter)
              }
              id={`country-${country.countrySlug}`}
              label={country.countryLabel}
              level={2}
            >
              <SidebarLink
                active={countryActive}
                depth={2}
                href={`/?category=outrights&country=${country.countrySlug}`}
                label="All long-term markets"
                onNavigate={onNavigate}
                sub
              />
              {country.leagues.map((league) => (
                <SidebarLink
                  key={league.leagueId}
                  active={
                    pathname === "/" &&
                    category === "outrights" &&
                    leagueFilter === league.leagueSlug
                  }
                  depth={2}
                  href={league.href}
                  label={league.leagueName}
                  onNavigate={onNavigate}
                  sub
                />
              ))}
            </SidebarAccordion>
          );
        })}
      </SidebarAccordion>
    </>
  );
}
