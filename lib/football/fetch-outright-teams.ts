import type { ApiFootballTeamRow } from "./api-football-client";
import type { PreparedOutrightMarketGroup } from "./types";

import {
  OUTRIGHT_SEASON_YEAR,
  resolveTopLeagues,
  type TopLeague,
} from "@/config/top-leagues";
import { fetchOutrightParticipants } from "./fetch-outright-participants";
import { discoverOutrightLeaguesForSeason } from "./discover-outright-leagues";
import { outrightTag } from "./constants";
import { formatOutrightWinnerTitle, formatSeasonLabel } from "./season";

import { MAX_TAGS } from "@/config/tags.config";

const LOG_PREFIX = "[fetch-outright-league-teams]";
const API_FETCH_DELAY_MS = 1_000;

export interface FetchOutrightTeamsOptions {
  season?: number;
  /** Limit fetch to specific league IDs (e.g. [88] for Eredivisie smoke test) */
  leagueIds?: number[];
  /** Discover worldwide leagues from API-Football for the target season. */
  discoverWorld?: boolean;
}

export interface OutrightLeagueFetchResult {
  leagueId: number;
  leagueTag: string;
  countryTag: string;
  season: number;
  teams: ApiFootballTeamRow[];
  status: "ok" | "empty" | "error";
  source?: string;
  error?: string;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch league squads sequentially — one league at a time to avoid rate limits / hangs.
 */
export async function fetchOutrightLeagueTeams(
  options: FetchOutrightTeamsOptions = {},
): Promise<OutrightLeagueFetchResult[]> {
  const season = options.season ?? OUTRIGHT_SEASON_YEAR;

  let leagues: TopLeague[];

  if (options.leagueIds?.length) {
    leagues = resolveTopLeagues(options.leagueIds);
  } else if (options.discoverWorld) {
    leagues = await discoverOutrightLeaguesForSeason(season);
    console.info(
      `${LOG_PREFIX} discovered ${leagues.length} outright leagues for season=${season}`,
    );
  } else {
    leagues = resolveTopLeagues();
  }

  if (leagues.length === 0) {
    throw new Error(
      `No top leagues matched leagueIds=${JSON.stringify(options.leagueIds ?? [])}`,
    );
  }

  const results: OutrightLeagueFetchResult[] = [];

  for (let index = 0; index < leagues.length; index++) {
    const league = leagues[index];

    if (index > 0) {
      await wait(API_FETCH_DELAY_MS);
    }

    results.push(await fetchSingleOutrightLeague(league, season));
  }

  return results;
}

async function fetchSingleOutrightLeague(
  league: TopLeague,
  season: number,
): Promise<OutrightLeagueFetchResult> {
  console.info(
    `${LOG_PREFIX} fetching league ${league.id} (${league.tag}) season=${season}`,
  );

  try {
    const { teams, source } = await fetchOutrightParticipants(league, season);

    const status = teams.length > 0 ? "ok" : "empty";

    console.info(
      `${LOG_PREFIX} league ${league.id} (${league.tag}): ${teams.length} teams (${status}, ${source})`,
    );

    if (status === "empty") {
      console.error(
        `${LOG_PREFIX} league ${league.id} (${league.tag}) returned 0 teams — check API plan/season coverage`,
      );
    }

    return {
      leagueId: league.id,
      leagueTag: league.tag,
      countryTag: league.countryTag,
      season,
      teams,
      source,
      status,
      error:
        status === "empty" ?
          `No teams returned for ${league.tag} season ${season} (${source})`
        : undefined,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    console.error(
      `${LOG_PREFIX} league ${league.id} (${league.tag}) failed:`,
      error,
    );

    return {
      leagueId: league.id,
      leagueTag: league.tag,
      countryTag: league.countryTag,
      season,
      teams: [],
      status: "error",
      error: message,
    };
  }
}

export function mapOutrightToMarketGroup(input: {
  leagueId: number;
  leagueTag: string;
  countryTag: string;
  season: number;
  teams: ApiFootballTeamRow[];
}): PreparedOutrightMarketGroup | null {
  const uniqueTeams = new Map<number, string>();

  for (const row of input.teams) {
    const name = row.team.name.trim();

    if (name) uniqueTeams.set(row.team.id, name);
  }

  if (uniqueTeams.size < 2) return null;

  const seasonLabel = formatSeasonLabel(input.season);
  const ref = `OUT-${input.leagueId}`;
  const title = formatOutrightWinnerTitle(input.leagueTag, input.season);
  const description =
    `Which team will officially win the tournament title for the ${seasonLabel} season? ` +
    `Exactly one outcome resolves YES. Market resolves based on official tournament statistics. Ref: ${ref}.`;

  const tags = [
    outrightTag(input.leagueId, input.season),
    "outrights",
    "sports",
    input.leagueTag,
    input.countryTag,
  ].slice(0, MAX_TAGS);

  const outcomes = Array.from(uniqueTeams.entries())
    .sort((a, b) => a[1].localeCompare(b[1]))
    .map(([teamId, teamName]) => ({
      name: teamName,
      question: `Will ${teamName} win ${input.leagueTag} ${seasonLabel}?`,
      description:
        `${input.leagueTag} ${seasonLabel} outright winner market. ` +
        `Resolves YES if ${teamName} is crowned champion. Ref: ${ref}-T${teamId}.`,
    }));

  return {
    leagueId: input.leagueId,
    season: input.season,
    leagueName: input.leagueTag,
    seasonLabel,
    title,
    description,
    tags,
    outcomes,
    tickSize: "0.01",
    additionalReward: 0,
    liveness: 0,
    activateImmediately: true,
  };
}

export interface PreparedOutrightFetchSummary {
  groups: PreparedOutrightMarketGroup[];
  leagueResults: OutrightLeagueFetchResult[];
  errors: string[];
  season: number;
}

export async function fetchPreparedOutrightMarketGroups(
  options: FetchOutrightTeamsOptions = {},
): Promise<PreparedOutrightFetchSummary> {
  const season = options.season ?? OUTRIGHT_SEASON_YEAR;

  try {
    const leagueResults = await fetchOutrightLeagueTeams({ ...options, season });
    const groups = leagueResults
      .filter((batch) => batch.teams.length > 0)
      .map((batch) =>
        mapOutrightToMarketGroup({
          leagueId: batch.leagueId,
          leagueTag: batch.leagueTag,
          countryTag: batch.countryTag,
          season: batch.season,
          teams: batch.teams,
        }),
      )
      .filter((group): group is PreparedOutrightMarketGroup => group != null);

    const errors = leagueResults
      .filter((result) => result.status !== "ok")
      .map(
        (result) =>
          result.error ??
          `${result.leagueTag} (${result.leagueId}): no usable teams`,
      );

    if (groups.length === 0) {
      const detail =
        errors.length > 0 ?
          errors.join(" | ")
        : "All outright league fetches returned empty team lists";

      console.error(`${LOG_PREFIX} no outright groups prepared: ${detail}`);
    }

    return { groups, leagueResults, errors, season };
  } catch (error) {
    console.error(`${LOG_PREFIX} fatal fetch failure:`, error);
    throw error;
  }
}
