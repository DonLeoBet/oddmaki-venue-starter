import type { MarketTypeId } from "@/config/marketTypes";
import {
  FIXTURE_FINISHED_STATUSES,
  FIXTURE_LIVE_STATUSES,
  FIXTURE_VOID_STATUSES,
} from "@/config/resolution.config";

export type FixtureLifecycleKind = "upcoming" | "live" | "finished" | "void" | "unknown";

export interface FixtureScore {
  home: number;
  away: number;
}

export function classifyFixtureStatus(status: string | null | undefined): FixtureLifecycleKind {
  if (!status) return "unknown";

  const short = status.trim().toUpperCase();

  if ((FIXTURE_FINISHED_STATUSES as readonly string[]).includes(short)) {
    return "finished";
  }

  if ((FIXTURE_VOID_STATUSES as readonly string[]).includes(short)) {
    return "void";
  }

  if ((FIXTURE_LIVE_STATUSES as readonly string[]).includes(short)) {
    return "live";
  }

  if (short === "NS" || short === "TBD" || short === "PST" || short === "SUSP") {
    return "upcoming";
  }

  return "unknown";
}

/**
 * Map a finished fixture score onto a binary Yes/No assertion for one
 * canonical sub-market (`1x2:home`, `btts:yes`, `ou25:over`, …).
 */
export function resolveBinaryOutcomeForSubMarket(params: {
  marketType: MarketTypeId | null;
  outcomeKey: string | null;
  score: FixtureScore;
  yesLabel?: string;
  noLabel?: string;
}): string | null {
  const { marketType, outcomeKey, score } = params;
  const yes = params.yesLabel ?? "Yes";
  const no = params.noLabel ?? "No";

  if (!marketType || !outcomeKey) return null;

  const pick = (won: boolean) => (won ? yes : no);
  const total = score.home + score.away;

  switch (marketType) {
    case "1x2":
      if (outcomeKey === "home") return pick(score.home > score.away);
      if (outcomeKey === "draw") return pick(score.home === score.away);
      if (outcomeKey === "away") return pick(score.away > score.home);

      return null;
    case "btts":
      if (outcomeKey === "yes") return pick(score.home > 0 && score.away > 0);
      if (outcomeKey === "no") return pick(score.home === 0 || score.away === 0);

      return null;
    case "ou15":
      if (outcomeKey === "over") return pick(total > 1.5);
      if (outcomeKey === "under") return pick(total < 1.5);

      return null;
    case "ou25":
      if (outcomeKey === "over") return pick(total > 2.5);
      if (outcomeKey === "under") return pick(total < 2.5);

      return null;
    case "ou35":
      if (outcomeKey === "over") return pick(total > 3.5);
      if (outcomeKey === "under") return pick(total < 3.5);

      return null;
    case "double_chance":
      if (outcomeKey === "1x") return pick(score.home >= score.away);
      if (outcomeKey === "12") return pick(score.home !== score.away);
      if (outcomeKey === "x2") return pick(score.away >= score.home);

      return null;
    case "dnb":
      if (score.home === score.away) return null;
      if (outcomeKey === "home") return pick(score.home > score.away);
      if (outcomeKey === "away") return pick(score.away > score.home);

      return null;
    case "beat":
      if (outcomeKey === "yes") return pick(score.home > score.away);
      if (outcomeKey === "no") return pick(score.home <= score.away);

      return null;
    default:
      return null;
  }
}
