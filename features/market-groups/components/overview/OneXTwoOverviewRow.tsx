"use client";

import type { OverviewOutcomeChip } from "@/features/markets/utils/overviewMarkets";

import { alpha, colors } from "@/lib/tokens";

const OUTCOME_STYLES: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  home: {
    bg: alpha(colors.neonCyan, 0.12),
    text: colors.neonCyan,
    border: alpha(colors.neonCyan, 0.35),
  },
  draw: {
    bg: alpha(colors.textMuted, 0.15),
    text: colors.textSecondary,
    border: alpha(colors.textMuted, 0.25),
  },
  away: {
    bg: alpha(colors.neonMagenta, 0.12),
    text: colors.neonMagenta,
    border: alpha(colors.neonMagenta, 0.35),
  },
};

interface OneXTwoOverviewRowProps {
  outcomes: OverviewOutcomeChip[];
  isResolved: boolean;
  resolvedMarketId: string;
}

/** Branded 1X2 summary row for overview cards (text only — no crests). */
export function OneXTwoOverviewRow({
  outcomes,
  isResolved,
  resolvedMarketId,
}: OneXTwoOverviewRowProps) {
  return (
    <div className="py-2">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-default-400">
        1X2
      </span>
      <div className="grid grid-cols-3 gap-1.5">
        {outcomes.map((chip) => {
          const style = OUTCOME_STYLES[chip.outcomeKey] ?? OUTCOME_STYLES.draw;
          const pct = Math.round(chip.probability);
          const isWinner = isResolved && chip.marketId === resolvedMarketId;

          return (
            <div
              key={chip.marketId}
              className="flex flex-col items-center rounded-lg border px-1 py-1.5 text-center"
              style={{
                backgroundColor: style.bg,
                borderColor: isWinner ? style.text : style.border,
                boxShadow: isWinner ? `0 0 12px ${alpha(style.text, 0.25)}` : undefined,
              }}
            >
              <span
                className="text-[10px] font-semibold uppercase truncate w-full"
                style={{ color: style.text }}
              >
                {chip.label}
              </span>
              <span
                className="text-sm font-bold tabular-nums"
                style={{ color: style.text }}
              >
                {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
