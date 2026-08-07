import type { UnifiedFeedItem } from "../types";

export type MarketKind = "futures" | "matches" | "other";

// Long-term / outright market signals.
const FUTURE_PHRASES = [
  "win the",
  "winning the",
  "winner of the",
  "winner of",
  "league winner",
  "cup winner",
  "tournament winner",
  "season winner",
  "champion of",
  "champion",
  "championship",
  "top scorer",
  "top goalscorer",
  "golden boot",
  "futures",
  "outright",
  "tournament winner",
  "league winner",
  "season winner",
  "to be relegated",
  "to qualify",
  "will qualify",
  "will be relegated",
  "will be promoted",
  "top 4",
  "top four",
  "bottom 3",
  "bottom three",
  "relegated",
  "promoted",
  "qualify",
  "qualifies",
  "winner",
];

// Match / single-event market signals.
const MATCH_PHRASES = [
  " vs ",
  " v ",
  " - ",
  "1x2",
  "1 x 2",
  "moneyline",
  "over/under",
  "over under",
  "over 2.5",
  "under 2.5",
  "btts",
  "both teams to score",
  "correct score",
  "match winner",
  "match result",
  "match outcome",
  "full time",
  "full-time",
  "half time",
  "half-time",
  "ht/ft",
  "ht-ft",
  "draw no bet",
  "asian handicap",
  "handicap",
  "spread",
  "total goals",
  "total",
  "matchday",
  "match day",
  "round",
  "fixture",
  "week ",
  "head to head",
  "h2h",
  "kick off",
  "kick-off",
  "match",
];

function getMarketText(item: UnifiedFeedItem): string {
  if (item.type === "standalone") {
    return `${item.data.question} ${item.data.tags?.join(" ") ?? ""}`;
  }

  if (item.type === "group") {
    return `${item.data.marketQuestion} ${item.data.tags?.join(" ") ?? ""} ${item.data.outcomes.map((o) => o.name).join(" ")}`;
  }

  return `${item.data.title} ${item.data.tags?.join(" ") ?? ""}`;
}

export function classifyMarket(item: UnifiedFeedItem): MarketKind {
  const text = getMarketText(item).toLowerCase();
  const tags = (item.data.tags ?? []).map((t) => t.toLowerCase());

  // Strong tag signals first.
  if (tags.some((t) => t === "futures" || t === "outright" || t === "season")) {
    return "futures";
  }

  if (tags.some((t) => t === "match" || t === "fixture" || t === "1x2")) {
    return "matches";
  }

  // Future phrases take precedence over match phrases. This prevents a future
  // title like "Premier League winner: Arsenal vs Chelsea vs ..." from being
  // misclassified as a match because it lists contenders with "vs".
  if (FUTURE_PHRASES.some((p) => text.includes(p))) {
    return "futures";
  }

  if (MATCH_PHRASES.some((p) => text.includes(p))) {
    return "matches";
  }

  return "other";
}

export function isLongTermMarket(item: UnifiedFeedItem): boolean {
  return classifyMarket(item) === "futures";
}
