/**
 * League slug registry — maps API-Football league IDs to URL-safe slugs.
 * Shared by bot tags, category pages, and brand routing.
 */

export interface LeagueDef {
  id: number;
  slug: string;
  /** Human tag on-chain (matches tags.config CATEGORIES). */
  tag: string;
  countryTag: string;
  nameEn: string;
  nameNl: string;
}

export const LEAGUES: Record<string, LeagueDef> = {
  eredivisie: {
    id: 88,
    slug: "eredivisie",
    tag: "Eredivisie",
    countryTag: "Dutch Football",
    nameEn: "Eredivisie",
    nameNl: "Eredivisie",
  },
  keukenKampioen: {
    id: 89,
    slug: "keuken-kampioen",
    tag: "Keuken Kampioen Divisie",
    countryTag: "Dutch Football",
    nameEn: "Keuken Kampioen Divisie",
    nameNl: "Keuken Kampioen Divisie",
  },
  premierLeague: {
    id: 39,
    slug: "premier-league",
    tag: "Premier League",
    countryTag: "English Football",
    nameEn: "Premier League",
    nameNl: "Premier League",
  },
  championship: {
    id: 40,
    slug: "championship",
    tag: "Championship",
    countryTag: "English Football",
    nameEn: "Championship",
    nameNl: "Championship",
  },
  championsLeague: {
    id: 2,
    slug: "champions-league",
    tag: "Champions League",
    countryTag: "European Football",
    nameEn: "Champions League",
    nameNl: "Champions League",
  },
  europaLeague: {
    id: 3,
    slug: "europa-league",
    tag: "Europa League",
    countryTag: "European Football",
    nameEn: "Europa League",
    nameNl: "Europa League",
  },
  laLiga: {
    id: 140,
    slug: "la-liga",
    tag: "La Liga",
    countryTag: "Spanish Football",
    nameEn: "La Liga",
    nameNl: "La Liga",
  },
  serieA: {
    id: 135,
    slug: "serie-a",
    tag: "Serie A",
    countryTag: "Italian Football",
    nameEn: "Serie A",
    nameNl: "Serie A",
  },
  bundesliga: {
    id: 78,
    slug: "bundesliga",
    tag: "Bundesliga",
    countryTag: "German Football",
    nameEn: "Bundesliga",
    nameNl: "Bundesliga",
  },
  ligue1: {
    id: 61,
    slug: "ligue-1",
    tag: "Ligue 1",
    countryTag: "French Football",
    nameEn: "Ligue 1",
    nameNl: "Ligue 1",
  },
  superLig: {
    id: 203,
    slug: "super-lig",
    tag: "Süper Lig",
    countryTag: "Turkish Football",
    nameEn: "Süper Lig",
    nameNl: "Süper Lig",
  },
  primeiraLiga: {
    id: 94,
    slug: "primeira-liga",
    tag: "Primeira Liga",
    countryTag: "Portuguese Football",
    nameEn: "Primeira Liga",
    nameNl: "Primeira Liga",
  },
  ligaProfesional: {
    id: 128,
    slug: "liga-profesional",
    tag: "Liga Profesional",
    countryTag: "Argentine Football",
    nameEn: "Liga Profesional",
    nameNl: "Liga Profesional",
  },
  brasileirao: {
    id: 71,
    slug: "brasileirao",
    tag: "Brasileirão",
    countryTag: "Brazilian Football",
    nameEn: "Brasileirão",
    nameNl: "Brasileirão",
  },
  primeraA: {
    id: 239,
    slug: "primera-a",
    tag: "Primera A",
    countryTag: "Colombian Football",
    nameEn: "Primera A",
    nameNl: "Primera A",
  },
  primeraDivisionBo: {
    id: 344,
    slug: "primera-division-bo",
    tag: "Primera División BO",
    countryTag: "Bolivian Football",
    nameEn: "Primera División",
    nameNl: "Primera División",
  },
  chineseSuperLeague: {
    id: 169,
    slug: "chinese-super-league",
    tag: "Chinese Super League",
    countryTag: "Chinese Football",
    nameEn: "Chinese Super League",
    nameNl: "Chinese Super League",
  },
  scottishPremiership: {
    id: 179,
    slug: "scottish-premiership",
    tag: "Scottish Premiership",
    countryTag: "Scottish Football",
    nameEn: "Scottish Premiership",
    nameNl: "Scottish Premiership",
  },
  belgianProLeague: {
    id: 144,
    slug: "belgian-pro-league",
    tag: "Pro League",
    countryTag: "Belgian Football",
    nameEn: "Belgian Pro League",
    nameNl: "Belgian Pro League",
  },
  bundesligaAt: {
    id: 218,
    slug: "bundesliga-at",
    tag: "Bundesliga AT",
    countryTag: "Austrian Football",
    nameEn: "Austrian Bundesliga",
    nameNl: "Oostenrijkse Bundesliga",
  },
  superLeagueCh: {
    id: 207,
    slug: "super-league-ch",
    tag: "Super League CH",
    countryTag: "Swiss Football",
    nameEn: "Swiss Super League",
    nameNl: "Zwitsers Super League",
  },
  superligaDk: {
    id: 119,
    slug: "superliga",
    tag: "Superliga",
    countryTag: "Danish Football",
    nameEn: "Danish Superliga",
    nameNl: "Deense Superliga",
  },
  superLeagueGr: {
    id: 197,
    slug: "super-league-gr",
    tag: "Super League GR",
    countryTag: "Greek Football",
    nameEn: "Greek Super League",
    nameNl: "Greek Super League",
  },
  proLeagueSa: {
    id: 307,
    slug: "pro-league-sa",
    tag: "Pro League SA",
    countryTag: "Saudi Football",
    nameEn: "Saudi Pro League",
    nameNl: "Saoedi Pro League",
  },
};

export const LEAGUE_BY_ID: Record<number, LeagueDef> = Object.fromEntries(
  Object.values(LEAGUES).map((l) => [l.id, l]),
) as Record<number, LeagueDef>;

export const LEAGUE_BY_SLUG: Record<string, LeagueDef> = Object.fromEntries(
  Object.values(LEAGUES).map((l) => [l.slug, l]),
) as Record<string, LeagueDef>;

export const ALL_LEAGUE_SLUGS = Object.values(LEAGUES).map((l) => l.slug);

export function leagueSlugTag(slug: string): string {
  return `league-${slug}`;
}

export function parseLeagueSlugFromTags(tags: string[]): string | null {
  const tag = tags.find((t) => t.startsWith("league-"));
  return tag ? tag.slice("league-".length) : null;
}

import type { Locale } from "./locales";

export function getLeagueName(slug: string, lang: Locale = "en"): string {
  const league = LEAGUE_BY_SLUG[slug];
  if (!league) return slug;
  return lang === "nl" ? league.nameNl : league.nameEn;
}
