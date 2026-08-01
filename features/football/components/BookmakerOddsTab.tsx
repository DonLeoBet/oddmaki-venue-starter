"use client";

import type { MatchPageContext } from "@/lib/football/match-page-context";

import { Spinner } from "@heroui/spinner";

import { useMatchFootballContext } from "@/features/football/hooks/useMatchFootballContext";
import { colors } from "@/lib/tokens";

function OddsTable({ context }: { context: MatchPageContext }) {
  if (context.bookmakerOdds.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-default-500">
        No bookmaker 1X2 odds available for this fixture yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3 py-2">
      <p className="text-xs text-default-400">
        Reference prices from API-Football bookmakers — not Poly.Football pool odds.
      </p>
      {context.bookmakerOdds.map((row) => (
        <div
          key={row.bookmaker}
          className="rounded-lg border border-default-100/60 px-3 py-2"
        >
          <p className="text-[11px] text-default-400 mb-2">{row.bookmaker}</p>
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div>
              <span className="block text-default-400 text-xs">Home</span>
              <span className="font-semibold tabular-nums" style={{ color: colors.neonCyan }}>
                {row.home ?? "–"}
              </span>
            </div>
            <div>
              <span className="block text-default-400 text-xs">Draw</span>
              <span className="font-semibold tabular-nums">{row.draw ?? "–"}</span>
            </div>
            <div>
              <span className="block text-default-400 text-xs">Away</span>
              <span className="font-semibold tabular-nums" style={{ color: colors.neonMagenta }}>
                {row.away ?? "–"}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function BookmakerOddsTab({
  groupTags,
}: {
  groupTags: string[] | undefined;
}) {
  const { data, isLoading, isError } = useMatchFootballContext(groupTags);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="sm" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <p className="py-6 text-center text-sm text-default-500">
        Could not load bookmaker odds for this match.
      </p>
    );
  }

  return <OddsTable context={data} />;
}
