/**
 * Suggested tags for market creation and category filtering.
 */
export const SUGGESTED_TAGS = [
  "sports",
  "English Football",
  "Dutch Football",
  "European Football",
  "Spanish Football",
  "Italian Football",
  "German Football",
  "French Football",
  "Turkish Football",
  "Argentine Football",
  "Brazilian Football",
  "Champions League",
  "Europa League",
  "La Liga",
  "Serie A",
  "Bundesliga",
  "Ligue 1",
  "Keuken Kampioen Divisie",
  "outrights",
  "Friendly Games",
  "crypto",
  "defi",
  "politics",
  "finance",
  "economy",
  "elections",
  "geopolitics",
  "entertainment",
  "science",
  "technology",
  "business",
  "world",
  "culture",
  "mentions",
] as const;

export const MAX_TAGS = 5;

export interface CategoryConfig {
  id: string;
  label: string;
  matchTags: string[];
}

export const CATEGORIES: CategoryConfig[] = [
  {
    id: "eredivisie",
    label: "Eredivisie",
    matchTags: ["Eredivisie"],
  },
  {
    id: "keuken-kampioen",
    label: "Keuken Kampioen",
    matchTags: ["Keuken Kampioen Divisie"],
  },
  {
    id: "premier-league",
    label: "Premier League",
    matchTags: ["Premier League"],
  },
  {
    id: "champions-league",
    label: "Champions League",
    matchTags: ["Champions League"],
  },
  {
    id: "europa-league",
    label: "Europa League",
    matchTags: ["Europa League"],
  },
  {
    id: "la-liga",
    label: "La Liga",
    matchTags: ["La Liga"],
  },
  {
    id: "serie-a",
    label: "Serie A",
    matchTags: ["Serie A"],
  },
  {
    id: "bundesliga",
    label: "Bundesliga",
    matchTags: ["Bundesliga"],
  },
  {
    id: "ligue-1",
    label: "Ligue 1",
    matchTags: ["Ligue 1"],
  },
  {
    id: "super-lig",
    label: "Süper Lig",
    matchTags: ["Süper Lig"],
  },
  {
    id: "liga-profesional",
    label: "Liga Profesional",
    matchTags: ["Liga Profesional"],
  },
  {
    id: "brasileirao",
    label: "Brasileirão",
    matchTags: ["Brasileirão"],
  },
  {
    id: "crypto",
    label: "Crypto",
    matchTags: ["crypto", "price-market"],
  },
  {
    id: "outrights",
    label: "Outrights",
    matchTags: ["outrights"],
  },
  {
    id: "friendly-games",
    label: "Friendly Games",
    matchTags: ["Friendly Games"],
  },
  {
    id: "other-markets",
    label: "Other Markets",
    matchTags: ["politics", "crypto", "finance", "geopolitics", "tech"],
  },
];

export type SortMode = "trending" | "new";

export interface SortModeConfig {
  id: SortMode;
  label: string;
  sortBy: "volume" | "created";
}

export const SORT_MODES: SortModeConfig[] = [
  { id: "trending", label: "Trending", sortBy: "volume" },
  { id: "new", label: "New", sortBy: "created" },
];
