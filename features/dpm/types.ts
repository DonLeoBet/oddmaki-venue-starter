/**
 * DPM ("Pool") market shapes returned by the subgraph via
 * `client.public.getDpmMarket` / `getDpmMarkets`.
 *
 * The SDK types these as `any`, so we describe the relevant fields here.
 * All numeric fields arrive as strings from the subgraph.
 */

export interface DpmOutcomeSummary {
  outcomeIndex: number;
  label: string;
  conditionId: string;
  /** Pool collateral M_i for this outcome (string). */
  collateral: string;
  /** Shares outstanding N_i for this outcome (string). */
  shares: string;
  /** Refundable intent total staked on this outcome (string). */
  intentTotal: string;
  isWinner: boolean;
  addedLate: boolean;
}

export interface DpmMarketSummary {
  id: string;
  outcomeCount: number;
  /** Unix seconds (string). */
  openTime: string;
  /** Unix seconds (string). */
  closeTime: string;
  poolInitialized: boolean;
  seededAt: string | null;
  resolved: boolean;
  winningOutcome: number | null;
  /** Total pool collateral across outcomes (string). */
  totalCollateral: string;
  totalShares: string;
  totalIntent: string;
  uniqueTraders: string;
  market: {
    id: string;
    marketId: string;
    question: string;
    outcomes: string[];
    status: string;
    collateralToken: string;
    conditionId: string;
    tags: string[];
  };
  outcomes: DpmOutcomeSummary[];
}

/**
 * Discriminated union returned by `useDpmMarketData`.
 */
export type DpmMarketDataResult =
  | { isDpmMarket: false; data: null }
  | { isDpmMarket: true; data: DpmMarketSummary };

export type DpmPhase = "lobby" | "open" | "closed" | "resolved";

/**
 * Derive the current lifecycle phase from openTime/closeTime/resolved vs now.
 * openTime=0 means immediate (no lobby).
 */
export function dpmPhase(
  data: Pick<DpmMarketSummary, "openTime" | "closeTime" | "resolved">,
  nowSec: number = Math.floor(Date.now() / 1000),
): DpmPhase {
  if (data.resolved) return "resolved";
  const open = Number(data.openTime);
  const close = Number(data.closeTime);

  if (nowSec >= close) return "closed";
  if (open > 0 && nowSec < open) return "lobby";

  return "open";
}

/** A trader's position in a pool (DpmPosition) — powers holders/positions. */
export interface DpmPositionSummary {
  id: string;
  outcomeIndex: number;
  /** Effective shares held N (string). */
  shares: string;
  /** Refundable intent stake before seed (string, 6dp). */
  intentStake: string;
  /** Total gross collateral put in (string, 6dp). */
  collateralIn: string;
  entryCount: string;
  claimed: boolean;
  /** Collateral received at claim, 0 until claimed (string, 6dp). */
  payout: string;
  /** payout - collateralIn, set at claim (string, 6dp). */
  realizedPnL: string;
  lastUpdatedAt: string;
  trader: { id: string; address: string };
  outcome: { label: string };
}

/** One pool entry (DpmEntry) — powers the activity feed and the odds chart. */
export interface DpmEntrySummary {
  id: string;
  outcome: number;
  outcomeLabel: string;
  /** Collateral deposited (string, 6-decimal USDC base units). */
  amount: string;
  shares: string;
  /** Outcome 0's implied percent right after this entry. */
  impliedYesPct: number;
  totalCollateral: string;
  timestamp: string;
  txHash: string;
  trader: { id: string; address: string };
}
