import type { UnifiedFeedItem } from "../types";

import {
  FIXTURE_TAG_PREFIX,
  KICKOFF_TAG_PREFIX,
  OUTRIGHT_TAG_PREFIX,
} from "@/lib/football/constants";
import { isKickoffOnOrAfterMinDate } from "@/lib/football/fixture-window";

const MATCH_RESULT_DATE = /Match Result \((.+)\)\s*$/;

function parseKickoffFromTags(tags?: string[]): number | null {
  if (!tags?.length) return null;

  for (const tag of tags) {
    if (tag.startsWith(KICKOFF_TAG_PREFIX)) {
      const unix = Number(tag.slice(KICKOFF_TAG_PREFIX.length));

      if (Number.isFinite(unix) && unix > 0) return unix;
    }
  }

  return null;
}

function parseKickoffFromTitle(title?: string): number | null {
  if (!title) return null;

  const match = title.match(MATCH_RESULT_DATE);

  if (!match?.[1]) return null;

  const ms = Date.parse(match[1].trim());

  return Number.isFinite(ms) ? Math.floor(ms / 1000) : null;
}

function isFixtureMarket(tags?: string[]): boolean {
  return tags?.some((tag) => tag.startsWith(FIXTURE_TAG_PREFIX)) ?? false;
}

/** Extract kickoff unix timestamp from a feed item, if available. */
export function getKickoffTimestamp(item: UnifiedFeedItem): number | null {
  if (item.type !== "group") return null;

  const { tags, marketQuestion } = item.data;

  return (
    parseKickoffFromTags(tags) ??
    parseKickoffFromTitle(marketQuestion) ??
    null
  );
}

function getVolume(item: UnifiedFeedItem): number {
  if (item.type === "series") return 0;

  return parseFloat(item.data.totalVolume ?? "0");
}

function getCreatedAt(item: UnifiedFeedItem): number {
  if (item.type === "standalone") return 0;

  return Number(item.data.createdAt || 0);
}

/**
 * Sort homepage feed: nearest kickoff first for fixture markets,
 * then remaining items by volume or createdAt.
 */
export function sortUnifiedFeedItems(
  items: UnifiedFeedItem[],
  sortBy: "created" | "volume" = "volume",
): UnifiedFeedItem[] {
  return [...items].sort((a, b) => {
    const kickoffA = getKickoffTimestamp(a);
    const kickoffB = getKickoffTimestamp(b);

    if (kickoffA != null && kickoffB != null) {
      return kickoffA - kickoffB;
    }

    if (kickoffA != null) return -1;
    if (kickoffB != null) return 1;

    if (sortBy === "volume") {
      return getVolume(b) - getVolume(a);
    }

    return getCreatedAt(b) - getCreatedAt(a);
  });
}

export function isFixtureFeedItem(item: UnifiedFeedItem): boolean {
  if (item.type !== "group") return false;

  return isFixtureMarket(item.data.tags);
}

/** First-generation outright tags (no revision suffix) from the bad import run. */
const LEGACY_OUTRIGHT_TAG = new RegExp(
  `^${OUTRIGHT_TAG_PREFIX}\\d+-\\d+$`,
);

function hasLegacyOutrightTag(tags?: string[]): boolean {
  return tags?.some((tag) => LEGACY_OUTRIGHT_TAG.test(tag)) ?? false;
}

/** Hide fixture match markets before the launch window (mid-August). */
export function filterFeedByMinKickoff(
  items: UnifiedFeedItem[],
): UnifiedFeedItem[] {
  return items.filter((item) => {
    if (!isFixtureFeedItem(item)) return true;

    const kickoff = getKickoffTimestamp(item);

    return kickoff == null || isKickoffOnOrAfterMinDate(kickoff);
  });
}

/** Hide superseded outright groups (tag like outright-39-2026 without -v2). */
export function filterFeedHideLegacyOutrights(
  items: UnifiedFeedItem[],
): UnifiedFeedItem[] {
  return items.filter((item) => {
    if (item.type !== "group") return true;

    return !hasLegacyOutrightTag(item.data.tags);
  });
}
