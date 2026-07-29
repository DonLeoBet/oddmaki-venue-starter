import type {
  ApiFootballFixtureRow,
  ApiFootballFixturesResponse,
} from "./types";
import { API_FOOTBALL_HOST, FOOTBALL_LEAGUES } from "./constants";

const UPCOMING_STATUSES = new Set(["NS", "TBD"]);

function currentSeasonYear(): number {
  const now = new Date();
  const month = now.getUTCMonth() + 1;

  // European leagues: season starts ~Aug. Before August, use previous year.
  return month >= 8 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
}

function getApiKey(): string {
  const key =
    process.env.API_FOOTBALL_KEY ??
    process.env.API_FOOTBALL_API_KEY ??
    process.env.FOOTBALL_API_KEY;

  if (!key?.trim()) {
    throw new Error(
      "Missing API-Football key. Set API_FOOTBALL_KEY (or API_FOOTBALL_API_KEY).",
    );
  }

  return key.trim();
}

async function fetchLeagueFixtures(
  leagueId: number,
  season: number,
  next: number,
): Promise<ApiFootballFixtureRow[]> {
  const url = new URL(`https://${API_FOOTBALL_HOST}/fixtures`);
  url.searchParams.set("league", String(leagueId));
  url.searchParams.set("season", String(season));
  url.searchParams.set("next", String(next));

  const response = await fetch(url, {
    headers: {
      "x-apisports-key": getApiKey(),
    },
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");

    throw new Error(
      `API-Football HTTP ${response.status} for league ${leagueId}: ${body.slice(0, 300)}`,
    );
  }

  const payload = (await response.json()) as ApiFootballFixturesResponse;

  if (payload.errors) {
    const message = Array.isArray(payload.errors)
      ? payload.errors.join("; ")
      : Object.values(payload.errors).join("; ");

    throw new Error(`API-Football error for league ${leagueId}: ${message}`);
  }

  return (payload.response ?? []).filter((row) =>
    UPCOMING_STATUSES.has(row.fixture.status.short),
  );
}

export interface FetchUpcomingFixturesOptions {
  /** Number of upcoming fixtures per league (default 15) */
  perLeague?: number;
  season?: number;
}

/**
 * Fetch upcoming not-started fixtures for Eredivisie (88) and Premier League (39).
 */
export async function fetchUpcomingFixtures(
  options: FetchUpcomingFixturesOptions = {},
): Promise<ApiFootballFixtureRow[]> {
  const season = options.season ?? currentSeasonYear();
  const perLeague = options.perLeague ?? 15;

  const leagueIds = Object.values(FOOTBALL_LEAGUES).map((l) => l.id);
  const batches = await Promise.all(
    leagueIds.map((id) => fetchLeagueFixtures(id, season, perLeague)),
  );

  const merged = batches.flat();

  // Stable sort: earliest kickoff first
  merged.sort((a, b) => a.fixture.timestamp - b.fixture.timestamp);

  return merged;
}
