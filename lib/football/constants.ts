/** API-Football (api-sports.io) configuration */
export const API_FOOTBALL_HOST = "v3.football.api-sports.io";

export const FOOTBALL_LEAGUES = {
  eredivisie: { id: 88, tag: "Eredivisie", countryTag: "Dutch Football" },
  premierLeague: {
    id: 39,
    tag: "Premier League",
    countryTag: "English Football",
  },
} as const;

export type FootballLeagueKey = keyof typeof FOOTBALL_LEAGUES;

/** Hard-coded venue for Poly.Football bot automation */
export const BOT_VENUE_ID = BigInt(6);

/** Tag prefix used for idempotent fixture → market mapping */
export const FIXTURE_TAG_PREFIX = "fixture-";

export function fixtureTag(fixtureId: number): string {
  return `${FIXTURE_TAG_PREFIX}${fixtureId}`;
}
