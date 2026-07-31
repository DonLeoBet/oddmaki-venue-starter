import type { ApiFootballFixtureRow, PreparedMatchMarketGroup } from "./types";

import { MAX_TAGS } from "@/config/tags.config";
import { LEAGUE_BY_ID, leagueSlugTag } from "@/config/leagues";
import type { MarketTypeId } from "@/config/marketTypes";
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
  category: MarketTypeId;
  outcomeKey: string;
  question: string;
  description: string;
}

function buildOutcomes(
  home: string,
  away: string,
  sharedContext: string,
  ref: string,
): OutcomeSpec[] {
  const specs: OutcomeSpec[] = [];

  const addBinary = (
    category: MarketTypeId,
    outcomeKey: string,
    question: string,
    description: string,
  ) => {
    specs.push({
      name: canonicalSubMarketName(category, outcomeKey),
      category,
      outcomeKey,
      question,
      description,
    });
  };

  addBinary(
    "1x2",
    "home",
    `Will ${home} win ${home} vs ${away}?`,
    `Official full-time result (90 minutes + stoppage time). Resolves YES if ${home} wins. ${sharedContext} Ref: ${ref}-1X2-H.`,
  );
  addBinary(
    "1x2",
    "draw",
    `Will ${home} vs ${away} end in a draw?`,
    `Official full-time result (90 minutes + stoppage time). Resolves YES on a draw. ${sharedContext} Ref: ${ref}-1X2-D.`,
  );
  addBinary(
    "1x2",
    "away",
    `Will ${away} win ${home} vs ${away}?`,
    `Official full-time result (90 minutes + stoppage time). Resolves YES if ${away} wins. ${sharedContext} Ref: ${ref}-1X2-A.`,
  );

  addBinary(
    "btts",
    "yes",
    `Will both teams score in ${home} vs ${away}?`,
    `Both teams score at least one goal in official play. ${sharedContext} Ref: ${ref}-BTTS-Y.`,
  );
  addBinary(
    "btts",
    "no",
    `Will at least one team fail to score in ${home} vs ${away}?`,
    `At least one team fails to score in official play. ${sharedContext} Ref: ${ref}-BTTS-N.`,
  );

  for (const line of [
    { cat: "ou15" as const, line: "1.5", over: 2, under: 2 },
    { cat: "ou25" as const, line: "2.5", over: 3, under: 2 },
    { cat: "ou35" as const, line: "3.5", over: 4, under: 3 },
  ]) {
    addBinary(
      line.cat,
      "over",
      `Will ${home} vs ${away} have over ${line.line} goals?`,
      `Total goals exceed ${line.line} in official play (resolves YES on ${line.over}+ goals). ${sharedContext} Ref: ${ref}-OU${line.line.replace(".", "")}-O.`,
    );
    addBinary(
      line.cat,
      "under",
      `Will ${home} vs ${away} have under ${line.line} goals?`,
      `Total goals under ${line.line} in official play (resolves YES on ${line.under} or fewer). ${sharedContext} Ref: ${ref}-OU${line.line.replace(".", "")}-U.`,
    );
  }

  addBinary(
    "double_chance",
    "1x",
    `Will ${home} win or draw in ${home} vs ${away}?`,
    `Double chance 1X — home win or draw. ${sharedContext} Ref: ${ref}-DC-1X.`,
  );
  addBinary(
    "double_chance",
    "12",
    `Will ${home} vs ${away} avoid a draw?`,
    `Double chance 12 — home or away win. ${sharedContext} Ref: ${ref}-DC-12.`,
  );
  addBinary(
    "double_chance",
    "x2",
    `Will ${away} win or draw in ${home} vs ${away}?`,
    `Double chance X2 — draw or away win. ${sharedContext} Ref: ${ref}-DC-X2.`,
  );

  addBinary(
    "dnb",
    "home",
    `Draw No Bet: will ${home} win ${home} vs ${away}?`,
    `DNB home — YES if ${home} wins; push/refund logic per market rules on draw. ${sharedContext} Ref: ${ref}-DNB-H.`,
  );
  addBinary(
    "dnb",
    "away",
    `Draw No Bet: will ${away} win ${home} vs ${away}?`,
    `DNB away — YES if ${away} wins; push/refund logic per market rules on draw. ${sharedContext} Ref: ${ref}-DNB-A.`,
  );

  return specs;
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
    `League: ${league.name}. Standard lines: 1X2, BTTS, O/U 1.5/2.5/3.5, Double Chance, DNB. ` +
    `Market resolves based on official tournament statistics. Ref: ${ref}.${metaBlock}`;

  const tags = [
    fixtureTag(fixture.id),
    kickoffTag(fixture.timestamp),
    leagueSlugTag(leagueSlug),
    "sports",
    "match-markets",
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
    liveness: 0,
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
