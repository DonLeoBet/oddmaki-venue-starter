import { LEAGUES } from "@/config/leagues";

/** API-Football (api-sports.io) — direct API, not RapidAPI */
export const API_FOOTBALL_HOST = "v3.football.api-sports.io";
export const API_FOOTBALL_BASE_URL = `https://${API_FOOTBALL_HOST}`;

/** @deprecated Use LEAGUES from config/leagues.ts — kept for bot backward compat. */
export const FOOTBALL_LEAGUES = Object.fromEntries(
  Object.entries(LEAGUES).map(([key, l]) => [
    key,
    { id: l.id, tag: l.tag, countryTag: l.countryTag },
  ]),
) as Record<
  keyof typeof LEAGUES,
  { id: number; tag: string; countryTag: string }
>;

export type FootballLeagueKey = keyof typeof FOOTBALL_LEAGUES;

/** Human-readable league names for admin UI copy */
export function getFootballLeagueLabels(): string[] {
  return Object.values(FOOTBALL_LEAGUES).map((league) => league.tag);
}

/** Hard-coded venue for Poly.Football bot automation */
export const BOT_VENUE_ID = BigInt(6);

/** Tag prefix used for idempotent fixture → market mapping */
export const FIXTURE_TAG_PREFIX = "fixture-";

/** Machine-readable kickoff unix tag for homepage sorting */
export const KICKOFF_TAG_PREFIX = "kickoff-";

export function fixtureTag(fixtureId: number): string {
  return `${FIXTURE_TAG_PREFIX}${fixtureId}`;
}

export function kickoffTag(unixTimestamp: number): string {
  return `${KICKOFF_TAG_PREFIX}${unixTimestamp}`;
}

/** Tag prefix for idempotent league outright → market mapping */
export const OUTRIGHT_TAG_PREFIX = "outright-";

export function outrightTag(leagueId: number, season: number): string {
  const revision = process.env.OUTRIGHT_TAG_REVISION?.trim();
  const base = `${OUTRIGHT_TAG_PREFIX}${leagueId}-${season}`;

  return revision ? `${base}-${revision}` : base;
}
