"use client";

import NextLink from "next/link";
import { Skeleton } from "@heroui/skeleton";

import { useMarketTopHolders } from "@/features/market-holders/hooks/useMarketTopHolders";
import { AddressAvatar, generatePseudonym } from "@/lib/identity";

interface PositionsViewProps {
  marketId: string;
  outcomes: string[];
  /** Percentage (0-100) — current mark for outcome 0, matches useMarketDetail. */
  yesPrice: number;
  /** Percentage (0-100) — current mark for outcome 1. */
  noPrice: number;
}

interface DecoratedPosition {
  id: string;
  trader: { id: string };
  outcome: string;
  quantity: string;
  avgEntryPrice: string; // scaled 1e18
  /** quantity (token units, 6dp) × markPrice → $ value */
  currentValueUsd: number;
}

function formatCents(avgEntryPriceWei: string): string {
  const num = parseFloat(avgEntryPriceWei) / 1e18;

  return `${(num * 100).toFixed(1)}¢`;
}

function formatUsd(value: number): string {
  if (value >= 1_000_000) return `US$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 10_000) return `US$${(value / 1000).toFixed(1)}K`;
  if (value >= 1) return `US$${value.toFixed(2)}`;

  return `US$${value.toFixed(2)}`;
}

function decorate(
  pos: any,
  yesPrice: number,
  noPrice: number,
): DecoratedPosition {
  const outcomeIdx = parseInt(pos.outcome);
  const qtyTokens = parseFloat(pos.quantity) / 1e6;
  const price = outcomeIdx === 0 ? yesPrice : noPrice;

  return {
    id: pos.id,
    trader: pos.trader,
    outcome: pos.outcome,
    quantity: pos.quantity,
    avgEntryPrice: pos.avgEntryPrice,
    currentValueUsd: qtyTokens * price,
  };
}

function PositionRow({ pos, rank }: { pos: DecoratedPosition; rank: number }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-default-100 last:border-0 gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-xs text-default-400 w-4 shrink-0 text-right tabular-nums">
          {rank}
        </span>
        <NextLink
          className="flex items-center gap-2 hover:text-primary transition-colors min-w-0"
          href={`/trader/${pos.trader.id}`}
        >
          <AddressAvatar address={pos.trader.id} size={22} />
          <span className="text-sm font-medium truncate">
            {generatePseudonym(pos.trader.id)}
          </span>
          <span className="text-xs text-default-400 shrink-0">
            avg {formatCents(pos.avgEntryPrice)}
          </span>
        </NextLink>
      </div>
      <span className="text-sm font-medium text-default-700 shrink-0 tabular-nums">
        {formatUsd(pos.currentValueUsd)}
      </span>
    </div>
  );
}

function Column({
  label,
  positions,
  colorClass,
}: {
  label: string;
  positions: DecoratedPosition[];
  colorClass: string;
}) {
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-2 px-1">
        <span className={`text-sm font-semibold ${colorClass}`}>{label}</span>
        <span className="text-xs text-default-400 font-medium uppercase tracking-wide">
          PNL
        </span>
      </div>
      {positions.length === 0 ? (
        <p className="text-xs text-default-400 py-2 px-1">No positions</p>
      ) : (
        positions.map((pos, i) => (
          <PositionRow key={pos.id} pos={pos} rank={i + 1} />
        ))
      )}
    </div>
  );
}

export function PositionsView({
  marketId,
  outcomes,
  yesPrice,
  noPrice,
}: PositionsViewProps) {
  const { data: rawHolders = [], isLoading } = useMarketTopHolders(marketId);

  const outcomeLabel = (index: number) =>
    outcomes?.[index] ?? (index === 0 ? "Up" : "Down");

  if (isLoading) {
    return (
      <div className="flex flex-col sm:flex-row gap-8">
        {[0, 1].map((i) => (
          <div key={i} className="flex-1 flex flex-col gap-2">
            <Skeleton className="h-5 w-20 rounded" />
            {Array.from({ length: 5 }).map((_, j) => (
              <Skeleton key={j} className="h-9 w-full rounded" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (rawHolders.length === 0) {
    return (
      <div className="py-6 text-center">
        <p className="text-sm text-default-500">No positions yet</p>
      </div>
    );
  }

  const yes = (yesPrice || 0) / 100;
  const no = (noPrice || 0) / 100;
  const decorated = rawHolders.map((p: any) => decorate(p, yes, no));

  const byOutcome: Record<number, DecoratedPosition[]> = { 0: [], 1: [] };

  for (const pos of decorated) {
    const idx = parseInt(pos.outcome);

    if (!byOutcome[idx]) byOutcome[idx] = [];
    byOutcome[idx].push(pos);
  }

  for (const idx of Object.keys(byOutcome)) {
    byOutcome[Number(idx)].sort(
      (a, b) => b.currentValueUsd - a.currentValueUsd,
    );
  }

  return (
    <div className="flex flex-col sm:flex-row gap-8">
      <Column
        colorClass="text-primary"
        label={outcomeLabel(0)}
        positions={byOutcome[0] ?? []}
      />
      <Column
        colorClass="text-secondary"
        label={outcomeLabel(1)}
        positions={byOutcome[1] ?? []}
      />
    </div>
  );
}
