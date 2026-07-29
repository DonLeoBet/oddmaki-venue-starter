import type { ApiFootballFixtureRow, PreparedMatchMarketGroup } from "./types";
import {
  FIXTURE_TAG_PREFIX,
  FOOTBALL_LEAGUES,
  fixtureTag,
} from "./constants";
import { MAX_TAGS } from "@/config/tags.config";

function formatMatchDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  });
}

function leagueMeta(leagueId: number): {
  leagueTag: string;
  countryTag: string;
} {
  const entry = Object.values(FOOTBALL_LEAGUES).find((l) => l.id === leagueId);

  if (!entry) {
    return { leagueTag: "Football", countryTag: "sports" };
  }

  return { leagueTag: entry.tag, countryTag: entry.countryTag };
}

/**
 * Map an API-Football fixture row into OddMaki group-market form data.
 * Each match becomes a 3-outcome NegRisk group: Home Win / Draw / Away Win.
 */
export function mapFixtureToMarketGroup(
  row: ApiFootballFixtureRow,
): PreparedMatchMarketGroup {
  const { fixture, league, teams } = row;
  const home = teams.home.name.trim();
  const away = teams.away.name.trim();
  const kickoffLabel = formatMatchDate(fixture.date);
  const { leagueTag, countryTag } = leagueMeta(league.id);

  const title = `${home} vs ${away} — Match Result (${kickoffLabel})`;
  const description = [
    `Official full-time result (90 minutes + stoppage time) for ${home} vs ${away}.`,
    `Kickoff: ${kickoffLabel}.`,
    `League: ${league.name} (${league.country}), ${league.round ?? "Regular Season"}.`,
    `Exactly one outcome resolves YES. Source: official league / FIFA match data.`,
    `Fixture ID: ${fixture.id}. API-Football fixture ${fixture.id}.`,
  ].join(" ");

  const tags = [
    fixtureTag(fixture.id),
    "sports",
    leagueTag,
    countryTag,
  ].slice(0, MAX_TAGS);

  const outcomes = [
    {
      name: home,
      question: `Will ${home} beat ${away} on ${kickoffLabel}?`,
    },
    {
      name: "Draw",
      question: `Will ${home} vs ${away} end in a draw on ${kickoffLabel}?`,
    },
    {
      name: away,
      question: `Will ${away} beat ${home} on ${kickoffLabel}?`,
    },
  ];

  return {
    fixtureId: fixture.id,
    leagueId: league.id,
    leagueName: league.name,
    kickoffIso: fixture.date,
    kickoffUnix: fixture.timestamp,
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

export function isFixtureTag(tag: string): boolean {
  return tag.startsWith(FIXTURE_TAG_PREFIX);
}

export function fixtureIdFromTag(tag: string): number | null {
  if (!isFixtureTag(tag)) return null;
  const id = Number(tag.slice(FIXTURE_TAG_PREFIX.length));

  return Number.isFinite(id) ? id : null;
}
