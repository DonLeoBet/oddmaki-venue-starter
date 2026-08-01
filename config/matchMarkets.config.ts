import type { MarketTypeId } from "./marketTypes";
import { MARKET_TYPES } from "./marketTypes";

/** Default bot import — full 1X2 line per fixture. */
export const DEFAULT_MATCH_IMPORT_MARKET_TYPES: MarketTypeId[] = ["1x2"];

/** @deprecated Use `getMatchImportMarketTypes()` — kept for static analysis. */
export const MATCH_IMPORT_MARKET_TYPES = DEFAULT_MATCH_IMPORT_MARKET_TYPES;

const VALID_IMPORT_TYPES = new Set<MarketTypeId>(
  Object.keys(MARKET_TYPES) as MarketTypeId[],
);

/**
 * Sub-markets the football bot creates per fixture.
 * Override at import time, e.g. `MATCH_IMPORT_MARKET_TYPES=1x2` for budget runs.
 */
export function getMatchImportMarketTypes(): MarketTypeId[] {
  const raw = process.env.MATCH_IMPORT_MARKET_TYPES?.trim();

  if (!raw) return DEFAULT_MATCH_IMPORT_MARKET_TYPES;

  const parsed = raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .filter((entry): entry is MarketTypeId =>
      VALID_IMPORT_TYPES.has(entry as MarketTypeId),
    );

  return parsed.length > 0 ? parsed : DEFAULT_MATCH_IMPORT_MARKET_TYPES;
}

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
