/** Challenge window for new match-market imports (24 hours). */
export const MATCH_MARKET_LIVENESS_SECONDS = 86_400;

/** Human-readable copy for match pages and resolution UI. */
export const MATCH_RESOLUTION_COPY = {
  challengeWindow: "24 hours",
  /** Typical time for the operator to post a result after full time — not the on-chain settle delay. */
  typicalProposal: "about an hour",
} as const;

/** API-Football short statuses that mean the match is finished for settlement. */
export const FIXTURE_FINISHED_STATUSES = [
  "FT",
  "AET",
  "PEN",
] as const;

/** Finished without a reliable score — pause trading, do not auto-assert. */
export const FIXTURE_VOID_STATUSES = [
  "CANC",
  "ABD",
  "AWD",
  "WO",
] as const;

export const FIXTURE_LIVE_STATUSES = [
  "1H",
  "2H",
  "HT",
  "ET",
  "BT",
  "P",
  "LIVE",
  "INT",
] as const;

/**
 * Wait this long after full time before the operator bot asserts.
 * Gives scorers/APIs time to finalize — reduces wrong early asserts.
 */
export const MATCH_ASSERT_BUFFER_SECONDS = Number(
  process.env.MATCH_ASSERT_BUFFER_SECONDS ?? 45 * 60,
);

/**
 * If kickoff was this long ago and the fixture still isn't finished/void,
 * force-pause markets so they cannot trade forever.
 */
export const MATCH_STALE_OPEN_SECONDS = Number(
  process.env.MATCH_STALE_OPEN_SECONDS ?? 36 * 60 * 60,
);

/** Soft caps per cron invocation (gas + API budget). */
export const MATCH_LIFECYCLE_LIMITS = {
  maxGroupsScanned: Number(process.env.MATCH_LIFECYCLE_MAX_GROUPS ?? 80),
  maxPauses: Number(process.env.MATCH_LIFECYCLE_MAX_PAUSES ?? 40),
  maxAsserts: Number(process.env.MATCH_LIFECYCLE_MAX_ASSERTS ?? 12),
  maxSettles: Number(process.env.MATCH_LIFECYCLE_MAX_SETTLES ?? 20),
} as const;

export function isMatchLifecycleEnabled(): boolean {
  const raw = process.env.MATCH_LIFECYCLE_ENABLED?.trim().toLowerCase();

  // Default on when bot mnemonic exists — set MATCH_LIFECYCLE_ENABLED=false to disable.
  if (raw === "false" || raw === "0") return false;

  return true;
}

export function isMatchLifecycleAssertEnabled(): boolean {
  const raw = process.env.MATCH_LIFECYCLE_ASSERT?.trim().toLowerCase();

  if (raw === "false" || raw === "0") return false;

  return isMatchLifecycleEnabled();
}

export function isMatchLifecycleSettleEnabled(): boolean {
  const raw = process.env.MATCH_LIFECYCLE_SETTLE?.trim().toLowerCase();

  if (raw === "false" || raw === "0") return false;

  return isMatchLifecycleEnabled();
}

/** Public UI lifecycle buckets — keep these five only. */
export type PublicMarketLifecycleState =
  | "active"
  | "closed"
  | "challenged"
  | "pending"
  | "resolved";

export const PUBLIC_LIFECYCLE_LABELS: Record<
  PublicMarketLifecycleState,
  string
> = {
  active: "Active",
  closed: "Closed",
  challenged: "In challenge",
  pending: "Pending",
  resolved: "Resolved",
};
