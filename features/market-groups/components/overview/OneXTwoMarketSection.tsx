"use client";

import type { GroupMarketDetail } from "../../hooks/useGroupMarkets";

import { DrawOutcomeIcon } from "@/components/football/DrawOutcomeIcon";
import { TeamLogo } from "@/components/football/TeamLogo";
import type { FixtureTeams } from "@/lib/markets/marketDisplay";
import { getOutcomeTeamLogo } from "@/lib/markets/marketDisplay";
import { formatVolume } from "@/features/markets/utils/formatting";
import { alpha, colors } from "@/lib/tokens";

const OUTCOME_ORDER = ["home", "draw", "away"] as const;

function sumSectionVolume(markets: GroupMarketDetail[]): string {
  const total = markets.reduce(
    (acc, market) => acc + parseFloat(market.totalVolume || "0"),
    0,
  );

  return formatVolume(String(total));
}

interface OneXTwoMarketSectionProps {
  markets: GroupMarketDetail[];
  selectedMarketId: string | null;
  teams?: FixtureTeams;
  onSelectMarket: (marketId: string, outcomeIndex?: 0 | 1) => void;
}

/** Unified 1X2 — stacked outcome rows, one shared volume line. */
export function OneXTwoMarketSection({
  markets,
  selectedMarketId,
  teams,
  onSelectMarket,
}: OneXTwoMarketSectionProps) {
  const byKey = Object.fromEntries(
    markets
      .filter((m) => m.marketType === "1x2" && m.outcomeKey)
      .map((m) => [m.outcomeKey!, m]),
  ) as Partial<Record<(typeof OUTCOME_ORDER)[number], GroupMarketDetail>>;

  const homeMarket = byKey.home;
  const drawMarket = byKey.draw;
  const awayMarket = byKey.away;

  if (!homeMarket || !drawMarket || !awayMarket || !teams) {
    return null;
  }

  const title = `${teams.home.name} vs ${teams.away.name} – 1X2`;
  const volumeLabel = sumSectionVolume([homeMarket, drawMarket, awayMarket]);

  return (
    <div className="px-3 py-3 sm:px-4 sm:py-4">
      <h3 className="mb-3 text-sm font-semibold text-foreground leading-snug break-words">
        {title}
      </h3>
      <div className="flex flex-col divide-y divide-default-100/50 rounded-xl border border-default-100/60 overflow-hidden">
        {OUTCOME_ORDER.map((key) => {
          const market = byKey[key]!;
          const pct = Math.round(market.yesPrice);
          const isSelected = selectedMarketId === market.marketId;
          const isDraw = key === "draw";
          const label =
            key === "home" ? `${teams.home.name} win`
            : key === "away" ? `${teams.away.name} win`
            : "Draw";
          const logo = isDraw ? null : getOutcomeTeamLogo("1x2", key, teams);
          const accent =
            key === "home" ? colors.neonCyan
            : key === "away" ? colors.neonMagenta
            : colors.textSecondary;

          return (
            <button
              key={market.marketId}
              className={`flex w-full items-center justify-between gap-2 px-3 py-3 text-left transition-all sm:gap-4 sm:px-4 sm:py-3.5 ${
                isSelected ?
                  "bg-cyan-400/10 border-l-2 border-l-cyan-400"
                : "hover:bg-default-100/40"
              }`}
              type="button"
              onClick={() => onSelectMarket(market.marketId, 0)}
            >
              <span className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                {isDraw ?
                  <DrawOutcomeIcon className="shrink-0" size="sm" />
                : logo ?
                  <TeamLogo
                    className="shrink-0"
                    name={label}
                    size="sm"
                    src={logo}
                  />
                : null}
                <span
                  className={`min-w-0 truncate text-sm ${isSelected ? "font-semibold text-cyan-300" : "font-medium"}`}
                >
                  {label}
                </span>
              </span>
              <span
                className="text-base font-bold tabular-nums shrink-0 sm:text-lg"
                style={{ color: isSelected ? accent : undefined }}
              >
                {pct}%
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-center text-xs text-default-400">
        {volumeLabel} Vol.
      </p>
    </div>
  );
}
