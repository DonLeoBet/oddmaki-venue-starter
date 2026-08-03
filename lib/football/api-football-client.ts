import type { ApiFootballFixturesResponse } from "./types";

/** Direct api-sports.io host (not RapidAPI) */
export const API_FOOTBALL_BASE_URL =
  process.env.FOOTBALL_API_URL?.replace(/\/$/, "") ??
  "https://v3.football.api-sports.io";

/**
 * API key from api-sports.io dashboard.
 * Primary: FOOTBALL_API_KEY (Poly.Football .env convention).
 */
export function getApiFootballKey(): string {
  const key =
    process.env.FOOTBALL_API_KEY ??
    process.env.API_FOOTBALL_KEY ??
    process.env.API_FOOTBALL_API_KEY;

  if (!key?.trim()) {
    throw new Error(
      "Missing API-Football key. Set FOOTBALL_API_KEY in .env (api-sports.io direct key).",
    );
  }

  return key.trim();
}

/** api-sports.io auth header — NOT x-rapidapi-key */
export function getApiFootballHeaders(): HeadersInit {
  return {
    "x-apisports-key": getApiFootballKey(),
  };
}

/**
 * api-sports returns `"errors": []` on success. Only treat non-empty errors as failures.
 */
export function extractApiFootballErrorMessage(errors: unknown): string | null {
  if (errors == null) return null;

  if (Array.isArray(errors)) {
    const messages = errors
      .map((entry) => String(entry).trim())
      .filter(Boolean);

    return messages.length > 0 ? messages.join("; ") : null;
  }

  if (typeof errors === "object") {
    const messages = Object.entries(errors as Record<string, unknown>)
      .map(([key, value]) => {
        const text = String(value ?? "").trim();

        return text ? `${key}: ${text}` : "";
      })
      .filter(Boolean);

    return messages.length > 0 ? messages.join("; ") : null;
  }

  const text = String(errors).trim();

  return text || null;
}

export async function apiFootballGet<TResponse>(
  path: string,
  params: Record<string, string | number>,
  timeoutMs = 25_000,
): Promise<TResponse> {
  const url = new URL(
    path.startsWith("/") ? path.slice(1) : path,
    `${API_FOOTBALL_BASE_URL}/`,
  );

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }

  console.info(`[api-football] GET ${url.pathname}?${url.searchParams.toString()}`);

  try {
    const response = await fetch(url.toString(), {
      headers: getApiFootballHeaders(),
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");

      throw new Error(
        `API-Football HTTP ${response.status} ${url.pathname}: ${body.slice(0, 400)}`,
      );
    }

    const payload = (await response.json()) as TResponse & {
      errors?: unknown;
      results?: number;
    };

    const errorMessage = extractApiFootballErrorMessage(payload.errors);

    if (errorMessage) {
      throw new Error(`API-Football error ${url.pathname}: ${errorMessage}`);
    }

    return payload;
  } catch (error) {
    console.error(`[api-football] GET ${url.pathname} failed:`, error);
    throw error;
  }
}

export async function fetchFixturesByLeague(params: {
  leagueId: number;
  season: number;
  next: number;
}): Promise<ApiFootballFixturesResponse["response"]> {
  const payload = await apiFootballGet<ApiFootballFixturesResponse>(
    "/fixtures",
    {
      league: params.leagueId,
      season: params.season,
      next: params.next,
    },
  );

  return payload.response ?? [];
}

export async function fetchFixturesByLeagueDateRange(params: {
  leagueId: number;
  season: number;
  from: string;
  to: string;
}): Promise<ApiFootballFixturesResponse["response"]> {
  const payload = await apiFootballGet<ApiFootballFixturesResponse>(
    "/fixtures",
    {
      league: params.leagueId,
      season: params.season,
      from: params.from,
      to: params.to,
    },
  );

  return payload.response ?? [];
}

export async function fetchFixtureById(
  fixtureId: number,
): Promise<ApiFootballFixturesResponse["response"][number] | null> {
  const payload = await apiFootballGet<ApiFootballFixturesResponse>("/fixtures", {
    id: fixtureId,
  });

  return payload.response?.[0] ?? null;
}

export interface ApiFootballTeamRow {
  team: {
    id: number;
    name: string;
    code: string | null;
  };
}

export interface ApiFootballTeamsResponse {
  response: ApiFootballTeamRow[];
  errors?: unknown;
}

export async function fetchTeamsByLeague(params: {
  leagueId: number;
  season: number;
}): Promise<ApiFootballTeamRow[]> {
  try {
    const payload = await apiFootballGet<ApiFootballTeamsResponse>("/teams", {
      league: params.leagueId,
      season: params.season,
    });

    const teams = payload.response ?? [];

    console.info(
      `[api-football] /teams league=${params.leagueId} season=${params.season} → ${teams.length} teams`,
    );

    return teams;
  } catch (error) {
    console.error(
      `[api-football] fetchTeamsByLeague failed league=${params.leagueId} season=${params.season}:`,
      error,
    );
    throw error;
  }
}

export interface ApiFootballStandingTeamRow {
  team: {
    id: number;
    name: string;
  };
}

export interface ApiFootballStandingsResponse {
  response: Array<{
    league: { id: number; season: number };
    standings: ApiFootballStandingTeamRow[][];
  }>;
  errors?: unknown;
}

/** Teams from league standings tables (accurate domestic participants). */
export async function fetchStandingsTeamsByLeague(params: {
  leagueId: number;
  season: number;
}): Promise<ApiFootballTeamRow[]> {
  try {
    const payload = await apiFootballGet<ApiFootballStandingsResponse>(
      "/standings",
      {
        league: params.leagueId,
        season: params.season,
      },
    );

    const unique = new Map<number, ApiFootballTeamRow>();

    for (const block of payload.response ?? []) {
      for (const group of block.standings ?? []) {
        for (const row of group) {
          const name = row.team?.name?.trim();

          if (!name || !row.team.id) continue;

          unique.set(row.team.id, {
            team: {
              id: row.team.id,
              name,
              code: null,
            },
          });
        }
      }
    }

    const teams = Array.from(unique.values());

    console.info(
      `[api-football] /standings league=${params.leagueId} season=${params.season} → ${teams.length} teams`,
    );

    return teams;
  } catch (error) {
    console.error(
      `[api-football] fetchStandingsTeamsByLeague failed league=${params.leagueId} season=${params.season}:`,
      error,
    );

    return [];
  }
}
