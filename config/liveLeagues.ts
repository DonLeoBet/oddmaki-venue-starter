/** Leagues with active match-market imports — used for sidebar and brand nav. */
export const LIVE_LEAGUE_SLUGS = [
  "premier-league",
  "la-liga",
  "serie-a",
  "bundesliga",
  "ligue-1",
  "eredivisie",
  "super-lig",
  "liga-profesional",
  "brasileirao",
  "primera-a",
  "primera-division-bo",
  "chinese-super-league",
] as const;

export type LiveLeagueSlug = (typeof LIVE_LEAGUE_SLUGS)[number];
