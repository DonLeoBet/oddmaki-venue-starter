"use client";

import type { MatchPageContext } from "@/lib/football/match-page-context";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/oddmaki/queryKeys";
import { fixtureIdFromTag, isFixtureTag } from "@/lib/football/map-fixture-to-market-group";

async function fetchMatchContext(fixtureId: number): Promise<MatchPageContext> {
  const response = await fetch(`/api/football/fixtures/${fixtureId}/context`);

  if (!response.ok) {
    throw new Error(`Match context unavailable (${response.status})`);
  }

  return response.json() as Promise<MatchPageContext>;
}

function fixtureIdFromTags(tags: string[] | undefined): number | null {
  if (!tags) return null;

  for (const tag of tags) {
    if (!isFixtureTag(tag)) continue;

    return fixtureIdFromTag(tag);
  }

  return null;
}

/** Standings, H2H, bookmaker odds, FAQ — cached server-side (~1h). */
export function useMatchFootballContext(tags: string[] | undefined) {
  const fixtureId = fixtureIdFromTags(tags);

  return useQuery({
    queryKey: queryKeys.matchContext.detail(fixtureId?.toString()),
    queryFn: () => fetchMatchContext(fixtureId!),
    enabled: fixtureId != null,
    staleTime: 60 * 60 * 1000,
    gcTime: 6 * 60 * 60 * 1000,
    retry: 1,
  });
}
