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
  logo?: string;
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
export type MatchMarketCategory =
  | "1x2"
  | "btts"
  | "ou15"
  | "ou25"
  | "ou35"
  | "double_chance"
  | "dnb";

export interface PreparedMatchOutcome {
  /** Language-agnostic canonical id, e.g. `btts:yes`. */
  name: string;
  question: string;
  description: string;
  category: MatchMarketCategory;
  outcomeKey: string;
}

export interface PreparedMatchMarketGroup {
  fixtureId: number;
  leagueId: number;
  leagueSlug: string;
  leagueName: string;
  seasonYear: number;
  kickoffIso: string;
  kickoffUnix: number;
  title: string;
  description: string;
  tags: string[];
  outcomes: PreparedMatchOutcome[];
  tickSize: "0.01";
  additionalReward: number;
  liveness: number;
  activateImmediately: true;
  /** Human-readable league tag for homepage category filters. */
  leagueTag?: string;
}

export type MatchCreationResult =
  | { fixtureId: number; status: "skipped"; reason: string }
  | {
      fixtureId: number;
      status: "created";
      groupId: string;
      txHashes: string[];
    }
  | { fixtureId: number; status: "failed"; error: string };

export interface PreparedOutrightOutcome {
  name: string;
  question: string;
  description: string;
}

/** Season winner / outright market group for a domestic or European league */
export interface PreparedOutrightMarketGroup {
  leagueId: number;
  season: number;
  leagueName: string;
  seasonLabel: string;
  title: string;
  description: string;
  tags: string[];
  outcomes: PreparedOutrightOutcome[];
  tickSize: "0.01";
  additionalReward: number;
  liveness: number;
  activateImmediately: true;
}

export type OutrightCreationResult =
  | { leagueId: number; season: number; status: "skipped"; reason: string }
  | {
      leagueId: number;
      season: number;
      status: "created";
      groupId: string;
      txHashes: string[];
      teamCount: number;
    }
  | { leagueId: number; season: number; status: "failed"; error: string }
  | { leagueId: number; season: number; status: "dry_run"; message: string; teamCount: number };
