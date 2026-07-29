"use client";

import NextLink from "next/link";
import { Skeleton } from "@heroui/skeleton";

import { useMarketTopHolders } from "@/features/market-holders/hooks/useMarketTopHolders";
import { AddressAvatar, generatePseudonym } from "@/lib/identity";

interface TopHoldersViewProps {
  marketId: string;
  outcomes: string[];
}

function formatShares(value: string): string {
  const num = parseFloat(value) / 1e6;

  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(0)}K`;
  if (num < 1) return num.toFixed(2);

  return Math.round(num).toString();
}

function HolderRow({ pos, rank }: { pos: any; rank: number }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-default-100 last:border-0">
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
        </NextLink>
      </div>
      <span className="text-sm font-medium text-default-700 shrink-0 ml-2 tabular-nums">
        {formatShares(pos.quantity)}
      </span>
    </div>
  );
}

function Column({
  label,
  holders,
  colorClass,
}: {
  label: string;
  holders: any[];
  colorClass: string;
}) {
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-2 px-1">
        <span className={`text-sm font-semibold ${colorClass}`}>{label}</span>
        <span className="text-xs text-default-400 font-medium uppercase tracking-wide">
          Shares
        </span>
      </div>
      {holders.length === 0 ? (
        <p className="text-xs text-default-400 py-2 px-1">No holders</p>
      ) : (
        holders.map((pos, i) => (
          <HolderRow key={pos.id} pos={pos} rank={i + 1} />
        ))
      )}
    </div>
  );
}

export function TopHoldersView({ marketId, outcomes }: TopHoldersViewProps) {
  const { data: holders = [], isLoading } = useMarketTopHolders(marketId);

  const outcomeLabel = (index: number) =>
    outcomes?.[index] ?? (index === 0 ? "Yes" : "No");

  if (isLoading) {
    return (
      <div className="flex gap-8">
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

  if (holders.length === 0) {
    return (
      <div className="py-6 text-center">
        <p className="text-sm text-default-500">No holders yet</p>
      </div>
    );
  }

  const byOutcome: Record<number, any[]> = { 0: [], 1: [] };

  for (const pos of holders) {
    const idx = parseInt(pos.outcome);

    if (!byOutcome[idx]) byOutcome[idx] = [];
    byOutcome[idx].push(pos);
  }

  return (
    <div className="flex flex-col sm:flex-row gap-8">
      <Column
        colorClass="text-primary"
        holders={byOutcome[0] ?? []}
        label={`${outcomeLabel(0)} holders`}
      />
      <Column
        colorClass="text-secondary"
        holders={byOutcome[1] ?? []}
        label={`${outcomeLabel(1)} holders`}
      />
    </div>
  );
}
