/**
 * Suggested tags for market creation and category filtering.
 */
export const SUGGESTED_TAGS = [
  "sports",
  "English Football",
  "Dutch Football",
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
  { id: "eredivisie", label: "Eredivisie", matchTags: ["Eredivisie", "Dutch Football"] },
  { id: "premier-league", label: "Premier League", matchTags: ["Premier League", "English Football"] },
  { id: "champions-league", label: "Champions League", matchTags: ["Champions League", "European Football"] },
  { id: "la-liga", label: "La Liga", matchTags: ["La Liga", "Spanish Football"] },
  { id: "serie-a", label: "Serie A", matchTags: ["Serie A", "Italian Football"] },
  { id: "bundesliga", label: "Bundesliga", matchTags: ["Bundesliga", "German Football"] },
  { id: "friendly-games", label: "Friendly Games", matchTags: ["Friendly Games"] },
  { id: "other-markets", label: "Other Markets", matchTags: ["politics", "crypto", "finance", "geopolitics", "tech"] },
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
