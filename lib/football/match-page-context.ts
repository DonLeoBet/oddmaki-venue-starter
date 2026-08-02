import type { ApiFootballFixturesResponse } from "./types";

import { apiFootballGet } from "./api-football-client";
import { getTeamLogo } from "./team-logo";

export interface StandingRow {
  rank: number;
  teamId: number;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  form: string | null;
}

export interface Bookmaker1x2Odds {
  bookmaker: string;
  home: string | null;
  draw: string | null;
  away: string | null;
}

export interface H2HSummary {
  homeWins: number;
  draws: number;
  awayWins: number;
  total: number;
}

export interface H2HMatchResult {
  date: string;
  homeTeamId: number;
  awayTeamId: number;
  homeTeamName: string;
  awayTeamName: string;
  homeGoals: number;
  awayGoals: number;
}

export interface RecentMatchResult {
  date: string;
  homeTeamId: number;
  awayTeamId: number;
  homeTeamName: string;
  awayTeamName: string;
  homeGoals: number;
  awayGoals: number;
  isHomeTeam: boolean;
  result: "W" | "D" | "L";
}

export interface TeamFormBlock {
  teamId: number;
  teamName: string;
  logoUrl: string | null;
  form: string | null;
  recentMatches: RecentMatchResult[];
}

export interface MatchFaqItem {
  question: string;
  answer: string;
}

export interface MatchPageContext {
  fixtureId: number;
  leagueId: number;
  leagueName: string;
  season: number;
  venue: string | null;
  venueCity: string | null;
  kickoffIso: string | null;
  fixtureStatus: string | null;
  homeTeamId: number;
  awayTeamId: number;
  homeTeamName: string;
  awayTeamName: string;
  standings: StandingRow[];
  standingsSeason: number;
  bookmakerOdds: Bookmaker1x2Odds[];
  h2h: H2HSummary | null;
  h2hMatches: H2HMatchResult[];
  homeForm: TeamFormBlock | null;
  awayForm: TeamFormBlock | null;
  homeLogoUrl: string | null;
  awayLogoUrl: string | null;
  predictionAdvice: string | null;
  likelyLineupNote: string | null;
  faq: MatchFaqItem[];
}

interface StandingsApiRow {
  rank?: number;
  team?: { id?: number; name?: string };
  points?: number;
  form?: string | null;
  all?: {
    played?: number;
    win?: number;
    draw?: number;
    lose?: number;
    goals?: { for?: number; against?: number };
  };
}

async function fetchFixtureRow(fixtureId: number) {
  const payload = await apiFootballGet<ApiFootballFixturesResponse>("/fixtures", {
    id: fixtureId,
  });

  return payload.response?.[0] ?? null;
}

async function fetchStandingsTable(
  leagueId: number,
  season: number,
): Promise<{ rows: StandingRow[]; standingsSeason: number }> {
  const parsePayload = (payload: {
    response?: Array<{
      standings?: StandingsApiRow[][];
      league?: { standings?: StandingsApiRow[][] };
    }>;
  }): StandingRow[] => {
    const rows: StandingRow[] = [];

    for (const block of payload.response ?? []) {
      const groups = block.standings ?? block.league?.standings ?? [];

      for (const group of groups) {
        for (const row of group) {
          const name = row.team?.name?.trim();
          const teamId = row.team?.id;

          if (!name || !teamId) continue;

          rows.push({
            rank: row.rank ?? rows.length + 1,
            teamId,
            teamName: name,
            played: row.all?.played ?? 0,
            won: row.all?.win ?? 0,
            drawn: row.all?.draw ?? 0,
            lost: row.all?.lose ?? 0,
            goalsFor: row.all?.goals?.for ?? 0,
            goalsAgainst: row.all?.goals?.against ?? 0,
            points: row.points ?? 0,
            form: row.form ?? null,
          });
        }
      }
    }

    return rows.sort((a, b) => a.rank - b.rank);
  };

  let fallbackRows: StandingRow[] = [];
  let fallbackSeason = season;

  for (const candidateSeason of [season, season - 1]) {
    const payload = await apiFootballGet<{
      response?: Array<{
        standings?: StandingsApiRow[][];
        league?: { standings?: StandingsApiRow[][] };
      }>;
    }>("/standings", { league: leagueId, season: candidateSeason });

    const rows = parsePayload(payload);

    if (candidateSeason === season && rows.length > 0) {
      return { rows, standingsSeason: season };
    }

    if (rows.length > 0 && rows.some((row) => row.played > 0)) {
      return { rows, standingsSeason: candidateSeason };
    }

    if (rows.length > fallbackRows.length) {
      fallbackRows = rows;
      fallbackSeason = candidateSeason;
    }
  }

  return { rows: fallbackRows, standingsSeason: fallbackSeason };
}

