import {
  LEAGUE_BY_SLUG,
  leagueSlugTag,
  parseLeagueSlugFromTags,
} from "@/config/leagues";
import { isPublicMatchGroup } from "@/config/matchMarkets.config";
import { isPublicOutrightGroup } from "@/config/outrights.config";
import {
  FIXTURE_TAG_PREFIX,
  OUTRIGHT_TAG_PREFIX,
} from "@/lib/football/constants";

const CANONICAL_SUB_MARKET_NAME = /^[a-z0-9_]+:[a-z0-9]+$/i;

/** First-generation outright tags (no revision suffix) from the bad import run. */
const LEGACY_OUTRIGHT_TAG = new RegExp(
  `^${OUTRIGHT_TAG_PREFIX}\\d+-\\d+$`,
);

export interface ParsedOutrightTag {
  leagueId: number;
  season: number;
  /** 0 when tag has no `-vN` revision suffix. */
  revision: number;
  /** 1-based split index for large cups; 0 when not split. */
  part: number;
}

export function parseOutrightTag(tag: string): ParsedOutrightTag | null {
  const match = tag.match(/^outright-(\d+)-(\d+)(?:-v(\d+))?(?:-p(\d+))?$/i);

  if (!match) return null;

  return {
    leagueId: Number(match[1]),
    season: Number(match[2]),
    revision: match[3] ? Number(match[3]) : 0,
    part: match[4] ? Number(match[4]) : 0,
  };
}

export function outrightTagKey(parsed: ParsedOutrightTag): string {
  return `${parsed.leagueId}-${parsed.season}`;
}

/** Build max revision per league+season from a batch of groups. */
export function buildMaxOutrightRevisionMap(
  groups: Array<{ tags?: string[] }>,
): Map<string, number> {
  const maxRevision = new Map<string, number>();

  for (const group of groups) {
    for (const tag of group.tags ?? []) {
      if (!tag.startsWith(OUTRIGHT_TAG_PREFIX)) continue;

      const parsed = parseOutrightTag(tag);

      if (!parsed) continue;

      const key = outrightTagKey(parsed);

      maxRevision.set(
        key,
        Math.max(maxRevision.get(key) ?? 0, parsed.revision),
      );
    }
  }

  return maxRevision;
}

/** Hide older revision when a newer outright tag exists for the same league+season. */
export function isSupersededOutrightInBatch(
  tags: string[] | undefined,
  maxRevisionByKey: Map<string, number>,
): boolean {
  const tag = tags?.find((entry) => entry.startsWith(OUTRIGHT_TAG_PREFIX));

  if (!tag) return false;

  const parsed = parseOutrightTag(tag);

  if (!parsed) return false;

  const max = maxRevisionByKey.get(outrightTagKey(parsed));

  if (max == null) return false;

  return parsed.revision < max;
}

/** @deprecated Prefer isSupersededOutrightInBatch — kept for single-tag checks. */
export function isSupersededLegacyOutright(tags: string[] | undefined): boolean {
  return tags?.some((tag) => LEGACY_OUTRIGHT_TAG.test(tag)) ?? false;
}

export interface SubMarketLike {
  name: string;
  isPlaceholder?: boolean;
}

/** Sub-market uses the new canonical key format, e.g. `btts:yes`. */
export function isCanonicalSubMarketName(name: string): boolean {
  return CANONICAL_SUB_MARKET_NAME.test(name.trim());
}

export function isFixtureGroup(tags: string[] | undefined): boolean {
  return tags?.some((tag) => tag.startsWith(FIXTURE_TAG_PREFIX)) ?? false;
}

export function hasMatchMarketsTag(tags: string[] | undefined): boolean {
  return (
    tags?.some(
      (tag) => tag === "match-markets" || tag.startsWith("match-markets-"),
    ) ?? false
  );
}

export function isOutrightGroup(tags: string[] | undefined): boolean {
  if (!tags?.length) return false;

  return (
    tags.some((tag) => tag.startsWith(OUTRIGHT_TAG_PREFIX)) ||
    tags.includes("outrights")
  );
}

/** Outright group eligible for public feeds (current season + import revision). */
export function isNewTaxonomyOutrightGroup(tags: string[] | undefined): boolean {
  if (!isOutrightGroup(tags)) return false;

  return isPublicOutrightGroup(tags);
}

export function getOutrightTag(tags: string[] | undefined): string | null {
  return tags?.find((tag) => tag.startsWith(OUTRIGHT_TAG_PREFIX)) ?? null;
}

export function groupHasCanonicalMarkets(
  outcomes: SubMarketLike[],
): boolean {
  return outcomes.some(
    (outcome) =>
      !outcome.isPlaceholder && isCanonicalSubMarketName(outcome.name),
  );
}

/** Beat-only v2 groups from the mistaken Aug 2026 multi-league import — hide + pause. */
export function isBeatOnlyMatchGroup(outcomes: SubMarketLike[]): boolean {
  const canonical = outcomes.filter(
    (outcome) =>
      !outcome.isPlaceholder && isCanonicalSubMarketName(outcome.name),
  );

  if (canonical.length === 0) return false;

  return canonical.every((outcome) =>
    outcome.name.trim().toLowerCase().startsWith("beat:"),
  );
}

export function isRetiredBeatOnlyMatchGroup(
  tags: string[] | undefined,
  outcomes: SubMarketLike[],
): boolean {
  if (!tags?.includes("match-markets-v2")) return false;

  return isBeatOnlyMatchGroup(outcomes);
}

/** Match fixture group eligible for public feeds (current import revision). */
export function isNewTaxonomyMatchGroup(
  tags: string[] | undefined,
  outcomes: SubMarketLike[],
): boolean {
  if (isOutrightGroup(tags)) return false;
  if (!isPublicMatchGroup(tags)) return false;
  if (isRetiredBeatOnlyMatchGroup(tags, outcomes)) return false;

  return hasMatchMarketsTag(tags) || groupHasCanonicalMarkets(outcomes);
}

/** Pre-taxonomy fixture group — hide from match lists but keep on-chain. */
export function isLegacyMatchGroup(
  tags: string[] | undefined,
  outcomes: SubMarketLike[],
): boolean {
  if (isOutrightGroup(tags)) return false;
  if (isNewTaxonomyMatchGroup(tags, outcomes)) return false;
  if (!isFixtureGroup(tags) && !hasMatchMarketsTag(tags)) return false;

  return true;
}

export function groupMatchesLeagueSlug(
  tags: string[],
  leagueSlug: string,
): boolean {
  const parsed = parseLeagueSlugFromTags(tags);

  if (parsed === leagueSlug) return true;
  if (tags.includes(leagueSlugTag(leagueSlug))) return true;

  const league = LEAGUE_BY_SLUG[leagueSlug];

  if (!league) return false;

  if (tags.includes(league.tag)) return true;

  // Markets imported before a league was registered use league-{id} slugs.
  const legacySlug = `league-${league.id}`;

  return parsed === legacySlug || tags.includes(leagueSlugTag(legacySlug));
}

/** Keep only canonical sub-markets for UI lists. */
export function filterCanonicalSubMarkets<T extends SubMarketLike>(
  outcomes: T[],
): T[] {
  return outcomes.filter(
    (outcome) =>
      !outcome.isPlaceholder && isCanonicalSubMarketName(outcome.name),
  );
}
