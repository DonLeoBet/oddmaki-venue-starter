import type { ApiFootballFixtureRow } from "./types";

import {
  fetchFixturesByLeague,
  fetchFixturesByLeagueDateRange,
} from "./api-football-client";
import { FOOTBALL_LEAGUES } from "./constants";
import {
  getFixtureMinKickoffDateYmd,
  getFixtureMinKickoffUnix,
} from "./fixture-window";
import { filterFixturesByMaxRound } from "./fixture-rounds";

const UPCOMING_STATUSES = new Set(["NS", "TBD"]);

/** Primary `next` window when querying api-sports.io */
const DEFAULT_NEXT_COUNT = 10;

/** Fallback window: today → +N days (covers pre-season kickoffs in August) */
const DEFAULT_DATE_FALLBACK_DAYS = 30;

/** Cron horizon — avoid locking collateral on far-future postponed fixtures */
export const CRON_FIXTURE_DAYS_AHEAD = 14;

import { currentSeasonYear } from "./season";

function formatDateYmd(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function upcomingDateWindow(maxDaysAhead?: number): { from: string; to: string } {
  const fromDate = new Date(`${getFixtureMinKickoffDateYmd()}T00:00:00.000Z`);
  const toDate = new Date(fromDate);
  const days = maxDaysAhead ?? DEFAULT_DATE_FALLBACK_DAYS;

  toDate.setUTCDate(toDate.getUTCDate() + days);

  return {
    from: formatDateYmd(fromDate),
    to: formatDateYmd(toDate),
  };
}

function filterMinKickoff(rows: ApiFootballFixtureRow[]): ApiFootballFixtureRow[] {
  const minUnix = getFixtureMinKickoffUnix();

  return rows.filter((row) => row.fixture.timestamp >= minUnix);
}

function filterWithinHorizon(
  rows: ApiFootballFixtureRow[],
  maxDaysAhead?: number,
): ApiFootballFixtureRow[] {
  const minFiltered = filterMinKickoff(rows);

  if (maxDaysAhead == null) return minFiltered;

  const nowUnix = Math.max(
    Math.floor(Date.now() / 1000),
    getFixtureMinKickoffUnix(),
  );
  const cutoffUnix = nowUnix + maxDaysAhead * 86_400;

  return minFiltered.filter(
    (row) =>
      row.fixture.timestamp >= nowUnix - 3_600 &&
      row.fixture.timestamp <= cutoffUnix,
  );
}

function filterUpcoming(
  rows: ApiFootballFixtureRow[],
): ApiFootballFixtureRow[] {
  return rows.filter((row) => UPCOMING_STATUSES.has(row.fixture.status.short));
}

async function fetchLeagueFixtures(
  leagueId: number,
  season: number,
  next: number,
  maxDaysAhead?: number,
): Promise<ApiFootballFixtureRow[]> {
  const byNext = filterUpcoming(
    await fetchFixturesByLeague({ leagueId, season, next }),
  );

  if (byNext.length > 0) {
    return filterWithinHorizon(byNext, maxDaysAhead);
  }

  const { from, to } = upcomingDateWindow(maxDaysAhead);

  for (const seasonCandidate of [season, season - 1, season + 1]) {
    const byDate = filterUpcoming(
      await fetchFixturesByLeagueDateRange({
        leagueId,
        season: seasonCandidate,
        from,
        to,
      }),
    );

    if (byDate.length > 0) {
      console.info(
        `[fetch-upcoming-fixtures] league ${leagueId}: next=${next} returned 0 — fallback ${from}→${to} season=${seasonCandidate} returned ${byDate.length}`,
      );

      return filterWithinHorizon(byDate, maxDaysAhead);
    }
  }

  console.info(
    `[fetch-upcoming-fixtures] league ${leagueId}: next=${next} and date fallback ${from}→${to} (seasons ${season}/${season + 1}) returned 0`,
  );

  return [];
}

export interface FetchUpcomingFixturesOptions {
  /** `next` param per league (default 5) */
  perLeague?: number;
  season?: number;
  /** Only include fixtures kicking off within this many days (cron safety window) */
  maxDaysAhead?: number;
  /** Fetch a single league only (reduces API load for admin filters) */
  leagueId?: number;
}

/**
 * Fetch upcoming not-started fixtures for all configured FOOTBALL_LEAGUES.
 * Tries `next=N` first; during summer break falls back to today → +30 days.
 */
export async function fetchUpcomingFixtures(
  options: FetchUpcomingFixturesOptions = {},
): Promise<ApiFootballFixtureRow[]> {
  const season = options.season ?? currentSeasonYear();
  const next = options.perLeague ?? DEFAULT_NEXT_COUNT;
  const { maxDaysAhead } = options;

  const leagueIds =
    options.leagueId != null ?
      [options.leagueId]
    : Object.values(FOOTBALL_LEAGUES).map((l) => l.id);

  const batches: ApiFootballFixtureRow[][] = [];

  for (const id of leagueIds) {
    try {
      batches.push(await fetchLeagueFixtures(id, season, next, maxDaysAhead));
    } catch (error) {
      console.error(`[fetch-upcoming-fixtures] league ${id} failed`, error);
      batches.push([]);
    }
  }

  const merged = batches.flat();

  merged.sort((a, b) => a.fixture.timestamp - b.fixture.timestamp);

  return merged;
}

export interface FetchLeagueFixturesByMaxRoundOptions {
  leagueId: number;
  season?: number;
  maxRound: number;
  /** Inclusive YYYY-MM-DD (defaults to FIXTURE_MIN_KICKOFF_DATE) */
  from?: string;
  /** Inclusive YYYY-MM-DD (defaults to +90 days from `from`) */
  to?: string;
}

/**
 * Fetch upcoming fixtures for one league limited to regular-season rounds 1…maxRound.
 */
export async function fetchLeagueFixturesByMaxRound(
  options: FetchLeagueFixturesByMaxRoundOptions,
): Promise<ApiFootballFixtureRow[]> {
  const baseSeason = options.season ?? currentSeasonYear();
  const from = options.from ?? getFixtureMinKickoffDateYmd();
  const toDate = new Date(`${from}T00:00:00.000Z`);
  toDate.setUTCDate(toDate.getUTCDate() + 90);
  const to = options.to ?? formatDateYmd(toDate);

  const seasonCandidates = [
    baseSeason,
    baseSeason - 1,
    baseSeason + 1,
  ].filter((value, index, list) => list.indexOf(value) === index);

  for (const season of seasonCandidates) {
    const raw = await fetchFixturesByLeagueDateRange({
      leagueId: options.leagueId,
      season,
      from,
      to,
    });

    const upcoming = filterMinKickoff(filterUpcoming(raw));
    const filtered = filterFixturesByMaxRound(upcoming, options.maxRound);

    if (filtered.length > 0) {
      filtered.sort((a, b) => a.fixture.timestamp - b.fixture.timestamp);

      console.info(
        `[fetch-upcoming-fixtures] league ${options.leagueId} season ${season} rounds 1-${options.maxRound}: ${filtered.length} fixtures (${from}→${to})`,
      );

      return filtered;
    }

    if (upcoming.length > 0) {
      upcoming.sort((a, b) => a.fixture.timestamp - b.fixture.timestamp);

      console.info(
        `[fetch-upcoming-fixtures] league ${options.leagueId} season ${season}: round filter 0 — using ${upcoming.length} upcoming fixtures (${from}→${to})`,
      );

      return upcoming;
    }
  }

  console.info(
    `[fetch-upcoming-fixtures] league ${options.leagueId}: no upcoming fixtures (${from}→${to}, seasons ${seasonCandidates.join("/")})`,
  );

  return [];
}
