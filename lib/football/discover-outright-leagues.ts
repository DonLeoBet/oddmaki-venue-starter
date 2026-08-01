import type { TopLeague } from "@/config/top-leagues";
import { TOP_LEAGUES } from "@/config/top-leagues";

import {
  apiFootballGet,
  extractApiFootballErrorMessage,
} from "./api-football-client";

interface ApiLeagueRow {
  league: {
    id: number;
    name: string;
    type: string;
  };
  country: {
    name: string;
    code: string | null;
  };
}

interface ApiLeaguesResponse {
  response: ApiLeagueRow[];
  errors?: unknown;
}

/** Names that are almost never top-division outright markets. */
const EXCLUDE_LEAGUE_NAME =
  /women|u19|u21|u23|u17|u20|youth|amateur|reserve|friendlies|frauen|femenin|feminina|damall|wsl|we league|girl|npl 2|npl 3|state league|qualifying|qualification|girone|lohko|oberliga|non league|iii liga|ii liga|3\. liga|4\. liga|5\. liga|tercera|rfef|serie c|serie d|national 2|national 3|national league|division 2|division 3|2\. division|3\. division|second league|third league|fourth league|liga ii\b|liga 2\b|liga 3\b|league two|league one|ettan|superettan|2\. bundesliga|3\. liga|ligue 2|segunda división|segunda division|primeira.*2|eerste divisie|tweede divisie|keuken|federal|metropolitana|primera b|primera c|primera nacional|torneo federal|paulista|carioca|gaúcho|gaucho|mineiro|cearense|catarinense|baiano|goiano|paranaense|pernambucano|sergipano|potiguar|maranhense|amazonense|capixaba|paraense|piauiense|rondoniense|roraimense|tocantinense|sul-matogrossense|matogrossense|brasiliense|acreano|mls next|usl |academ|play-off|promotion|relegation|highland|lowland|challenger pro|fnl\b|tipsport liga|esiliiga|kakkonen|ykkönen|ykkösliiga|1\. lyga|2\. liga classic|3\. snl|group \d|super league cup|league cup|fa wsl|division intermedia|expansión|expansion|apertura|clausura|next pro|w league/i;

const TOP_FLIGHT_SCORE: Array<{ pattern: RegExp; score: number }> = [
  { pattern: /^premier league$/i, score: 100 },
  { pattern: /^super league$/i, score: 98 },
  { pattern: /^superliga$/i, score: 98 },
  { pattern: /^super liga$/i, score: 98 },
  { pattern: /^primera división$/i, score: 96 },
  { pattern: /^primera division$/i, score: 96 },
  { pattern: /^serie a$/i, score: 96 },
  { pattern: /^bundesliga$/i, score: 96 },
  { pattern: /^ligue 1$/i, score: 96 },
  { pattern: /^eredivisie$/i, score: 96 },
  { pattern: /^primeira liga$/i, score: 96 },
  { pattern: /^major league soccer$/i, score: 96 },
  { pattern: /^liga mx$/i, score: 96 },
  { pattern: /^a-league$/i, score: 94 },
  { pattern: /^j1 league$/i, score: 94 },
  { pattern: /^k league 1$/i, score: 94 },
  { pattern: /^pro league$/i, score: 92 },
  { pattern: /^stars league$/i, score: 92 },
  { pattern: /^first league$/i, score: 88 },
  { pattern: /^1\. division$/i, score: 88 },
  { pattern: /^1st league/i, score: 86 },
  { pattern: /^meistriliiga$/i, score: 88 },
  { pattern: /^veikkausliiga$/i, score: 88 },
  { pattern: /^allsvenskan$/i, score: 88 },
  { pattern: /^eliteserien$/i, score: 88 },
  { pattern: /^ekstraklasa$/i, score: 88 },
  { pattern: /^premiership$/i, score: 88 },
  { pattern: /^npfl$/i, score: 88 },
  { pattern: /^v\.league 1$/i, score: 88 },
  { pattern: /^czech liga$/i, score: 88 },
  { pattern: /^premier soccer league$/i, score: 86 },
  { pattern: /^division profesional/i, score: 84 },
  { pattern: /^primera a$/i, score: 84 },
  { pattern: /^liga profesional/i, score: 84 },
  { pattern: /^championship$/i, score: 40 },
  { pattern: /^serie b$/i, score: 35 },
  { pattern: /^2\. liga$/i, score: 35 },
];

