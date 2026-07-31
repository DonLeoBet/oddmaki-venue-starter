import { getLeagueName, parseLeagueSlugFromTags } from "@/config/leagues";
import type { Locale } from "@/config/locales";
import { fixtureIdFromTag, isFixtureTag } from "@/lib/football/map-fixture-to-market-group";
import { parseFixtureTitle } from "@/lib/football/fixture-metadata";
import { KICKOFF_TAG_PREFIX } from "@/lib/football/constants";

export interface MarketSearchRecord {
  groupId: string;
  title: string;
  home: string;
  away: string;
  leagueSlug: string | null;
  leagueName: string;
  fixtureId: number | null;
  kickoffUnix: number;
  status: string;
  tags: string[];
  isFixture: boolean;
}

export interface MarketSearchHit extends MarketSearchRecord {
  score: number;
  href: string;
  subtitle: string;
}

function kickoffFromTags(tags: string[]): number {
  const tag = tags.find((t) => t.startsWith(KICKOFF_TAG_PREFIX));

  if (!tag) return 0;

  const unix = Number(tag.slice(KICKOFF_TAG_PREFIX.length));

  return Number.isFinite(unix) ? unix : 0;
}

function fixtureIdFromTags(tags: string[]): number | null {
  for (const tag of tags) {
    if (!isFixtureTag(tag)) continue;

    return fixtureIdFromTag(tag);
  }

  return null;
}

export function toMarketSearchRecord(
  groupId: string,
  marketQuestion: string,
  tags: string[],
  status: string,
  locale: Locale = "en",
): MarketSearchRecord {
  const parsed = parseFixtureTitle(marketQuestion);
  const leagueSlug = parseLeagueSlugFromTags(tags);
  const fixtureId = fixtureIdFromTags(tags);

  return {
    groupId,
    title: marketQuestion,
    home: parsed?.home ?? "",
    away: parsed?.away ?? "",
    leagueSlug,
    leagueName: leagueSlug ? getLeagueName(leagueSlug, locale) : "",
    fixtureId,
    kickoffUnix: kickoffFromTags(tags),
    status,
    tags,
    isFixture: fixtureId !== null,
  };
}

export function formatSearchKickoff(unix: number): string {
  if (!unix) return "";

  return new Date(unix * 1000).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function buildSearchSubtitle(record: MarketSearchRecord): string {
  const parts: string[] = [];

  if (record.leagueName) parts.push(record.leagueName);

  const kickoff = formatSearchKickoff(record.kickoffUnix);

  if (kickoff) parts.push(kickoff);

  if (record.fixtureId) parts.push(`#${record.fixtureId}`);

  parts.push(record.status);

  return parts.join(" · ");
}

export function scoreMarketSearch(
  query: string,
  record: MarketSearchRecord,
): number {
  const q = query.trim().toLowerCase();

  if (!q) return 0;

  if (/^\d+$/.test(q)) {
    const id = Number(q);

    if (record.fixtureId === id) return 1000;
    if (record.groupId === q) return 900;
  }

  if (record.fixtureId && `fixture-${record.fixtureId}`.includes(q)) {
    return 850;
  }

  const matchup = `${record.home} vs ${record.away}`.toLowerCase();

  if (matchup && matchup.includes(q)) return 200;

  if (record.home.toLowerCase().includes(q)) return 150;
  if (record.away.toLowerCase().includes(q)) return 150;

  if (record.title.toLowerCase().includes(q)) return 120;

  if (record.leagueName.toLowerCase().includes(q)) return 100;
  if (record.leagueSlug?.toLowerCase().includes(q)) return 90;

  if (record.groupId.toLowerCase() === q) return 80;

  if (record.tags.some((tag) => tag.toLowerCase().includes(q))) return 60;

  return 0;
}

export function filterMarketSearch(
  query: string,
  records: MarketSearchRecord[],
  limit = 12,
): MarketSearchHit[] {
  const q = query.trim();

  if (q.length < 2) return [];

  return records
    .map((record) => ({
      ...record,
      score: scoreMarketSearch(q, record),
      href: `/market/multi/${record.groupId}`,
      subtitle: buildSearchSubtitle(record),
    }))
    .filter((hit) => hit.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;

      return b.kickoffUnix - a.kickoffUnix;
    })
    .slice(0, limit);
}

/** Match unified feed group items against a search query. */
export function matchesFeedSearchQuery(
  query: string,
  group: {
    groupId: string;
    marketQuestion: string;
    tags?: string[];
    status: string;
  },
  locale: Locale = "en",
): boolean {
  const record = toMarketSearchRecord(
    group.groupId,
    group.marketQuestion,
    group.tags ?? [],
    group.status,
    locale,
  );

  return scoreMarketSearch(query, record) > 0;
}
