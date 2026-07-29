"use client";

import type { DpmMarketSummary } from "../types";

import { useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";

import { dpmPhase } from "../types";
import { useDpmTrade } from "../hooks/useDpmTrade";
import { useDpmPositions } from "../hooks/useDpmPositions";

import { TransactionFlowModal } from "@/lib/oddmaki/TransactionFlowModal";
import { useTokenBalance } from "@/features/wallet";

const AMOUNT_DELTAS = [1, 5, 10, 100];

const AMOUNT_INPUT_CLASS =
  "bg-transparent text-lg font-semibold text-foreground outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

/** Implied chance for an outcome = its share of the pool's collateral. */
function impliedPct(data: DpmMarketSummary, i: number): number {
  const total = Number(data.totalCollateral ?? "0");

  if (!(total > 0)) return Math.round(100 / Math.max(1, data.outcomes.length));
  const c = Number(data.outcomes[i] ? data.outcomes[i].collateral : "0");

  return Math.max(0, Math.min(100, Math.round((c / total) * 100)));
}

interface DpmTradingPanelProps {
  marketId: string;
  data: DpmMarketSummary;
  outcomes: string[];
}

export function DpmTradingPanel({
  marketId,
  data,
  outcomes,
}: DpmTradingPanelProps) {
  const { address } = useAccount();
  const { formatted: walletBalance } = useTokenBalance();
  const { enter, joinLobby, leaveLobby, claim, flow } = useDpmTrade(marketId);
  const { data: positions } = useDpmPositions(marketId);

  const phase = useMemo(() => dpmPhase(data), [data]);

  // A claim is only meaningful for a wallet that holds an unclaimed position.
  const canClaim = useMemo(() => {
    if (!address || !positions) return false;

    return positions.some(
      (p) =>
        p.trader.address.toLowerCase() === address.toLowerCase() &&
        Number(p.shares) > 0 &&
        !p.claimed,
    );
  }, [address, positions]);
  const labels = useMemo(
    () =>
      data.outcomes.map(
        (o, i) => outcomes[i] ?? o.label ?? `Outcome ${o.outcomeIndex}`,
      ),
    [data.outcomes, outcomes],
  );

  const [outcome, setOutcome] = useState(0);
  const [amount, setAmount] = useState("");
  const [flowOpen, setFlowOpen] = useState(false);

  const amountValid = useMemo(() => {
    const n = Number(amount);

    return Number.isFinite(n) && n > 0;
  }, [amount]);

  const busy = flow.isRunning;
  const sideColor: "primary" | "secondary" =
    outcome === 0 ? "primary" : "secondary";

  const run = (fn: () => Promise<void>) => {
    setFlowOpen(true);
    void fn();
  };

  const handleFlowClose = () => {
    setFlowOpen(false);
    flow.reset();
    if (flow.isComplete) setAmount("");
  };

  const outcomeSelector = (
    <div className="flex gap-1">
      {labels.map((label, i) => (
        <Button
          key={i}
          className="flex-1"
          color={
            outcome === i ? (i === 0 ? "primary" : "secondary") : "default"
          }
          size="sm"
          variant={outcome === i ? "solid" : "flat"}
          onPress={() => setOutcome(i)}
        >
          {label} {impliedPct(data, i)}%
        </Button>
      ))}
    </div>
  );

  const amountField = (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-sm text-default-500">Amount</span>
          <span className="text-xs text-default-400">
            ${walletBalance} cash
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          <span className="text-lg font-semibold text-foreground">$</span>
          <input
            className={AMOUNT_INPUT_CLASS}
            min="0"
            placeholder="0"
            step="1"
            style={{ width: `${Math.max(1, amount.length || 1)}ch` }}
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
      </div>
      <div className="flex gap-1">
        {AMOUNT_DELTAS.map((d) => (
          <Button
            key={d}
            className="min-w-0 h-6 px-2 bg-default-100 text-xs flex-1"
            size="sm"
            variant="flat"
            onPress={() => setAmount(String((parseFloat(amount) || 0) + d))}
          >
            +${d}
          </Button>
        ))}
        <Button
          className="min-w-0 h-6 px-2 bg-default-100 text-xs flex-1"
          isDisabled={!address}
          size="sm"
          variant="flat"
          onPress={() => setAmount(walletBalance)}
        >
          Max
        </Button>
      </div>
    </div>
  );

  return (
    <Card>
      <CardBody className="gap-3">
        {!address ? (
          <p className="text-sm text-default-500">
            Connect a wallet to take part in this pool.
          </p>
        ) : phase === "lobby" ? (
          <>
            {outcomeSelector}
            {amountField}
            <div className="flex gap-2">
              <Button
                className="flex-1"
                color={sideColor}
                isDisabled={!amountValid || busy}
                isLoading={busy}
                onPress={() => run(() => joinLobby(outcome, amount))}
              >
                Add deposit
              </Button>
              <Button
                className="flex-1"
                isDisabled={!amountValid || busy}
                variant="bordered"
                onPress={() => run(() => leaveLobby(outcome, amount))}
              >
                Withdraw
              </Button>
            </div>
          </>
        ) : phase === "open" ? (
          <>
            {outcomeSelector}
            {amountField}
            <Button
              className="w-full"
              color={sideColor}
              isDisabled={!amountValid || busy}
              isLoading={busy}
              onPress={() => run(() => enter(outcome, amount))}
            >
              Buy {labels[outcome]}
            </Button>
          </>
        ) : phase === "resolved" ? (
          canClaim ? (
            <>
              <p className="text-xs text-default-500">
                This market has resolved. Claim your share of the pool.
              </p>
              <Button
                className="w-full"
                color="primary"
                isDisabled={busy}
                isLoading={busy}
                onPress={() => run(() => claim())}
              >
                Claim payout
              </Button>
            </>
          ) : (
            <p className="text-sm text-default-500">
              This market has resolved.
            </p>
          )
        ) : (
          <p className="text-sm text-default-500">
            Trading is closed. Awaiting resolution.
          </p>
        )}
      </CardBody>

      <TransactionFlowModal
        hasError={flow.hasError}
        isComplete={flow.isComplete}
        isOpen={flowOpen}
        isRunning={flow.isRunning}
        stepStates={flow.stepStates}
        title="Pool"
        onClose={handleFlowClose}
        onRetry={flow.retry}
      />
    </Card>
  );
}
