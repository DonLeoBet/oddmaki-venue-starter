"use client";

import NextLink from "next/link";
import { useMemo } from "react";

import type { FormattedMarketGroup } from "@/features/market-groups/types";
import { buildOutrightCountryTree } from "@/lib/football/outright-sidebar";

/** League tabs on a country long-term page. */
export function CountryOutrightTabs({
  groups,
  countrySlug,
  activeLeagueSlug,
}: {
  groups: FormattedMarketGroup[];
  countrySlug: string;
  activeLeagueSlug: string | null;
}) {
  const leagues = useMemo(() => {
    const tree = buildOutrightCountryTree(groups);
    const country = tree.find((entry) => entry.countrySlug === countrySlug);

    return country?.leagues ?? [];
  }, [groups, countrySlug]);

  if (leagues.length === 0) return null;

  const allHref = `/?category=outrights&country=${countrySlug}`;

  return (
    <div className="flex flex-wrap items-center gap-1.5 border-b border-default-100/50 pb-3">
      <NextLink
        className={`rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
          !activeLeagueSlug
            ? "bg-primary/15 text-primary"
            : "text-default-500 hover:text-foreground"
        }`}
        href={allHref}
      >
        All
      </NextLink>
      {leagues.map((league) => {
        const active = activeLeagueSlug === league.leagueSlug;
        const href = `/?category=outrights&country=${countrySlug}&league=${league.leagueSlug}`;

        return (
          <NextLink
            key={league.leagueId}
            className={`rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
              active
                ? "bg-primary/15 text-primary"
                : "text-default-500 hover:text-foreground"
            }`}
            href={href}
          >
            {league.leagueName}
          </NextLink>
        );
      })}
    </div>
  );
}
