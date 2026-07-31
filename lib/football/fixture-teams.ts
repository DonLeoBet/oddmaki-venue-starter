/** Team side returned from API-Football fixture lookups. */
export interface FixtureTeamSide {
  id: number;
  name: string;
  logo: string | null;
}

export interface FixtureTeamsPayload {
  fixtureId: number;
  home: FixtureTeamSide;
  away: FixtureTeamSide;
}
