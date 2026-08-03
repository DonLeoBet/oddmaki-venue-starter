"use client";

import { useState } from "react";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Skeleton } from "@heroui/skeleton";
import { useAccount } from "wagmi";

import { MATCH_RESOLUTION_COPY, PUBLIC_LIFECYCLE_LABELS } from "@/config/resolution.config";
import { derivePublicLifecycleState } from "@/features/football/components/MarketLifecycleBanner";
import { useMatchFootballContext } from "@/features/football/hooks/useMatchFootballContext";
import { kickoffUnixFromTags } from "@/lib/football/kickoff-display";
import {
  fixtureIdFromTag,
  isFixtureTag,
} from "@/lib/football/map-fixture-to-market-group";

import { useMarketStatus } from "../hooks/useMarketStatus";
import { useSettleAssertion } from "../hooks/useSettleAssertion";
import { useReportResolution } from "../hooks/useReportResolution";
import { useDisputeAssertion } from "../hooks/useDisputeAssertion";

import { AssertOutcomeForm } from "./AssertOutcomeForm";

interface ResolutionPanelProps {
  marketId: string;
  outcomes: string[];
  title?: string;
  description?: string;
  /** When true, renders content without Card wrapper (for embedding in Accordion, etc.) */
  bare?: boolean;
  /** Show full UMA assert/settle tooling (operators / advanced). Default: compact status. */
  advanced?: boolean;
  /** Fixture tags — used to map Active vs Closed before an assertion exists. */
  groupTags?: string[];
}

function formatCountdown(expirationTime: number): string {
  const now = Math.floor(Date.now() / 1000);
  const remaining = expirationTime - now;

  if (remaining <= 0) return "Expired";
  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);

  if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;

  return `${minutes}m`;
}

function formatBondUSDC(bond: bigint): string {
  return (Number(bond) / 1e6).toFixed(2);
}

function fixtureIdFromTags(tags: string[] | undefined): number | null {
  if (!tags) return null;

  for (const tag of tags) {
    if (!isFixtureTag(tag)) continue;

    return fixtureIdFromTag(tag);
  }

  return null;
}

