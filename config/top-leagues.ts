/**
 * Top 30 football competitions for outright (season winner) markets.
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
