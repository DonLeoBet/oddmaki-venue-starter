"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { OUTRIGHT_SEASON_YEAR } from "@/config/top-leagues";
import { parseOutrightTag } from "@/lib/markets/marketFilters";
import { findTeamLogoForOutcome } from "@/lib/football/team-name-match";
import { queryKeys } from "@/lib/oddmaki/queryKeys";

interface LeagueTeamsPayload {
  teams: Array<{ id: number; name: string; logo: string | null }>;
}

async function fetchLeagueTeams(
  leagueId: number,
  season: number,
): Promise<LeagueTeamsPayload> {
  const response = await fetch(
    `/api/football/leagues/${leagueId}/teams?season=${season}`,
  );

  if (!response.ok) {
    throw new Error(`League teams unavailable (${response.status})`);
  }

  return response.json() as Promise<LeagueTeamsPayload>;
}

/** Resolve team crests for outright outcomes via league id tag + squad lookup. */
export function useLeagueTeamLogos(tags: string[] | undefined) {
  const parsed = useMemo(() => {
    const tag = tags?.find((entry) => entry.startsWith("outright-"));

    return tag ? parseOutrightTag(tag) : null;
  }, [tags]);

  const { data } = useQuery({
    queryKey: queryKeys.leagueTeams.detail(
      parsed?.leagueId?.toString(),
      parsed?.season?.toString(),
    ),
    queryFn: () => fetchLeagueTeams(parsed!.leagueId, parsed!.season),
    enabled: parsed != null,
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 7 * 24 * 60 * 60 * 1000,
    retry: 1,
  });

  const resolveLogo = useMemo(() => {
    const teams = data?.teams ?? [];

    return (outcomeName: string) =>
      findTeamLogoForOutcome(outcomeName, teams);
  }, [data?.teams]);

  return {
    leagueId: parsed?.leagueId ?? null,
    season: parsed?.season ?? OUTRIGHT_SEASON_YEAR,
    resolveLogo,
  };
}
