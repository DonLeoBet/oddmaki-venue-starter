"use client";

import type { DpmMarketSummary } from "../types";

import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";

import { dpmPhase } from "../types";
import { formatUsdc } from "../lib/format";
import { currentMultiple } from "../lib/pricing";

import { colors } from "@/lib/tokens";

interface DpmMarketInfoProps {
  data: DpmMarketSummary;
  outcomes?: string[];
}

const PHASE_LABEL: Record<string, string> = {
  lobby: "Lobby",
  open: "Open",
  closed: "Closed",
  resolved: "Resolved",
};

const PHASE_COLOR: Record<
  string,
  "default" | "success" | "warning" | "primary"
> = {
  lobby: "default",
  open: "success",
  closed: "warning",
  resolved: "primary",
};

const fmtMultiple = (m: number | null): string =>
  m == null ? "—" : m >= 99 ? "99×+" : `${m.toFixed(m >= 10 ? 0 : 1)}×`;

// Outcome 0 / 1 reuse the brand colors of the trade buttons and odds chart.
const dotColor = (i: number): string =>
  i === 0 ? colors.neonCyan : i === 1 ? colors.neonMagenta : "#a1a1aa";
const nameClass = (i: number): string =>
  i === 0 ? "text-primary" : i === 1 ? "text-secondary" : "text-foreground";

export function DpmMarketInfo({ data, outcomes }: DpmMarketInfoProps) {
  const phase = dpmPhase(data);
  const totalCollateral = (() => {
    try {
      return BigInt(data.totalCollateral || "0");
    } catch {
      return BigInt(0);
    }
  })();

  const labelFor = (idx: number) =>
    outcomes?.[idx] ?? data.outcomes[idx]?.label ?? `Outcome ${idx}`;

  return (
    <Card>
      <CardHeader className="flex items-center gap-2 pb-0">
        <h2 className="text-lg font-semibold">Pool</h2>
        <Chip color={PHASE_COLOR[phase]} size="sm" variant="flat">
          {PHASE_LABEL[phase]}
        </Chip>
      </CardHeader>
      <CardBody className="pt-3">
        <div className="grid grid-cols-[1fr_auto_auto_auto] items-baseline gap-x-5 gap-y-3">
          {data.outcomes.map((o, i) => {
            let collateral = BigInt(0);

            try {
              collateral = BigInt(o.collateral || "0");
            } catch {
              collateral = BigInt(0);
            }

            const impliedPct =
              totalCollateral > BigInt(0)
                ? Number((collateral * BigInt(10000)) / totalCollateral) / 100
                : 0;
            const isWinner = data.resolved && o.isWinner;

            return (
              <OutcomeRow
                key={i}
                chance={`${impliedPct.toFixed(1)}%`}
                dot={dotColor(i)}
                isWinner={!!isWinner}
                label={labelFor(i)}
                money={formatUsdc(o.collateral)}
                nameClass={nameClass(i)}
                ret={fmtMultiple(currentMultiple(data.outcomes, i))}
              />
            );
          })}

          {/* Volume total — money aligns under the outcome amounts. */}
          <span className="col-span-4 mt-1 border-t border-default-100" />
          <span className="text-sm text-default-500">Volume</span>
          <span />
          <span />
          <span className="text-right text-sm font-semibold text-foreground">
            {formatUsdc(data.totalCollateral)}
          </span>
        </div>

        {data.resolved && data.winningOutcome !== null ? (
          <div className="mt-3 flex items-center justify-between border-t border-default-200 pt-2">
            <span className="text-sm text-default-500">Winning outcome</span>
            <Chip color="primary" size="sm">
              {labelFor(data.winningOutcome)}
            </Chip>
          </div>
        ) : null}
      </CardBody>
    </Card>
  );
}

/** One outcome, emitted as four grid cells (name, chance, return, money). */
function OutcomeRow({
  label,
  nameClass: nameCls,
  dot,
  chance,
  ret,
  money,
  isWinner,
}: {
  label: string;
  nameClass: string;
  dot: string;
  chance: string;
  ret: string;
  money: string;
  isWinner: boolean;
}) {
  return (
    <>
      <span className="flex items-center gap-2">
        <span
          className="inline-block h-2 w-2 flex-shrink-0 rounded-full"
          style={{ backgroundColor: dot }}
        />
        <span className={`text-base font-medium ${nameCls}`}>{label}</span>
        {isWinner ? (
          <span className="text-xs font-semibold text-default-400">won</span>
        ) : null}
      </span>
      <span className="text-right text-sm font-semibold text-foreground">
        {chance}
      </span>
      <span className="text-right text-sm text-default-500">{ret}</span>
      <span className="text-right text-sm font-semibold text-foreground">
        {money}
      </span>
    </>
  );
}
