export interface ApiFootballFixtureStatus {
  short: string;
  long: string;
}

export interface ApiFootballFixture {
  id: number;
  date: string;
  timestamp: number;
  timezone: string;
  status: ApiFootballFixtureStatus;
}

export interface ApiFootballTeam {
  id: number;
  name: string;
}

export interface ApiFootballLeague {
  id: number;
  name: string;
  country: string;
  season: number;
  round?: string;
}

export interface ApiFootballFixtureRow {
  fixture: ApiFootballFixture;
  league: ApiFootballLeague;
  teams: {
    home: ApiFootballTeam;
    away: ApiFootballTeam;
  };
}

export interface ApiFootballFixturesResponse {
  response: ApiFootballFixtureRow[];
  errors?: Record<string, string> | string[];
}

/** Payload aligned with OddMaki group-market creation (NegRisk / market group) */
export interface PreparedMatchMarketGroup {
  fixtureId: number;
  leagueId: number;
  leagueName: string;
  kickoffIso: string;
  kickoffUnix: number;
  title: string;
  description: string;
  tags: string[];
  outcomes: Array<{ name: string; question: string }>;
  tickSize: "0.01";
  additionalReward: number;
  liveness: number;
  activateImmediately: true;
}

export type MatchCreationResult =
  | { fixtureId: number; status: "skipped"; reason: string }
  | { fixtureId: number; status: "created"; groupId: string; txHashes: string[] }
  | { fixtureId: number; status: "failed"; error: string };
