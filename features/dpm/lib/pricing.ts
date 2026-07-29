/**
 * Pure DPM ("DPM I", Pennock 2004) pool math for the UI. All collateral/share
 * values are 6-decimal-scaled base-unit strings from the subgraph (M_i, N_i).
 *
 * Implied probability of outcome i = M_i / ΣM.
 *
 * Claim payout for a holder of outcome i (when i wins, pool frozen now):
 *   payout = collateralIn + (M_other / N_i) · shares
 * where M_other = ΣM − M_i (the losers' collateral) and N_i is the total shares
 * on the winning outcome.
 *
 * Marginal return for a *new* infinitesimal $1 on outcome i (Pennock pricing,
 * NOT the naive ΣM/M_i tote number, which is wrong for DPM I):
 *   multiple = 1 + (M_other · N_other) / (M_i · N_i)
 * where N_other = ΣN − N_i. At an empty/par side this collapses to the par
 * limit (1 share per $1), handled below.
 */

export interface DpmOutcomePool {
  outcomeIndex: number;
  collateral: string; // M_i (6dp base units)
  shares: string; // N_i (6dp base units)
}

const toN = (s: string | bigint | number | undefined | null): number =>
  s == null ? 0 : Number(s);

/** Implied probability (0–1) of outcome i from the collateral split. */
export function impliedProbability(
  outcomes: DpmOutcomePool[],
  i: number,
): number {
  const total = outcomes.reduce((a, o) => a + toN(o.collateral), 0);

  if (!(total > 0)) return outcomes.length ? 1 / outcomes.length : 0;

  return toN(outcomes[i]?.collateral) / total;
}

/** Implied probability as a whole percent (0–100). */
export function impliedPercent(outcomes: DpmOutcomePool[], i: number): number {
  return Math.max(
    0,
    Math.min(100, Math.round(impliedProbability(outcomes, i) * 100)),
  );
}

/**
 * Current payout (in dollars) for a holder of `shares`/`collateralIn` on
 * outcome `i`, if i wins at the current pool state. Returns the gross payout.
 */
export function currentPayoutUsd(
  outcomes: DpmOutcomePool[],
  i: number,
  shares: string,
  collateralIn: string,
): number {
  const mI = toN(outcomes[i]?.collateral);
  const nI = toN(outcomes[i]?.shares);
  const totalM = outcomes.reduce((a, o) => a + toN(o.collateral), 0);
  const mOther = Math.max(0, totalM - mI);
  const userShares = toN(shares);
  const paid = toN(collateralIn) / 1e6;

  if (!(nI > 0) || !(userShares > 0)) return paid;

  // (M_other / N_i) · userShares, all in base units → dollars.
  return paid + ((mOther / nI) * userShares) / 1e6;
}

/**
 * Marginal return multiple (×) for a new $1 on outcome `i` at the current pool.
 * Capped to a sane display ceiling; returns `null` when the side is unpriced.
 */
export function currentMultiple(
  outcomes: DpmOutcomePool[],
  i: number,
  cap = 99,
): number | null {
  const mI = toN(outcomes[i]?.collateral);
  const nI = toN(outcomes[i]?.shares);
  const totalM = outcomes.reduce((a, o) => a + toN(o.collateral), 0);
  const totalN = outcomes.reduce((a, o) => a + toN(o.shares), 0);
  const mOther = Math.max(0, totalM - mI);
  const nOther = Math.max(0, totalN - nI);

  // Empty/par side: a $1 entry mints ~1 share at par, so if it wins it scoops
  // the whole losers' pool (per dollar) → multiple ≈ 1 + M_other(in $).
  if (!(mI > 0) || !(nI > 0)) {
    const m = 1 + mOther / 1e6;

    return Math.min(cap, m);
  }

  const m = 1 + (mOther * nOther) / (mI * nI);

  return Math.min(cap, m);
}
