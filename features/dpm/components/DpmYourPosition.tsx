"use client";

import type { DpmMarketSummary } from "../types";

import { useAccount } from "wagmi";

import { useDpmPositions } from "../hooks/useDpmPositions";
import { currentPayoutUsd } from "../lib/pricing";
import { formatUsd } from "../lib/format";

import { AddressAvatar } from "@/lib/identity";

interface DpmYourPositionProps {
  marketId: string;
  data: DpmMarketSummary;
  outcomes: string[];
}

const outcomeColor = (i: number): string =>
  i === 0 ? "text-primary" : i === 1 ? "text-secondary" : "text-default-500";

/**
 * The connected wallet's holdings as Activity-styled one-liners, pinned above
 * the tab switcher: "You hold $X on Up   $Y · ▲$Z". Renders nothing when the
 * wallet is disconnected or holds no position.
 */
export function DpmYourPosition({
  marketId,
  data,
  outcomes,
}: DpmYourPositionProps) {
  const { address } = useAccount();
  const { data: positions } = useDpmPositions(marketId);

  if (!address || !positions) return null;

  const mine = positions.filter(
    (p) =>
      p.trader.address.toLowerCase() === address.toLowerCase() &&
      Number(p.shares) > 0,
  );

  if (mine.length === 0) return null;

  return (
    <div className="mb-3 flex flex-col gap-2 border-b border-default-100 pb-3">
      {mine.map((p) => {
        const i = Number(p.outcomeIndex);
        const label = outcomes[i] ?? p.outcome.label ?? `Outcome ${i}`;
        const stake = Number(p.collateralIn) / 1e6;
        const payout = currentPayoutUsd(
          data.outcomes,
          i,
          p.shares,
          p.collateralIn,
        );
        const pnl = payout - stake;
        const up = pnl >= 0;

        return (
          <div
            key={p.id}
            className="flex items-center justify-between gap-2 text-sm"
          >
            <div className="flex min-w-0 items-center gap-1.5">
              <AddressAvatar address={address} size={20} />
              <span className="text-default-400">You hold</span>
              <span className="font-semibold">{formatUsd(stake)}</span>
              <span className="text-default-400">on</span>
              <span className={`font-semibold ${outcomeColor(i)}`}>
                {label}
              </span>
            </div>
            <div className="flex flex-shrink-0 items-center gap-2 text-xs">
              <span className="font-medium text-foreground">
                {formatUsd(payout)}
              </span>
              <span className={up ? "text-success" : "text-danger"}>
                {up ? "▲" : "▼"} {formatUsd(Math.abs(pnl))}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
