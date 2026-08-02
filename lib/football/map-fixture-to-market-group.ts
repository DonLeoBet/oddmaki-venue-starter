import type { ApiFootballFixtureRow, PreparedMatchMarketGroup, MatchMarketCategory } from "./types";

import { MATCH_MARKET_LIVENESS_SECONDS } from "@/config/resolution.config";
import { MAX_TAGS } from "@/config/tags.config";
import {
  getMatchImportMarketTypes,
  getMatchMarketsTag,
} from "@/config/matchMarkets.config";
import { LEAGUE_BY_ID, leagueSlugTag } from "@/config/leagues";
import { canonicalSubMarketName } from "@/config/marketTypes";

import { FIXTURE_TAG_PREFIX, fixtureTag, kickoffTag } from "./constants";
import { encodeFixtureMeta } from "./fixture-metadata";

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

function seasonYearFromIso(iso: string): number {
  return new Date(iso).getUTCFullYear();
}

interface OutcomeSpec {
  /** Language-agnostic canonical key, e.g. `btts:yes`. */
  name: string;
  category: MatchMarketCategory;
  outcomeKey: string;
  question: string;
  description: string;
}

function buildOutcomesForType(
  category: MatchMarketCategory,
  home: string,
  away: string,
  sharedContext: string,
  ref: string,
): OutcomeSpec[] {
  const addBinary = (
    outcomeKey: string,
    question: string,
    description: string,
  ): OutcomeSpec => ({
    name: canonicalSubMarketName(category, outcomeKey),
    category,
    outcomeKey,
    question,
    description,
  });

  switch (category) {
    case "beat":
      return [
        addBinary(
          "yes",
          `Will ${home} beat ${away}?`,
          `Official full-time result (90 minutes + stoppage time). Resolves YES if ${home} wins. Resolves NO on a draw or ${away} win. ${sharedContext} Ref: ${ref}-BEAT-Y.`,
        ),
        addBinary(
          "no",
          `Will ${home} fail to beat ${away}?`,
          `Official full-time result (90 minutes + stoppage time). Resolves YES on a draw or ${away} win. ${sharedContext} Ref: ${ref}-BEAT-N.`,
        ),
      ];
    case "1x2":
      return [
        addBinary(
          "home",
          `Will ${home} beat ${away}?`,
          `Official full-time result (90 minutes + stoppage time). Resolves YES if ${home} wins. ${sharedContext} Ref: ${ref}-1X2-H.`,
        ),
        addBinary(
          "draw",
          `Will ${home} vs ${away} be a draw?`,
          `Official full-time result (90 minutes + stoppage time). Resolves YES on a draw. ${sharedContext} Ref: ${ref}-1X2-D.`,
        ),
        addBinary(
          "away",
          `Will ${away} beat ${home}?`,
          `Official full-time result (90 minutes + stoppage time). Resolves YES if ${away} wins. ${sharedContext} Ref: ${ref}-1X2-A.`,
        ),
      ];
    case "btts":
      return [
        addBinary(
          "yes",
          `Will both teams score in ${home} vs ${away}?`,
          `Both teams score at least one goal in official play. ${sharedContext} Ref: ${ref}-BTTS-Y.`,
        ),
        addBinary(
          "no",
          `Will at least one team fail to score in ${home} vs ${away}?`,
          `At least one team fails to score in official play. ${sharedContext} Ref: ${ref}-BTTS-N.`,
        ),
      ];
    case "ou15":
    case "ou25":
    case "ou35": {
      const line = category === "ou15" ? "1.5" : category === "ou25" ? "2.5" : "3.5";
      const overGoals = category === "ou15" ? 2 : category === "ou25" ? 3 : 4;
      const underGoals = category === "ou35" ? 3 : 2;

      return [
        addBinary(
          "over",
          `Will ${home} vs ${away} have over ${line} goals?`,
          `Total goals exceed ${line} in official play (resolves YES on ${overGoals}+ goals). ${sharedContext} Ref: ${ref}-OU${line.replace(".", "")}-O.`,
        ),
        addBinary(
          "under",
          `Will ${home} vs ${away} have under ${line} goals?`,
          `Total goals under ${line} in official play (resolves YES on ${underGoals} or fewer). ${sharedContext} Ref: ${ref}-OU${line.replace(".", "")}-U.`,
        ),
      ];
    }
    default:
      return [];
  }
}

function buildOutcomes(
  home: string,
  away: string,
  sharedContext: string,
  ref: string,
): OutcomeSpec[] {
  return getMatchImportMarketTypes().flatMap((category) =>
    buildOutcomesForType(category as MatchMarketCategory, home, away, sharedContext, ref),
  );
}

function importMarketTypeSummary(): string {
  return "Home to win (beat)";
}

/**
 * Map a football fixture into a multi-market OddMaki group with full standard lines.
 * Sub-market names are language-agnostic canonical keys (marketType:outcomeKey).
 */
export function mapFixtureToMarketGroup(
  row: ApiFootballFixtureRow,
): PreparedMatchMarketGroup {
  const { fixture, league, teams } = row;
  const home = teams.home.name.trim();
  const away = teams.away.name.trim();
  const kickoffLabel = formatMatchDate(fixture.date);
  const leagueDef = LEAGUE_BY_ID[league.id];
  const leagueSlug = leagueDef?.slug ?? `league-${league.id}`;
  const leagueTag = leagueDef?.tag ?? league.name;
  const ref = `F-${fixture.id}`;
  const seasonYear = seasonYearFromIso(fixture.date);

  const title = `${home} vs ${away} — Match Markets (${kickoffLabel})`;
  const sharedContext =
    `${home} vs ${away}. Kickoff: ${kickoffLabel}. League: ${league.name}. ` +
    `Official match time includes 90 minutes plus stoppage time.`;

  const metaBlock = encodeFixtureMeta({
    leagueId: league.id,
    leagueSlug,
    leagueName: league.name,
    seasonYear,
    fixtureId: fixture.id,
    kickoffUnix: fixture.timestamp,
    home,
    away,
  });

  const description =
    `Official match markets for ${home} vs ${away}. Kickoff: ${kickoffLabel}. ` +
    `League: ${league.name}. Standard lines: ${importMarketTypeSummary()}. ` +
    `Market resolves based on official tournament statistics. Ref: ${ref}.${metaBlock}`;

  const tags = [
    fixtureTag(fixture.id),
    kickoffTag(fixture.timestamp),
    leagueSlugTag(leagueSlug),
    "sports",
    getMatchMarketsTag(),
  ].slice(0, MAX_TAGS);

  const outcomes = buildOutcomes(home, away, sharedContext, ref);

  return {
    fixtureId: fixture.id,
    leagueId: league.id,
    leagueSlug,
    leagueName: league.name,
    seasonYear,
    kickoffIso: fixture.date,
    kickoffUnix: fixture.timestamp,
    title,
    description,
    tags,
    outcomes,
    tickSize: "0.01",
    additionalReward: 0,
    liveness: MATCH_MARKET_LIVENESS_SECONDS,
    activateImmediately: true,
    leagueTag,
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
