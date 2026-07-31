/** API-Football `season` param for active outright markets (2026 → 2026/2027) */
export { OUTRIGHT_SEASON_YEAR } from "@/config/top-leagues";

/** European football season year for fixture feeds (season starts ~August). */
export function currentSeasonYear(reference = new Date()): number {
  const month = reference.getUTCMonth() + 1;

  return month >= 8 ? reference.getUTCFullYear() : reference.getUTCFullYear() - 1;
}

export function formatSeasonLabel(season: number): string {
  return `${season}/${season + 1}`;
}

export function formatOutrightWinnerTitle(
  leagueName: string,
  season: number,
): string {
  return `${leagueName} ${formatSeasonLabel(season)} - Outright Winner`;
}
