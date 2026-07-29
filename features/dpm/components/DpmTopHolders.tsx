"use client";

import type { DpmMarketSummary } from "../types";

import { Skeleton } from "@heroui/skeleton";

import { useDpmPositions } from "../hooks/useDpmPositions";
import { currentPayoutUsd } from "../lib/pricing";
import { formatUsd } from "../lib/format";

import { AddressAvatar, generatePseudonym } from "@/lib/identity";

interface DpmTopHoldersProps {
  marketId: string;
  data: DpmMarketSummary;
  outcomes: string[];
}

const outcomeColor = (i: number): string =>
  i === 0 ? "text-primary" : i === 1 ? "text-secondary" : "text-default-500";

/** Top holders of a pool — every position, ranked by shares (largest first). */
export function DpmTopHolders({
  marketId,
  data,
  outcomes,
}: DpmTopHoldersProps) {
  const { data: positions, isLoading } = useDpmPositions(marketId);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 p-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  const rows = (positions ?? []).filter((p) => Number(p.shares) > 0);

  if (rows.length === 0) {
    return (
      <p className="px-2 py-6 text-center text-sm text-default-400">
        No holders yet
      </p>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center px-2 py-1 text-[11px] uppercase tracking-wide text-default-400">
        <span className="flex-1">Holder</span>
        <span className="w-20 text-right">In</span>
        <span className="w-28 text-right">Payout if wins</span>
      </div>
      {rows.map((p) => {
        const i = Number(p.outcomeIndex);
        const label = outcomes[i] ?? p.outcome.label ?? `Outcome ${i}`;
        const payout = currentPayoutUsd(
          data.outcomes,
          i,
          p.shares,
          p.collateralIn,
        );

        return (
          <div
            key={p.id}
            className="flex items-center gap-2 px-2 py-1.5 border-t border-default-100"
          >
            <AddressAvatar address={p.trader.address} size={20} />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm text-foreground">
                {generatePseudonym(p.trader.address)}
              </span>
              <span className={`text-xs ${outcomeColor(i)}`}>{label}</span>
            </div>
            <span className="w-20 text-right text-sm text-default-500">
              {formatUsd(Number(p.collateralIn) / 1e6)}
            </span>
            <span className="w-28 text-right text-sm font-medium text-foreground">
              {formatUsd(payout)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
