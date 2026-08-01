import type { MarketTypeId } from "./marketTypes";

/**
 * Match sub-markets created by the football bot (Double Chance excluded — not valid
 * for binary prediction outcomes on this platform).
 */
export const MATCH_IMPORT_MARKET_TYPES: MarketTypeId[] = [
  "1x2",
  "btts",
  "ou15",
  "ou25",
  "ou35",
  "dnb",
];

/** Revision suffix for new fixture groups, e.g. `match-markets-v2`. */
export function getMatchMarketsTag(): string {
  const revision = process.env.MATCH_TAG_REVISION?.trim();

  return revision ? `match-markets-${revision}` : "match-markets";
}

/** Client-side revision — only groups with this tag are shown in public feeds. */
export function getPublicMatchMarketsTag(): string | null {
  const revision = process.env.NEXT_PUBLIC_MATCH_TAG_REVISION?.trim();

  if (!revision) return null;

  return `match-markets-${revision}`;
}

/** Whether a fixture group should appear in homepage / category feeds. */
export function isPublicMatchGroup(tags: string[] | undefined): boolean {
  if (!tags?.length) return false;

  const requiredTag = getPublicMatchMarketsTag();

  if (!requiredTag) {
    return false;
  }

  return tags.includes(requiredTag);
}
