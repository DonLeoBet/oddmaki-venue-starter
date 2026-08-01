import type { FixtureTeamSide } from "./fixture-teams";

import { getTopLeagueById, OUTRIGHT_SEASON_YEAR } from "@/config/top-leagues";
import { resolveOutrightLeaguesByIds } from "./discover-outright-leagues";
import { fetchOutrightParticipants } from "./fetch-outright-participants";
import { getTeamLogo } from "./team-logo";

export interface LeagueTeamEntry {
  id: number;
  name: string;
  logo: string | null;
}

/** Load league squads for outright crest lookup (read-only, cached at route layer). */
export async function fetchLeagueTeamsById(
  leagueId: number,
  season: number = OUTRIGHT_SEASON_YEAR,
): Promise<LeagueTeamEntry[]> {
  let league = getTopLeagueById(leagueId);

  if (!league) {
    const resolved = await resolveOutrightLeaguesByIds([leagueId], season);

    league = resolved[0];
  }

  if (!league) return [];

  const { teams } = await fetchOutrightParticipants(league, season);

  return teams
    .map((row): LeagueTeamEntry | null => {
      const side: FixtureTeamSide | null =
        row.team.id > 0 && row.team.name.trim()
          ? {
              id: row.team.id,
              name: row.team.name.trim(),
              logo: getTeamLogo({ id: row.team.id, name: row.team.name }),
            }
          : null;

      if (!side) return null;

      return {
        id: side.id,
        name: side.name,
        logo: side.logo,
      };
    })
    .filter((entry): entry is LeagueTeamEntry => entry != null);
}
