/**
 * Shared money formatting for Pool (DPM) UI. Collateral arrives as 6-decimal
 * USDC base units (string). One formatter so the header, pool panel, trading
 * panel, and tables never disagree on rounding (e.g. $5.93 vs $6).
 */

/** Format 6-decimal USDC base units as a dollar string. */
export function formatUsdc(baseUnits: string | bigint): string {
  const n = Number(baseUnits) / 1e6;

  return formatUsd(n);
}

/** Format a dollar number: 2 decimals under $1k, then $X.XK / $X.XM. */
export function formatUsd(n: number): string {
  if (!Number.isFinite(n)) return "$0.00";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;

  return `$${n.toFixed(2)}`;
}
