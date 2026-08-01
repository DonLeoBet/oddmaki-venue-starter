/**
 * Football competitions for outright (season winner) markets.
 * IDs from API-Football (api-sports.io).
 */
export type TopLeagueKind = "domestic" | "cup";

export interface TopLeague {
  id: number;
  tag: string;
  countryTag: string;
  /** Domestic leagues use standings; cups use main-stage fixtures (not all qualifiers). */
  kind: TopLeagueKind;
}

/** API-Football `season` param for 2026/2027 outright markets */
export const OUTRIGHT_SEASON_YEAR = Number(
  process.env.OUTRIGHT_SEASON_YEAR ?? 2026,
);

export const TOP_LEAGUES: TopLeague[] = [
  { id: 39, tag: "Premier League", countryTag: "English Football", kind: "domestic" },
  { id: 140, tag: "La Liga", countryTag: "Spanish Football", kind: "domestic" },
  { id: 135, tag: "Serie A", countryTag: "Italian Football", kind: "domestic" },
  { id: 78, tag: "Bundesliga", countryTag: "German Football", kind: "domestic" },
  { id: 61, tag: "Ligue 1", countryTag: "French Football", kind: "domestic" },
  { id: 88, tag: "Eredivisie", countryTag: "Dutch Football", kind: "domestic" },
  { id: 2, tag: "Champions League", countryTag: "European Football", kind: "cup" },
  { id: 3, tag: "Europa League", countryTag: "European Football", kind: "cup" },
  { id: 848, tag: "Conference League", countryTag: "European Football", kind: "cup" },
  { id: 40, tag: "Championship", countryTag: "English Football", kind: "domestic" },
  { id: 94, tag: "Primeira Liga", countryTag: "Portuguese Football", kind: "domestic" },
  { id: 71, tag: "Brasileirão", countryTag: "Brazilian Football", kind: "domestic" },
  { id: 128, tag: "Liga Profesional", countryTag: "Argentine Football", kind: "domestic" },
  { id: 344, tag: "Primera División BO", countryTag: "Bolivian Football", kind: "domestic" },
  { id: 253, tag: "MLS", countryTag: "US Football", kind: "domestic" },
  { id: 203, tag: "Süper Lig", countryTag: "Turkish Football", kind: "domestic" },
  { id: 179, tag: "Scottish Premiership", countryTag: "Scottish Football", kind: "domestic" },
  { id: 144, tag: "Pro League", countryTag: "Belgian Football", kind: "domestic" },
  { id: 218, tag: "Bundesliga AT", countryTag: "Austrian Football", kind: "domestic" },
  { id: 207, tag: "Super League CH", countryTag: "Swiss Football", kind: "domestic" },
  { id: 119, tag: "Superliga", countryTag: "Danish Football", kind: "domestic" },
  { id: 103, tag: "Eliteserien", countryTag: "Norwegian Football", kind: "domestic" },
  { id: 113, tag: "Allsvenskan", countryTag: "Swedish Football", kind: "domestic" },
  { id: 197, tag: "Super League GR", countryTag: "Greek Football", kind: "domestic" },
  { id: 98, tag: "J1 League", countryTag: "Japanese Football", kind: "domestic" },
  { id: 262, tag: "Liga MX", countryTag: "Mexican Football", kind: "domestic" },
  { id: 307, tag: "Pro League SA", countryTag: "Saudi Football", kind: "domestic" },
  { id: 292, tag: "K League 1", countryTag: "Korean Football", kind: "domestic" },
  { id: 141, tag: "La Liga 2", countryTag: "Spanish Football", kind: "domestic" },
  { id: 62, tag: "Ligue 2", countryTag: "French Football", kind: "domestic" },
  { id: 13, tag: "Copa Libertadores", countryTag: "South American Football", kind: "cup" },
  // —— Second tiers & additional Europe ——
  { id: 79, tag: "2. Bundesliga", countryTag: "German Football", kind: "domestic" },
  { id: 136, tag: "Serie B", countryTag: "Italian Football", kind: "domestic" },
  { id: 41, tag: "League One", countryTag: "English Football", kind: "domestic" },
  { id: 42, tag: "League Two", countryTag: "English Football", kind: "domestic" },
  { id: 89, tag: "Keuken Kampioen Divisie", countryTag: "Dutch Football", kind: "domestic" },
  { id: 95, tag: "Liga Portugal 2", countryTag: "Portuguese Football", kind: "domestic" },
  { id: 180, tag: "Scottish Championship", countryTag: "Scottish Football", kind: "domestic" },
  { id: 345, tag: "Czech First League", countryTag: "Czech Football", kind: "domestic" },
  { id: 106, tag: "Ekstraklasa", countryTag: "Polish Football", kind: "domestic" },
  { id: 283, tag: "Liga I", countryTag: "Romanian Football", kind: "domestic" },
  { id: 286, tag: "Super Liga", countryTag: "Serbian Football", kind: "domestic" },
  { id: 210, tag: "HNL", countryTag: "Croatian Football", kind: "domestic" },
  { id: 172, tag: "First League BG", countryTag: "Bulgarian Football", kind: "domestic" },
  { id: 318, tag: "Ligat ha'Al", countryTag: "Israeli Football", kind: "domestic" },
  { id: 357, tag: "Premier Division", countryTag: "Irish Football", kind: "domestic" },
  { id: 271, tag: "NB I", countryTag: "Hungarian Football", kind: "domestic" },
  { id: 244, tag: "Veikkausliiga", countryTag: "Finnish Football", kind: "domestic" },
  { id: 383, tag: "Ukrainian Premier League", countryTag: "Ukrainian Football", kind: "domestic" },
  { id: 332, tag: "Super Liga SK", countryTag: "Slovak Football", kind: "domestic" },
  // —— Americas ——
  { id: 72, tag: "Brasileirão Série B", countryTag: "Brazilian Football", kind: "domestic" },
  { id: 239, tag: "Primera A", countryTag: "Colombian Football", kind: "domestic" },
  { id: 265, tag: "Primera División CL", countryTag: "Chilean Football", kind: "domestic" },
  { id: 268, tag: "Primera División UY", countryTag: "Uruguayan Football", kind: "domestic" },
  { id: 242, tag: "Liga Pro", countryTag: "Ecuadorian Football", kind: "domestic" },
  { id: 281, tag: "Liga 1", countryTag: "Peruvian Football", kind: "domestic" },
  { id: 250, tag: "Division Profesional", countryTag: "Paraguayan Football", kind: "domestic" },
  { id: 299, tag: "Primera División VE", countryTag: "Venezuelan Football", kind: "domestic" },
  { id: 11, tag: "Copa Sudamericana", countryTag: "South American Football", kind: "cup" },
  // —— Asia & Oceania ——
  { id: 99, tag: "J2 League", countryTag: "Japanese Football", kind: "domestic" },
  { id: 293, tag: "K League 2", countryTag: "Korean Football", kind: "domestic" },
  { id: 188, tag: "A-League", countryTag: "Australian Football", kind: "domestic" },
  { id: 274, tag: "Liga 1 ID", countryTag: "Indonesian Football", kind: "domestic" },
  { id: 296, tag: "Thai League 1", countryTag: "Thai Football", kind: "domestic" },
  { id: 323, tag: "Indian Super League", countryTag: "Indian Football", kind: "domestic" },
  { id: 169, tag: "Chinese Super League", countryTag: "Chinese Football", kind: "domestic" },
  // —— Africa & Middle East ——
  { id: 233, tag: "Egyptian Premier League", countryTag: "Egyptian Football", kind: "domestic" },
  { id: 200, tag: "Botola Pro", countryTag: "Moroccan Football", kind: "domestic" },
  { id: 288, tag: "Premier Soccer League", countryTag: "South African Football", kind: "domestic" },
  { id: 384, tag: "Kenyan Premier League", countryTag: "Kenyan Football", kind: "domestic" },
  { id: 186, tag: "Ligue 1 AL", countryTag: "Algerian Football", kind: "domestic" },
  { id: 202, tag: "Ligue 1 TN", countryTag: "Tunisian Football", kind: "domestic" },
  { id: 305, tag: "Stars League", countryTag: "Qatari Football", kind: "domestic" },
  { id: 301, tag: "Pro League UAE", countryTag: "UAE Football", kind: "domestic" },
  // —— Major domestic cups ——
  { id: 45, tag: "FA Cup", countryTag: "English Football", kind: "cup" },
  { id: 48, tag: "EFL Cup", countryTag: "English Football", kind: "cup" },
  { id: 81, tag: "DFB Pokal", countryTag: "German Football", kind: "cup" },
  { id: 137, tag: "Coppa Italia", countryTag: "Italian Football", kind: "cup" },
  { id: 143, tag: "Copa del Rey", countryTag: "Spanish Football", kind: "cup" },
  { id: 66, tag: "Coupe de France", countryTag: "French Football", kind: "cup" },
  { id: 96, tag: "Taça de Portugal", countryTag: "Portuguese Football", kind: "cup" },
  { id: 90, tag: "KNVB Beker", countryTag: "Dutch Football", kind: "cup" },
];

export function getTopLeagueById(id: number): TopLeague | undefined {
  return TOP_LEAGUES.find((league) => league.id === id);
}

export function resolveTopLeagues(leagueIds?: number[]): TopLeague[] {
  if (!leagueIds?.length) return TOP_LEAGUES;

  const resolved = leagueIds
    .map((id) => getTopLeagueById(id))
    .filter((league): league is TopLeague => league != null);

  return resolved;
}

export function getTopLeagueLabels(): string[] {
  return TOP_LEAGUES.map((league) => league.tag);
}
