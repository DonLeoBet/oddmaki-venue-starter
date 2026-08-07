import type { UnifiedFeedItem } from "../types";

export type MarketKind = "futures" | "matches" | "other";

const FUTURE_PHRASES = [
  "win the",
  "winning the",
  "winner",
  "winners of",
  "champion",
  "championship",
  "top scorer",
  "top goalscorer",
  "golden boot",
  "futures",
  "outright",
  "tournament winner",
  "league winner",
  "season",
  "to be relegated",
  "to qualify",
  "top 4",
  "top four",
  "bottom 3",
  "relegated",
  "promoted",
  "qualify",
];

const MATCH_PHRASES = [
  " vs ",
  " v ",
  " - ",
  "1x2",
  "matchday",
  "round",
  "fixture",
  "week ",
  "head to head",
  "h2h",
];

const MATCH_OUTCOME_NAMES = new Set([
  "1",
  "x",
  "2",
  "1x",
  "x2",
  "12",
  "home",
  "draw",
  "away",
  "h",
  "d",
  "a",
]);

function getMarketText(item: UnifiedFeedItem): string {
  if (item.type === "standalone") {
    return `${item.data.question} ${item.data.tags?.join(" ") ?? ""}`;
  }

  if (item.type === "group") {
    return `${item.data.marketQuestion} ${item.data.tags?.join(" ") ?? ""} ${item.data.outcomes.map((o) => o.name).join(" ")}`;
  }

  return `${item.data.title} ${item.data.tags?.join(" ") ?? ""}`;
}

function hasMatchOutcomes(item: UnifiedFeedItem): boolean {
  if (item.type !== "group") return false;

  return item.data.outcomes.every((o) =>
    MATCH_OUTCOME_NAMES.has(o.name.toLowerCase()),
  );
}

export function classifyMarket(item: UnifiedFeedItem): MarketKind {
  const text = getMarketText(item).toLowerCase();
  const tags = (item.data.tags ?? []).map((t) => t.toLowerCase());

  // Future signals take precedence — a title can legitimately list contenders
  // with "vs" (e.g. "Premier League winner: Man City vs Arsenal vs ...")
  // and still be a futures market.
  if (FUTURE_PHRASES.some((p) => text.includes(p))) {
    return "futures";
  }

  if (tags.some((t) => t === "futures" || t.includes("outright"))) {
    return "futures";
  }

  if (
    MATCH_PHRASES.some((p) => text.includes(p)) ||
    hasMatchOutcomes(item) ||
    tags.some((t) => t === "match" || t === "1x2" || t === "fixture")
  ) {
    return "matches";
  }

  return "other";
}

export function isLongTermMarket(item: UnifiedFeedItem): boolean {
  return classifyMarket(item) === "futures";
}
