import type { ApiFootballTeamRow } from "./api-football-client";
import type { TopLeague } from "@/config/top-leagues";

import {
  fetchFixturesByLeagueDateRange,
  fetchStandingsTeamsByLeague,
  fetchTeamsByLeague,
} from "./api-football-client";
import { getFixtureMinKickoffDateYmd } from "./fixture-window";

const LOG_PREFIX = "[fetch-outright-participants]";

/** Early qualifying rounds pollute cup outright lists — skip them. */
const QUALIFYING_ROUND = /qualifying|preliminary|1st qualifying|2nd qualifying|3rd qualifying/i;

/** Main tournament stages suitable for outright winner markets. */
const MAIN_STAGE_ROUND =
  /group|league stage|knockout|round of|play-off|final|semi|quarter|1\/8|1\/16/i;

export interface OutrightParticipantFetchResult {
  teams: ApiFootballTeamRow[];
  source: string;
}

function toTeamRow(id: number, name: string): ApiFootballTeamRow {
  return {
    team: {
      id,
      name,
      code: null,
    },
  };
}

async function fetchDomesticParticipants(
  leagueId: number,
  season: number,
): Promise<OutrightParticipantFetchResult> {
  let teams = await fetchStandingsTeamsByLeague({ leagueId, season });

  if (teams.length >= 2) {
    return { teams, source: `standings-${season}` };
  }

  teams = await fetchTeamsByLeague({ leagueId, season });

  if (teams.length >= 2) {
    return { teams, source: `teams-${season}` };
  }

  const previousSeason = season - 1;

  teams = await fetchStandingsTeamsByLeague({
    leagueId,
    season: previousSeason,
  });

  if (teams.length >= 2) {
    console.warn(
      `${LOG_PREFIX} league ${leagueId}: using ${previousSeason} standings (pre-season roster not published yet)`,
    );

    return { teams, source: `standings-${previousSeason}-fallback` };
  }

  teams = await fetchTeamsByLeague({ leagueId, season: previousSeason });

  return { teams, source: `teams-${previousSeason}-fallback` };
}

async function fetchCupParticipants(
  leagueId: number,
  season: number,
): Promise<OutrightParticipantFetchResult> {
  const from = getFixtureMinKickoffDateYmd();
  const to = `${season + 1}-06-30`;

  const fixtures = await fetchFixturesByLeagueDateRange({
    leagueId,
    season,
    from,
    to,
  });

  const teamMap = new Map<number, ApiFootballTeamRow>();

  for (const row of fixtures) {
    const round = row.league.round ?? "";

    if (QUALIFYING_ROUND.test(round) && !MAIN_STAGE_ROUND.test(round)) {
      continue;
    }

    for (const side of [row.teams.home, row.teams.away]) {
      if (!side.name?.trim()) continue;

      teamMap.set(side.id, toTeamRow(side.id, side.name.trim()));
    }
  }

  if (teamMap.size >= 8) {
    return {
      teams: Array.from(teamMap.values()),
      source: `fixtures-${from}`,
    };
  }

  const standingsTeams = await fetchStandingsTeamsByLeague({
    leagueId,
    season,
  });

  if (standingsTeams.length >= 8) {
    return { teams: standingsTeams, source: `standings-${season}` };
  }

  const allTeams = await fetchTeamsByLeague({ leagueId, season });

  if (allTeams.length > 40) {
    console.error(
      `${LOG_PREFIX} league ${leagueId}: /teams returned ${allTeams.length} clubs (qualifiers) — skipping until main-stage fixtures are available`,
    );

    return { teams: [], source: "rejected-qualifier-pool" };
  }

  if (allTeams.length >= 2) {
    return { teams: allTeams, source: `teams-${season}` };
  }

  return { teams: [], source: "empty" };
}

export async function fetchOutrightParticipants(
  league: TopLeague,
  season: number,
): Promise<OutrightParticipantFetchResult> {
  const result =
    league.kind === "cup"
      ? await fetchCupParticipants(league.id, season)
      : await fetchDomesticParticipants(league.id, season);

  const sample = result.teams
    .slice(0, 4)
    .map((row) => row.team.name)
    .join(", ");

  console.info(
    `${LOG_PREFIX} ${league.tag} (${league.id}) season=${season} → ${result.teams.length} teams via ${result.source}${sample ? ` — e.g. ${sample}` : ""}`,
  );

  return result;
}