export function ResolutionPanel({
  marketId,
  outcomes,
  title = "Status",
  description,
  bare = false,
  advanced = false,
  groupTags,
}: ResolutionPanelProps) {
  const { isConnected } = useAccount();
  const { data: status, isLoading } = useMarketStatus(marketId);
  const { settleAssertion, isLoading: isSettling } =
    useSettleAssertion(marketId);
  const { reportResolution, isLoading: isReporting } =
    useReportResolution(marketId);
  const { disputeAssertion, isLoading: isDisputing } =
    useDisputeAssertion(marketId);
  const [showAdvanced, setShowAdvanced] = useState(advanced);

  const hasFixture = fixtureIdFromTags(groupTags) != null;
  const { data: football } = useMatchFootballContext(
    hasFixture ? groupTags : undefined,
  );

  const isDisputed = status?.assertionDetails?.isDisputed ?? false;
  const disputeBond = status?.assertionDetails?.bond;

  const publicState = derivePublicLifecycleState({
    fixtureStatus: football?.fixtureStatus ?? null,
    kickoffUnix: kickoffUnixFromTags(groupTags ?? []),
    resolutionPhase: status?.phase,
    marketResolved: status?.phase === "RESOLVED",
  });

  const statusColor =
    publicState === "resolved" ? "success"
    : publicState === "challenged" ? "secondary"
    : publicState === "pending" ? "primary"
    : publicState === "closed" ? "default"
    : "success";

  const body =
    isLoading || !status ? (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-3/4 rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    ) : (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <Chip color={statusColor} size="sm" variant="flat">
            {PUBLIC_LIFECYCLE_LABELS[publicState]}
          </Chip>
          {publicState === "challenged" &&
            status.assertionDetails &&
            !isDisputed && (
              <span className="text-xs text-default-400">
                Ends {formatCountdown(status.assertionDetails.expirationTime)}
              </span>
            )}
        </div>

        {publicState === "active" && (
          <p className="text-xs text-default-500 leading-relaxed">
            Trading is open. Closes when the match is finished; result follows
            automatically (usually within {MATCH_RESOLUTION_COPY.typicalProposal}
            ), then a {MATCH_RESOLUTION_COPY.challengeWindow} challenge window.
          </p>
        )}

        {publicState === "closed" && (
          <p className="text-xs text-default-500 leading-relaxed">
            Trading closed. Waiting for the official result proposal.
          </p>
        )}

        {publicState === "challenged" && !isDisputed && (
          <p className="text-xs text-default-500 leading-relaxed">
            Result proposed. Anyone can dispute during the challenge window by
            posting a matching bond.
          </p>
        )}

        {publicState === "challenged" && isDisputed && (
          <p className="text-xs text-default-500 leading-relaxed">
            Disputed — escalated to UMA DVM (typically ~48h). Continues to
            Pending once voting finishes.
          </p>
        )}

        {publicState === "pending" && (
          <p className="text-xs text-default-500 leading-relaxed">
            Challenge window complete. Settlement runs automatically; you can
            also finalize manually below if needed.
          </p>
        )}

        {publicState === "resolved" && (
          <p className="text-xs text-default-500 leading-relaxed">
            Market resolved. Use redeem to claim winnings.
          </p>
        )}

        {publicState === "challenged" &&
          !isDisputed &&
          status.assertionDetails && (
            <Button
              className="w-full"
              color="secondary"
              isDisabled={!isConnected || !status.assertion.assertionId}
              isLoading={isDisputing}
              size="sm"
              variant="flat"
              onPress={() => {
                if (status.assertion.assertionId) {
                  disputeAssertion(status.assertion.assertionId);
                }
              }}
            >
              {!isConnected
                ? "Connect to dispute"
                : disputeBond
                  ? `Dispute ($${formatBondUSDC(disputeBond)})`
                  : "Dispute"}
            </Button>
          )}

        {publicState === "pending" && (
          <div className="flex flex-col gap-2">
            {status.phase === "ASSERTION_EXPIRED" && (
              <Button
                className="w-full"
                color="primary"
                isDisabled={!isConnected || !status.assertion.assertionId}
                isLoading={isSettling}
                size="sm"
                onPress={() => {
                  if (status.assertion.assertionId) {
                    settleAssertion(status.assertion.assertionId);
                  }
                }}
              >
                {!isConnected ? "Connect wallet" : "Settle"}
              </Button>
            )}
            {status.phase === "SETTLED_NOT_REPORTED" && (
              <Button
                className="w-full"
                color="primary"
                isDisabled={!isConnected || !status.assertion.outcome}
                isLoading={isReporting}
                size="sm"
                onPress={() => {
                  if (status.assertion.outcome) {
                    reportResolution(status.assertion.outcome);
                  }
                }}
              >
                {!isConnected ? "Connect wallet" : "Finalize"}
              </Button>
            )}
          </div>
        )}

        {(publicState === "active" || publicState === "closed") && (
          <>
            <button
              className="self-start text-[11px] text-default-400 underline-offset-2 hover:underline"
              type="button"
              onClick={() => setShowAdvanced((value) => !value)}
            >
              {showAdvanced ? "Hide manual tools" : "Advanced / manual resolve"}
            </button>
            {showAdvanced && (
              <AssertOutcomeForm
                liveness={status.question.liveness}
                marketId={marketId}
                outcomes={outcomes}
                requiredBond={status.question.requiredBond}
              />
            )}
          </>
        )}
      </div>
    );

  if (bare) {
    return (
      <div className="flex flex-col gap-2">
        {description && (
          <p className="text-sm text-default-400">{description}</p>
        )}
        {body}
      </div>
    );
  }

  return (
    <Card className="border border-default-100/40">
      <CardHeader className="flex-col items-start pb-1">
        <h2 className="text-base font-semibold">{title}</h2>
        {description && (
          <p className="text-sm text-default-400 mt-1">{description}</p>
        )}
      </CardHeader>
      <CardBody className="pt-2">{body}</CardBody>
    </Card>
  );
}
