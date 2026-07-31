import type { BrandId } from "@/config/brandRouting";
import {
  buildLegacyMatchGroupPath,
  buildMatchGroupPath,
} from "@/config/brandRouting";
import type { Locale } from "@/config/locales";
import { parseFixtureTitle } from "@/lib/football/fixture-metadata";
import {
  getLeagueSlugFromGroupTags,
  getMatchSlug,
} from "@/lib/markets/matchSlugs";
import { isOutrightGroup } from "@/lib/markets/marketFilters";

export interface MatchGroupLinkInput {
  groupId: string;
  marketQuestion: string;
  tags?: string[];
  /** When known (e.g. category rows), skip tag parsing for league. */
  leagueSlug?: string | null;
}

/** Build the preferred public URL for a match fixture group. */
export function getMatchGroupSeoPath(
  brandId: BrandId,
  input: MatchGroupLinkInput,
  locale: Locale,
): string | null {
  if (isOutrightGroup(input.tags)) return null;

  const parsed = parseFixtureTitle(input.marketQuestion);

  if (!parsed) return null;

  const leagueSlug =
    input.leagueSlug ??
    getLeagueSlugFromGroupTags(input.tags ?? [], locale);

  if (!leagueSlug) return null;

  const matchSlug = getMatchSlug(parsed.home, parsed.away, locale);

  return buildMatchGroupPath(brandId, leagueSlug, matchSlug);
}

/** Prefer SEO path; fall back to legacy /market/multi/[id]. */
export function getMatchGroupHref(
  brandId: BrandId,
  input: MatchGroupLinkInput,
  locale: Locale,
): string {
  return (
    getMatchGroupSeoPath(brandId, input, locale) ??
    buildLegacyMatchGroupPath(input.groupId)
  );
}