async function fetchHeadToHead(
  homeTeamId: number,
  awayTeamId: number,
): Promise<{ summary: H2HSummary | null; matches: H2HMatchResult[] }> {
  try {
    const payload = await apiFootballGet<ApiFootballFixturesResponse>(
      "/fixtures/headtohead",
      { h2h: `${homeTeamId}-${awayTeamId}`, last: 10 },
    );

    const fixtures = payload.response ?? [];
    const matches: H2HMatchResult[] = [];

    if (fixtures.length === 0) return { summary: null, matches: [] };

    let homeWins = 0;
    let draws = 0;
    let awayWins = 0;

    for (const row of fixtures) {
      const gh = row.goals?.home;
      const ga = row.goals?.away;

      if (gh == null || ga == null) continue;

      matches.push({
        date: row.fixture.date,
        homeTeamId: row.teams.home.id,
        awayTeamId: row.teams.away.id,
        homeTeamName: row.teams.home.name,
        awayTeamName: row.teams.away.name,
        homeGoals: gh,
        awayGoals: ga,
      });

      if (gh === ga) {
        draws += 1;
        continue;
      }

      const homeSideIsMatchHome = row.teams.home.id === homeTeamId;

      if (homeSideIsMatchHome) {
        if (gh > ga) homeWins += 1;
        else awayWins += 1;
      } else if (row.teams.home.id === awayTeamId) {
        if (gh > ga) awayWins += 1;
        else homeWins += 1;
      }
    }

    const total = homeWins + draws + awayWins;

    return {
      summary:
        total > 0 ?
          { homeWins, draws, awayWins, total }
        : null,
      matches,
    };
  } catch {
    return { summary: null, matches: [] };
  }
}

function resultForTeam(
  teamId: number,
  row: {
    teams: { home: { id: number }; away: { id: number } };
    goals: { home: number; away: number };
  },
): "W" | "D" | "L" {
  const gh = row.goals.home;
  const ga = row.goals.away;

  if (gh === ga) return "D";

  const teamIsHome = row.teams.home.id === teamId;

  if (teamIsHome) return gh > ga ? "W" : "L";

  return ga > gh ? "W" : "L";
}

async function fetchTeamFormBlock(
  teamId: number,
  teamName: string,
  logoUrl: string | null,
  formFromStandings: string | null,
): Promise<TeamFormBlock | null> {
  try {
    const payload = await apiFootballGet<ApiFootballFixturesResponse>(
      "/fixtures",
      { team: teamId, last: 8 },
    );

    const recentMatches: RecentMatchResult[] = [];

    for (const row of payload.response ?? []) {
      const gh = row.goals?.home;
      const ga = row.goals?.away;
      const status = row.fixture.status?.short;

      if (gh == null || ga == null) continue;
      if (status && !["FT", "AET", "PEN"].includes(status)) continue;

      recentMatches.push({
        date: row.fixture.date,
        homeTeamId: row.teams.home.id,
        awayTeamId: row.teams.away.id,
        homeTeamName: row.teams.home.name,
        awayTeamName: row.teams.away.name,
        homeGoals: gh,
        awayGoals: ga,
        isHomeTeam: row.teams.home.id === teamId,
        result: resultForTeam(teamId, {
          teams: row.teams,
          goals: { home: gh, away: ga },
        }),
      });

      if (recentMatches.length >= 5) break;
    }

    const form =
      formFromStandings?.trim() ||
      recentMatches
        .slice(0, 5)
        .map((match) => match.result)
        .join("");

    if (recentMatches.length === 0 && !form) return null;

    return {
      teamId,
      teamName,
      logoUrl,
      form: form || null,
      recentMatches,
    };
  } catch {
    return null;
  }
}

async function fetchSquadSample(teamId: number): Promise<string[]> {
  try {
    const payload = await apiFootballGet<{
      response?: Array<{
        players?: Array<{ name?: string; position?: string }>;
      }>;
    }>("/players/squads", { team: teamId });

    return (payload.response?.[0]?.players ?? [])
      .filter((player) => player.name?.trim())
      .slice(0, 5)
      .map((player) => player.name!.trim());
  } catch {
    return [];
  }
}

