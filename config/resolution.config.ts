/** Challenge window for new match-market imports (24 hours). */
export const MATCH_MARKET_LIVENESS_SECONDS = 86_400;

/** Human-readable copy for match pages and resolution UI. */
export const MATCH_RESOLUTION_COPY = {
  challengeWindow: "24 hours",
  /** Typical time for the operator to post a result after full time — not the on-chain settle delay. */
  typicalProposal: "about an hour",
} as const;