function scoreLeagueName(name: string): number {
  for (const rule of TOP_FLIGHT_SCORE) {
    if (rule.pattern.test(name.trim())) return rule.score;
  }

  return 20;
}

function countryTag(country: string): string {
  return `${country} Football`;
}

function cupCountryTag(name: string, country: string): string {
  if (/champions league|europa league|conference league|libertadores|sudamericana/i.test(name)) {
    return "International Football";
  }

  return countryTag(country);
}

/** Fetch API-Football leagues for season 2026+ and pick outright candidates worldwide. */
export async function discoverOutrightLeaguesForSeason(
  season: number,
): Promise<TopLeague[]> {
  const payload = await apiFootballGet<ApiLeaguesResponse>("/leagues", {
    season,
  });

  const errorMessage = extractApiFootballErrorMessage(payload.errors);

  if (errorMessage) {
    throw new Error(`League discovery failed: ${errorMessage}`);
  }

  const rows = payload.response ?? [];
  const byCountry = new Map<string, ApiLeagueRow[]>();
  const cups: TopLeague[] = [];

  for (const row of rows) {
    const { league, country } = row;
    const name = league.name.trim();

    if (EXCLUDE_LEAGUE_NAME.test(name)) continue;

    if (league.type === "Cup") {
      if (
        /world cup|euro|nations league|friendly|super cup|community shield|trophy|recopa|supercopa/i.test(
          name,
        )
      ) {
        continue;
      }

      if (
        /champions league|europa league|conference league|libertadores|sudamericana|fa cup|dfb pokal|coppa italia|copa del rey|coupe de france|taça de portugal|knvb beker|efl cup|league cup|national cup|domestic cup/i.test(
          name,
        )
      ) {
        cups.push({
          id: league.id,
          tag: name,
          countryTag: cupCountryTag(name, country.name),
          kind: "cup",
        });
      }

      continue;
    }

    if (league.type !== "League") continue;

    const list = byCountry.get(country.name) ?? [];

    list.push(row);
    byCountry.set(country.name, list);
  }

  const domestic: TopLeague[] = [];

  for (const [countryName, countryRows] of Array.from(byCountry.entries())) {
    const ranked = [...countryRows].sort(
      (a, b) =>
        scoreLeagueName(b.league.name) - scoreLeagueName(a.league.name) ||
        a.league.name.localeCompare(b.league.name),
    );

    const top = ranked[0];

    if (!top || scoreLeagueName(top.league.name) < 15) continue;

    domestic.push({
      id: top.league.id,
      tag: top.league.name,
      countryTag: countryTag(countryName),
      kind: "domestic",
    });
  }

  const merged = new Map<number, TopLeague>();

  for (const league of [...TOP_LEAGUES, ...domestic, ...cups]) {
    if (!merged.has(league.id)) merged.set(league.id, league);
  }

  return Array.from(merged.values()).sort(
    (a, b) =>
      a.countryTag.localeCompare(b.countryTag) || a.tag.localeCompare(b.tag),
  );
}

function mapApiLeagueRow(row: ApiLeagueRow): TopLeague {
  const name = row.league.name.trim();
  const kind: TopLeague["kind"] = row.league.type === "Cup" ? "cup" : "domestic";

  return {
    id: row.league.id,
    tag: name,
    countryTag:
      kind === "cup"
        ? cupCountryTag(name, row.country.name)
        : countryTag(row.country.name),
    kind,
  };
}

/** Resolve explicit league IDs for retry imports (includes discovered leagues). */
export async function resolveOutrightLeaguesByIds(
  leagueIds: number[],
  season: number,
): Promise<TopLeague[]> {
  const resolved = new Map<number, TopLeague>();
  const missing: number[] = [];

  for (const id of leagueIds) {
    const known = TOP_LEAGUES.find((league) => league.id === id);

    if (known) {
      resolved.set(id, known);
      continue;
    }

    missing.push(id);
  }

  for (const id of missing) {
    const payload = await apiFootballGet<ApiLeaguesResponse>("/leagues", {
      id,
      season,
    });
    const errorMessage = extractApiFootballErrorMessage(payload.errors);

    if (errorMessage) {
      throw new Error(`League lookup failed for id=${id}: ${errorMessage}`);
    }

    const row = payload.response?.[0];

    if (!row) continue;

    resolved.set(id, mapApiLeagueRow(row));
  }

  return leagueIds
    .map((id) => resolved.get(id))
    .filter((league): league is TopLeague => league != null);
}
