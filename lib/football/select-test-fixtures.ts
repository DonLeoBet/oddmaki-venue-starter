import type { ApiFootballFixtureRow } from "./types";

import { LEAGUE_BY_ID } from "@/config/leagues";
import { fetchFixturesByLeagueDateRange } from "./api-football-client";
import { FOOTBALL_LEAGUES } from "./constants";
import { currentSeasonYear } from "./season";

const UPCOMING_STATUSES = new Set(["NS", "TBD"]);

/** Batch id embedded in on-chain tags + fixture metadata. */
export const TEST_BATCH_ID = "test_10d_1";
export const TEST_BATCH_TAG = `batch-${TEST_BATCH_ID}`;

/** Kickoff window: now + min … + max days (UTC). Override via env for admin runs. */
export const TEST_WINDOW_DAYS_MIN = Number.parseInt(
  process.env.TEST_WINDOW_DAYS_MIN ?? "9",
  10,
);
export const TEST_WINDOW_DAYS_MAX = Number.parseInt(
  process.env.TEST_WINDOW_DAYS_MAX ?? "11",
  10,
);

export interface TestFixtureWindow {
  daysMin: number;
  daysMax: number;
  fromYmd: string;
  toYmd: string;
  startUnix: number;
  endUnix: number;
  targetUnix: number;
}

export interface SelectedTestFixture {
  fixtureId: number;
  leagueId: number;
  leagueName: string;
  leagueSlug: string;
  home: string;
  away: string;
  kickoffIso: string;
  kickoffUnix: number;
  status: string;
  row: ApiFootballFixtureRow;
}

export interface SkippedTestLeague {
  leagueId: number;
  leagueName: string;
  reason: string;
}

export interface SelectTestFixturesResult {
  batch: typeof TEST_BATCH_ID;
  window: TestFixtureWindow;
  /** One API-Football call per configured football league. */
  apiCalls: number;
  selected: SelectedTestFixture[];
  skippedLeagues: SkippedTestLeague[];
}

function formatDateYmd(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function addUtcDays(date: Date, days: number): Date {
  const next = new Date(date);

  next.setUTCDate(next.getUTCDate() + days);

  return next;
}

export function computeTestFixtureWindow(
  reference = new Date(),
): TestFixtureWindow {
  const today = startOfUtcDay(reference);
  const fromDay = addUtcDays(today, TEST_WINDOW_DAYS_MIN);
  const toDay = addUtcDays(today, TEST_WINDOW_DAYS_MAX);
  const targetDay = addUtcDays(today, 10);

  const startUnix = Math.floor(fromDay.getTime() / 1000);
  const endUnix =
    Math.floor(addUtcDays(toDay, 1).getTime() / 1000) - 1;
  const targetUnix = Math.floor(
    (targetDay.getTime() + addUtcDays(targetDay, 1).getTime()) / 2 / 1000,
  );

  return {
    daysMin: TEST_WINDOW_DAYS_MIN,
    daysMax: TEST_WINDOW_DAYS_MAX,
    fromYmd: formatDateYmd(fromDay),
    toYmd: formatDateYmd(toDay),
    startUnix,
    endUnix,
    targetUnix,
  };
}

function inWindow(timestamp: number, window: TestFixtureWindow): boolean {
  return timestamp >= window.startUnix && timestamp <= window.endUnix;
}

function seasonForFixtureWindow(
  window: TestFixtureWindow,
  reference = new Date(),
): number {
  const fromMonth = Number.parseInt(window.fromYmd.slice(5, 7), 10);

  // Pre-season / early-season fixtures in Aug+ belong to the calendar year's season.
  if (fromMonth >= 8) {
    return Number.parseInt(window.fromYmd.slice(0, 4), 10);
  }

  return currentSeasonYear(reference);
}

function pickClosestToTarget(
  rows: ApiFootballFixtureRow[],
  window: TestFixtureWindow,
): ApiFootballFixtureRow | null {
  const candidates = rows.filter(
    (row) =>
      UPCOMING_STATUSES.has(row.fixture.status.short) &&
      inWindow(row.fixture.timestamp, window),
  );

  if (candidates.length === 0) return null;

  candidates.sort(
    (a, b) =>
      Math.abs(a.fixture.timestamp - window.targetUnix) -
      Math.abs(b.fixture.timestamp - window.targetUnix),
  );

  return candidates[0];
}

function toSelected(row: ApiFootballFixtureRow): SelectedTestFixture {
  const leagueDef = LEAGUE_BY_ID[row.league.id];

  return {
    fixtureId: row.fixture.id,
    leagueId: row.league.id,
    leagueName: row.league.name,
    leagueSlug: leagueDef?.slug ?? `league-${row.league.id}`,
    home: row.teams.home.name,
    away: row.teams.away.name,
    kickoffIso: row.fixture.date,
    kickoffUnix: row.fixture.timestamp,
    status: row.fixture.status.short,
    row,
  };
}

/**
 * Select at most one football fixture per configured league with kickoff
 * in the now + 9 … + 11 day window. Uses a narrow date-range query per
 * league to minimise API-Football credit usage.
 */
export async function selectTestFixtures(
  reference = new Date(),
): Promise<SelectTestFixturesResult> {
  const window = computeTestFixtureWindow(reference);
  const season = seasonForFixtureWindow(window, reference);
  const selected: SelectedTestFixture[] = [];
  const skippedLeagues: SkippedTestLeague[] = [];
  let apiCalls = 0;

  for (const league of Object.values(FOOTBALL_LEAGUES)) {
    let rows: ApiFootballFixtureRow[] = [];

    try {
      rows = await fetchFixturesByLeagueDateRange({
        leagueId: league.id,
        season,
        from: window.fromYmd,
        to: window.toYmd,
      });
      apiCalls += 1;
    } catch (error) {
      skippedLeagues.push({
        leagueId: league.id,
        leagueName: league.tag,
        reason:
          error instanceof Error ?
            `API error: ${error.message}`
          : "API error",
      });
      continue;
    }

    const pick = pickClosestToTarget(rows, window);

    if (!pick) {
      skippedLeagues.push({
        leagueId: league.id,
        leagueName: league.tag,
        reason: `No upcoming fixture in ${window.fromYmd} → ${window.toYmd}`,
      });
      continue;
    }

    selected.push(toSelected(pick));
  }

  selected.sort((a, b) => a.kickoffUnix - b.kickoffUnix);

  return {
    batch: TEST_BATCH_ID,
    window,
    apiCalls,
    selected,
    skippedLeagues,
  };
}
