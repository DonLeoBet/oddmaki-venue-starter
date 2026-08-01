/** Leagues with active match-market imports — used for sidebar and brand nav. */
export const LIVE_LEAGUE_SLUGS = [
  "premier-league",
  "championship",
  "la-liga",
  "serie-a",
  "bundesliga",
  "ligue-1",
  "eredivisie",
  "primeira-liga",
  "super-lig",
  "pro-league-sa",
  "belgian-pro-league",
  "scottish-premiership",
  "super-league-gr",
  "bundesliga-at",
  "super-league-ch",
  "superliga",
] as const;

export type LiveLeagueSlug = (typeof LIVE_LEAGUE_SLUGS)[number];