async function fetchBookmakerOdds(fixtureId: number): Promise<Bookmaker1x2Odds[]> {
  try {
    const payload = await apiFootballGet<{
      response?: Array<{
        bookmakers?: Array<{
          name?: string;
          bets?: Array<{
            name?: string;
            values?: Array<{ value?: string; odd?: string }>;
          }>;
        }>;
      }>;
    }>("/odds", { fixture: fixtureId });

    const bookmakers = payload.response?.[0]?.bookmakers ?? [];
    const results: Bookmaker1x2Odds[] = [];

    for (const bookmaker of bookmakers.slice(0, 5)) {
      const matchWinner = bookmaker.bets?.find((bet) =>
        /match winner|1x2|full time result/i.test(bet.name ?? ""),
      );

      if (!matchWinner?.values?.length) continue;

      const findOdd = (keys: string[]) =>
        matchWinner.values?.find((entry) =>
          keys.some((key) =>
            (entry.value ?? "").toLowerCase().includes(key.toLowerCase()),
          ),
        )?.odd ?? null;

      results.push({
        bookmaker: bookmaker.name ?? "Bookmaker",
        home: findOdd(["home", "1"]),
        draw: findOdd(["draw", "x"]),
        away: findOdd(["away", "2"]),
      });
    }

    return results;
  } catch {
    return [];
  }
}

async function fetchPrediction(fixtureId: number) {
  try {
    const payload = await apiFootballGet<{
      response?: Array<{
        predictions?: { advice?: string };
        teams?: {
          home?: { name?: string };
          away?: { name?: string };
        };
      }>;
    }>("/predictions", { fixture: fixtureId });

    const row = payload.response?.[0];

    return {
      advice: row?.predictions?.advice?.trim() || null,
      home: row?.teams?.home?.name ?? null,
      away: row?.teams?.away?.name ?? null,
    };
  } catch {
    return { advice: null, home: null, away: null };
  }
}

function buildFaq(params: {
  home: string;
  away: string;
  leagueName: string;
  kickoffIso: string | null;
  venue: string | null;
  venueCity: string | null;
  h2h: H2HSummary | null;
  predictionAdvice: string | null;
  homeStanding: StandingRow | null;
  awayStanding: StandingRow | null;
  homeSquad: string[];
  awaySquad: string[];
}): MatchFaqItem[] {
  const items: MatchFaqItem[] = [
    {
      question: `When is ${params.home} vs ${params.away}?`,
      answer:
        params.kickoffIso ?
          `Kickoff is scheduled for ${new Date(params.kickoffIso).toLocaleString("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            timeZoneName: "short",
          })}.`
        : `See the match header for the latest kickoff time.`,
    },
    {
      question: `What league is ${params.home} vs ${params.away}?`,
      answer: `This fixture is part of the ${params.leagueName}.`,
    },
  ];

  if (params.venue) {
    items.push({
      question: `Where is ${params.home} vs ${params.away} played?`,
      answer:
        params.venueCity ?
          `${params.venue}, ${params.venueCity}.`
        : `${params.venue}.`,
    });
  }

  if (params.homeStanding && params.homeStanding.played > 0) {
    items.push({
      question: `What are ${params.home}'s ${params.leagueName} stats this season?`,
      answer: `${params.home} have played ${params.homeStanding.played} league matches: ${params.homeStanding.won} wins, ${params.homeStanding.drawn} draws, ${params.homeStanding.lost} losses (${params.homeStanding.points} points, rank ${params.homeStanding.rank}).`,
    });
  }

  if (params.awayStanding && params.awayStanding.played > 0) {
    items.push({
      question: `What are ${params.away}'s ${params.leagueName} stats this season?`,
      answer: `${params.away} have played ${params.awayStanding.played} league matches: ${params.awayStanding.won} wins, ${params.awayStanding.drawn} draws, ${params.awayStanding.lost} losses (${params.awayStanding.points} points, rank ${params.awayStanding.rank}).`,
    });
  }

  if (params.h2h && params.h2h.total > 0) {
    items.push({
      question: `What is the head-to-head record between ${params.home} and ${params.away}?`,
      answer: `In the last ${params.h2h.total} meetings tracked by our data provider: ${params.home} won ${params.h2h.homeWins}, ${params.h2h.draws} draws, ${params.away} won ${params.h2h.awayWins}.`,
    });
  }

  items.push({
    question: "How does 1X2 work on Poly.Football?",
    answer:
      "1X2 covers the full-time result: home win, draw, or away win. Each outcome is a separate on-chain market. Prices reflect implied probability from trading on Base.",
  });

  items.push({
    question: "When are match markets resolved?",
    answer:
      "After full time, the official result is usually proposed on-chain within about an hour. There is then a 24-hour challenge window before final settlement. If no one disputes, winners can redeem USDC once the market is resolved.",
  });

  if (params.predictionAdvice) {
    items.push({
      question: `Who is favoured in ${params.home} vs ${params.away}?`,
      answer: params.predictionAdvice,
    });
  }

  if (params.homeSquad.length > 0 || params.awaySquad.length > 0) {
    const parts: string[] = [];

    if (params.homeSquad.length > 0) {
      parts.push(`${params.home} squad includes ${params.homeSquad.join(", ")}`);
    }

    if (params.awaySquad.length > 0) {
      parts.push(`${params.away} squad includes ${params.awaySquad.join(", ")}`);
    }

    items.push({
      question: `Which players are in the ${params.home} and ${params.away} squads?`,
      answer: `${parts.join(". ")}. Official lineups are confirmed closer to kickoff.`,
    });
  }

  return items;
}

