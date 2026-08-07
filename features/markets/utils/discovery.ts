import type { UnifiedFeedItem } from "../types";

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
];

const MATCH_PHRASES = [
  " vs ",
  " v ",
  "1x2",
  "matchday",
  "round",
  "fixture",
  "week ",
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

export function isLongTermMarket(item: UnifiedFeedItem): boolean {
  const text = getMarketText(item).toLowerCase();
  const tags = (item.data.tags ?? []).map((t) => t.toLowerCase());

  if (FUTURE_PHRASES.some((p) => text.includes(p))) {
    return true;
  }

  if (tags.some((t) => t === "futures" || t.includes("outright"))) {
    return true;
  }

  if (MATCH_PHRASES.some((p) => text.includes(p))) {
    return false;
  }

  return tags.some(
    (t) =>
      t.includes("winner") ||
      t.includes("champion") ||
      t.includes("season") ||
      t.includes("tournament") ||
      t.includes("long-term"),
  );
}
