"use client";

import type { DpmMarketSummary } from "../types";

import { useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";

import { useDpmTrade } from "../hooks/useDpmTrade";
import { useDpmPositions } from "../hooks/useDpmPositions";
import { currentPayoutUsd } from "../lib/pricing";
import { formatUsd } from "../lib/format";

import { TransactionFlowModal } from "@/lib/oddmaki/TransactionFlowModal";

interface DpmClaimPanelProps {
  marketId: string;
  data: DpmMarketSummary;
  outcomes: string[];
}

/**
 * The DPM equivalent of the CLOB RedeemPanel: on a resolved pool it shows the
 * winning outcome and the connected wallet's claimable amount, with a Claim
 * action. Invalid / no-contest markets refund every entry instead.
 */
export function DpmClaimPanel({
  marketId,
  data,
  outcomes,
}: DpmClaimPanelProps) {
  const { address } = useAccount();
  const { claim, flow } = useDpmTrade(marketId);
  const { data: positions } = useDpmPositions(marketId);
  const [flowOpen, setFlowOpen] = useState(false);

  const winningIdx = data.winningOutcome;
  const isInvalid = winningIdx == null;
  const labelFor = (i: number) =>
    outcomes[i] ?? data.outcomes[i]?.label ?? `Outcome ${i}`;

  const { hasClaim, claimable, claimed, claimedAmount } = useMemo(() => {
    const none = {
      hasClaim: false,
      claimable: 0,
      claimed: false,
      claimedAmount: 0,
    };

    if (!address || !positions) return none;

    const mine = positions.filter(
      (p) => p.trader.address.toLowerCase() === address.toLowerCase(),
    );

    if (mine.length === 0) return none;

    if (isInvalid) {
      // No winner: every entry is refunded (net collateral + untransitioned intent).
      const refundable = mine.filter(
        (p) => Number(p.shares) > 0 || Number(p.intentStake) > 0,
      );

      if (refundable.length === 0) return none;

      return {
        hasClaim: true,
        claimable: refundable.reduce(
          (a, p) => a + (Number(p.collateralIn) + Number(p.intentStake)) / 1e6,
          0,
        ),
        claimed: refundable.every((p) => p.claimed),
        claimedAmount:
          refundable.reduce((a, p) => a + Number(p.payout), 0) / 1e6,
      };
    }

    const win = mine.find(
      (p) => Number(p.outcomeIndex) === winningIdx && Number(p.shares) > 0,
    );

    if (!win) return none;

    return {
      hasClaim: true,
      claimable: currentPayoutUsd(
        data.outcomes,
        winningIdx,
        win.shares,
        win.collateralIn,
      ),
      claimed: win.claimed,
      claimedAmount: Number(win.payout) / 1e6,
    };
  }, [address, positions, isInvalid, winningIdx, data.outcomes]);

  const busy = flow.isRunning;
  const runClaim = () => {
    setFlowOpen(true);
    void claim();
  };
  const handleClose = () => {
    setFlowOpen(false);
    flow.reset();
  };

  return (
    <Card>
      <CardHeader className="pb-0">
        <h2 className="text-lg font-semibold">
          {isInvalid ? "Claim refund" : "Claim winnings"}
        </h2>
      </CardHeader>
      <CardBody className="gap-3 pt-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-default-500">
            {isInvalid ? "Result" : "Winning outcome"}
          </span>
          <Chip color={isInvalid ? "default" : "primary"} size="sm">
            {isInvalid ? "Invalid" : labelFor(winningIdx)}
          </Chip>
        </div>

        {hasClaim && !claimed ? (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm text-default-500">You receive</span>
              <span className="text-sm font-semibold text-foreground">
                {formatUsd(claimable)}
              </span>
            </div>
            <Button
              className="w-full"
              color="primary"
              isDisabled={busy}
              isLoading={busy}
              onPress={runClaim}
            >
              Claim {formatUsd(claimable)}
            </Button>
          </>
        ) : claimed ? (
          <p className="text-sm text-default-500">
            You claimed {formatUsd(claimedAmount)}.
          </p>
        ) : (
          <p className="text-sm text-default-500">
            {isInvalid
              ? "You have nothing to refund in this pool."
              : "You have no winnings to claim in this pool."}
          </p>
        )}
      </CardBody>

      <TransactionFlowModal
        hasError={flow.hasError}
        isComplete={flow.isComplete}
        isOpen={flowOpen}
        isRunning={flow.isRunning}
        stepStates={flow.stepStates}
        title="Claim"
        onClose={handleClose}
        onRetry={flow.retry}
      />
    </Card>
  );
}