export async function buildMatchPageContext(
  fixtureId: number,
): Promise<MatchPageContext | null> {
  const row = await fetchFixtureRow(fixtureId);

  if (!row?.teams?.home?.id || !row.teams.away?.id) return null;

  const venue = row.fixture.venue;

  const homeTeamName = row.teams.home.name.trim();
  const awayTeamName = row.teams.away.name.trim();
  const leagueId = row.league.id;
  const season = row.league.season;
  const leagueName = row.league.name;

  const homeLogoUrl = getTeamLogo(row.teams.home);
  const awayLogoUrl = getTeamLogo(row.teams.away);

  const [standingsResult, bookmakerOdds, h2hResult, prediction] =
    await Promise.all([
      fetchStandingsTable(leagueId, season),
      fetchBookmakerOdds(fixtureId),
      fetchHeadToHead(row.teams.home.id, row.teams.away.id),
      fetchPrediction(fixtureId),
    ]);

  const { rows: standings, standingsSeason } = standingsResult;
  const h2h = h2hResult.summary;
  const h2hMatches = h2hResult.matches;

  const homeSquad = await fetchSquadSample(row.teams.home.id);
  const awaySquad = await fetchSquadSample(row.teams.away.id);

  const homeStanding =
    standings.find((entry) => entry.teamId === row.teams.home.id) ?? null;
  const awayStanding =
    standings.find((entry) => entry.teamId === row.teams.away.id) ?? null;

  const [homeForm, awayForm] = await Promise.all([
    fetchTeamFormBlock(
      row.teams.home.id,
      homeTeamName,
      homeLogoUrl,
      homeStanding?.form ?? null,
    ),
    fetchTeamFormBlock(
      row.teams.away.id,
      awayTeamName,
      awayLogoUrl,
      awayStanding?.form ?? null,
    ),
  ]);

  const faq = buildFaq({
    home: homeTeamName,
    away: awayTeamName,
    leagueName,
    kickoffIso: row.fixture.date,
    venue: venue?.name?.trim() ?? null,
    venueCity: venue?.city?.trim() ?? null,
    h2h,
    predictionAdvice: prediction.advice,
    homeStanding,
    awayStanding,
    homeSquad,
    awaySquad,
  });

  return {
    fixtureId,
    leagueId,
    leagueName,
    season,
    venue: venue?.name?.trim() ?? null,
    venueCity: venue?.city?.trim() ?? null,
    kickoffIso: row.fixture.date,
    fixtureStatus: row.fixture.status?.short ?? null,
    homeTeamId: row.teams.home.id,
    awayTeamId: row.teams.away.id,
    homeTeamName,
    awayTeamName,
    standings,
    standingsSeason,
    bookmakerOdds,
    h2h,
    h2hMatches,
    homeForm,
    awayForm,
    homeLogoUrl,
    awayLogoUrl,
    predictionAdvice: prediction.advice,
    likelyLineupNote: prediction.advice,
    faq,
  };
}
