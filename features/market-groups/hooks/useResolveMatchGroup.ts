"use client";

import { useMemo } from "react";

import type { Locale } from "@/config/locales";
import { useMarketSearchIndex } from "@/features/markets/hooks/useMarketSearchIndex";
import { matchSlugMatchesTeams } from "@/lib/markets/matchSlugs";

/** Resolve a league + match slug pair to an on-chain market group id. */
export function useResolveMatchGroup(
  leagueSlug: string | null,
  matchSlug: string,
  locale: Locale,
) {
  const { data: index, isLoading, error } = useMarketSearchIndex();

  const groupId = useMemo(() => {
    if (!index || !leagueSlug) return null;

    const hit = index.find(
      (record) =>
        record.leagueSlug === leagueSlug &&
        record.isFixture &&
        record.home &&
        record.away &&
        matchSlugMatchesTeams(matchSlug, record.home, record.away, locale),
    );

    return hit?.groupId ?? null;
  }, [index, leagueSlug, matchSlug, locale]);

  return {
    groupId,
    isLoading,
    error,
    resolved: !isLoading,
  };
}
