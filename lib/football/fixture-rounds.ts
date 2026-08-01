import type { ApiFootballFixtureRow } from "./types";

/** Parse domestic league round numbers from API-Football `league.round` strings. */
export function parseRegularSeasonRound(round?: string): number | null {
  if (!round?.trim()) return null;

  const regular = round.match(/Regular Season\s*-\s*(\d+)/i);

  if (regular) return Number(regular[1]);

  const split = round.match(
    /(?:Apertura|Clausura|Opening|Closing|Torneo)\s*[-–]?\s*(\d+)/i,
  );

  if (split) return Number(split[1]);

  const roundLabel = round.match(/Round\s*(?:of\s*)?(\d+)/i);

  if (roundLabel) return Number(roundLabel[1]);

  if (/^\d+$/.test(round.trim())) return Number(round.trim());

  return null;
}

export function filterFixturesByMaxRound(
  rows: ApiFootballFixtureRow[],
  maxRound: number,
): ApiFootballFixtureRow[] {
  return rows.filter((row) => {
    const roundNumber = parseRegularSeasonRound(row.league.round);

    // Keep fixtures when the API uses a non-standard round label (common in SA leagues).
    if (roundNumber == null) return true;

    return roundNumber >= 1 && roundNumber <= maxRound;
  });
}
