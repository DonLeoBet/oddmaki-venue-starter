import type { ApiFootballFixtureRow } from "./types";

/** Parse "Regular Season - 3" → 3. Returns null for cups / unknown formats. */
export function parseRegularSeasonRound(round?: string): number | null {
  if (!round?.trim()) return null;

  const match = round.match(/Regular Season\s*-\s*(\d+)/i);

  return match ? Number(match[1]) : null;
}

export function filterFixturesByMaxRound(
  rows: ApiFootballFixtureRow[],
  maxRound: number,
): ApiFootballFixtureRow[] {
  return rows.filter((row) => {
    const roundNumber = parseRegularSeasonRound(row.league.round);

    return roundNumber != null && roundNumber >= 1 && roundNumber <= maxRound;
  });
}
