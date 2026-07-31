import type { Locale } from "@/config/locales";
import {
  LEAGUE_BY_SLUG,
  LEAGUES,
  parseLeagueSlugFromTags,
} from "@/config/leagues";

/** Locale-specific separator between home and away in match URLs. */
const MATCH_SEPARATORS: Partial<Record<Locale, string>> = {
  en: "vs",
  nl: "tegen",
};

const DEFAULT_MATCH_SEPARATOR = "vs";

/** Strip accents and punctuation for URL-safe slugs. */
export function slugifySegment(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

function matchSeparator(locale: Locale): string {
  return MATCH_SEPARATORS[locale] ?? DEFAULT_MATCH_SEPARATOR;
}

/** Build a match slug from team names, e.g. `arsenal-vs-coventry`. */
export function getMatchSlug(
  home: string,
  away: string,
  locale: Locale = "en",
): string {
  const sep = matchSeparator(locale);

  return `${slugifySegment(home)}-${sep}-${slugifySegment(away)}`;
}

/** Resolve a league display name or on-chain tag to a canonical league slug. */
export function getLeagueSlug(
  leagueName: string,
  _locale: Locale = "en",
): string | null {
  const trimmed = leagueName.trim();

  for (const league of Object.values(LEAGUES)) {
    if (
      league.tag === trimmed ||
      league.nameEn === trimmed ||
      league.nameNl === trimmed
    ) {
      return league.slug;
    }
  }

  const slug = slugifySegment(trimmed);

  return slug.length > 0 ? slug : null;
}

/** Prefer `league-*` tag; fall back to human league tags on the group. */
export function getLeagueSlugFromGroupTags(
  tags: string[],
  locale: Locale = "en",
): string | null {
  const fromMachineTag = parseLeagueSlugFromTags(tags);

  if (fromMachineTag && LEAGUE_BY_SLUG[fromMachineTag]) {
    return fromMachineTag;
  }

  for (const tag of tags) {
    const slug = getLeagueSlug(tag, locale);

    if (slug && LEAGUE_BY_SLUG[slug]) return slug;
  }

  return null;
}

/** All acceptable slugs for a fixture (locale variant + canonical EN). */
export function getMatchSlugVariants(
  home: string,
  away: string,
  locale: Locale,
): string[] {
  const variants = new Set<string>([
    getMatchSlug(home, away, locale),
    getMatchSlug(home, away, "en"),
  ]);

  if (locale !== "nl") {
    variants.add(getMatchSlug(home, away, "nl"));
  }

  return Array.from(variants);
}

export function matchSlugMatchesTeams(
  matchSlug: string,
  home: string,
  away: string,
  locale: Locale,
): boolean {
  return getMatchSlugVariants(home, away, locale).includes(matchSlug);
}

/** Decode a match slug into rough team name hints for metadata fallbacks. */
export function parseMatchSlugToTeams(matchSlug: string): {
  homeHint: string;
  awayHint: string;
} | null {
  const match = matchSlug.match(/^(.+?)-(?:vs|tegen)-(.+)$/i);

  if (!match) return null;

  const toTitle = (part: string) =>
    part
      .split("-")
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  return {
    homeHint: toTitle(match[1]),
    awayHint: toTitle(match[2]),
  };
}
