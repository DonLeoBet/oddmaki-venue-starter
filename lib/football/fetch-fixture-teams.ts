import type { FixtureTeamsPayload } from "./fixture-teams";
import type { ApiFootballFixturesResponse } from "./types";

import { apiFootballGet } from "./api-football-client";
import { getTeamLogo } from "./team-logo";

export async function fetchFixtureTeamsById(
  fixtureId: number,
): Promise<FixtureTeamsPayload | null> {
  const payload = await apiFootballGet<ApiFootballFixturesResponse>("/fixtures", {
    id: fixtureId,
  });

  const row = payload.response?.[0];

  if (!row?.teams?.home?.id || !row.teams.away?.id) return null;

  return {
    fixtureId,
    home: {
      id: row.teams.home.id,
      name: row.teams.home.name.trim(),
      logo: getTeamLogo(row.teams.home),
    },
    away: {
      id: row.teams.away.id,
      name: row.teams.away.name.trim(),
      logo: getTeamLogo(row.teams.away),
    },
  };
}
