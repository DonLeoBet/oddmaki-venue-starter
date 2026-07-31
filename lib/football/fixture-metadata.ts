/**
 * Structured metadata embedded in match group descriptions (parseable by frontend).
 */
export interface FixtureGroupMeta {
  leagueId: number;
  leagueSlug: string;
  leagueName: string;
  seasonYear: number;
  fixtureId: number;
  kickoffUnix: number;
  home: string;
  away: string;
  /** Optional test-batch identifier (e.g. test_10d_1). */
  batch?: string;
}

const META_PREFIX = "\n<!--fixture-meta:";

export function encodeFixtureMeta(meta: FixtureGroupMeta): string {
  return `${META_PREFIX}${JSON.stringify(meta)}-->`;
}

export function decodeFixtureMeta(text: string): FixtureGroupMeta | null {
  const start = text.indexOf(META_PREFIX);
  if (start === -1) return null;
  const end = text.indexOf("-->", start);
  if (end === -1) return null;
  try {
    return JSON.parse(
      text.slice(start + META_PREFIX.length, end),
    ) as FixtureGroupMeta;
  } catch {
    return null;
  }
}

export function parseFixtureTitle(title: string): {
  home: string;
  away: string;
} | null {
  const match = title.match(/^(.+?)\s+vs\s+(.+?)\s+—/i);
  if (!match) return null;
  return { home: match[1].trim(), away: match[2].trim() };
}
