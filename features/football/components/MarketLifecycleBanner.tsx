"use client";

import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";

import type { ResolutionPhase } from "@/features/resolution/hooks/useMarketStatus";
import { useMatchFootballContext } from "@/features/football/hooks/useMatchFootballContext";
import { kickoffUnixFromTags } from "@/lib/football/kickoff-display";
import { classifyFixtureStatus } from "@/lib/football/fixture-lifecycle";
import {
  fixtureIdFromTag,
  isFixtureTag,
} from "@/lib/football/map-fixture-to-market-group";
import {
  PUBLIC_LIFECYCLE_LABELS,
  type PublicMarketLifecycleState,
  MATCH_RESOLUTION_COPY,
} from "@/config/resolution.config";

function fixtureIdFromTags(tags: string[] | undefined): number | null {
  if (!tags) return null;

  for (const tag of tags) {
    if (!isFixtureTag(tag)) continue;

    return fixtureIdFromTag(tag);
  }

  return null;
}

/** Map fixture + UMA phase → the five public states only. */
export function derivePublicLifecycleState(params: {
  fixtureStatus: string | null;
  kickoffUnix: number | null;
  resolutionPhase?: ResolutionPhase;
  marketResolved?: boolean;
}): PublicMarketLifecycleState {
  if (params.marketResolved || params.resolutionPhase === "RESOLVED") {
    return "resolved";
  }

  if (params.resolutionPhase === "ASSERTION_PENDING") {
    return "challenged";
  }

  if (
    params.resolutionPhase === "ASSERTION_EXPIRED" ||
    params.resolutionPhase === "SETTLED_NOT_REPORTED"
  ) {
    return "pending";
  }

  const kind = classifyFixtureStatus(params.fixtureStatus);

  if (kind === "finished" || kind === "void") return "closed";

  // Live / upcoming / unknown with no assertion → still Active (trading open).
  return "active";
}

const STATE_COPY: Record<
  PublicMarketLifecycleState,
  {
    color: "success" | "warning" | "primary" | "default" | "secondary";
    body: string;
  }
> = {
  active: {
    color: "success",
    body: "Trading is open. Closes automatically when the match is finished.",
  },
  closed: {
    color: "default",
    body: `Trading closed. Official result is proposed after full time (usually within ${MATCH_RESOLUTION_COPY.typicalProposal}), then a ${MATCH_RESOLUTION_COPY.challengeWindow} challenge window.`,
  },
  challenged: {
    color: "secondary",
    body: `Result proposed — ${MATCH_RESOLUTION_COPY.challengeWindow} challenge window. Anyone can dispute with a matching bond.`,
  },
  pending: {
    color: "primary",
    body: "Challenge window ended. Settlement/finalization runs automatically.",
  },
  resolved: {
    color: "success",
    body: "Market resolved. Winners can redeem.",
  },
};

interface MarketLifecycleBannerProps {
  groupTags: string[] | undefined;
  resolutionPhase?: ResolutionPhase;
  marketResolved?: boolean;
}

/** Single clear lifecycle chip — Active / Closed / In challenge / Pending / Resolved. */
export function MarketLifecycleBanner({
  groupTags,
  resolutionPhase,
  marketResolved,
}: MarketLifecycleBannerProps) {
  const kickoffUnix = kickoffUnixFromTags(groupTags ?? []);
  const hasFixture = fixtureIdFromTags(groupTags) != null;
  const { data } = useMatchFootballContext(hasFixture ? groupTags : undefined);

  if (!kickoffUnix && !hasFixture && !resolutionPhase && !marketResolved) {
    return null;
  }

  const state = derivePublicLifecycleState({
    fixtureStatus: data?.fixtureStatus ?? null,
    kickoffUnix,
    resolutionPhase,
    marketResolved,
  });

  const copy = STATE_COPY[state];

  return (
    <Card className="border border-default-100/40 bg-default-50/10">
      <CardBody className="flex flex-row items-start gap-3 py-3">
        <Chip color={copy.color} size="sm" variant="flat">
          {PUBLIC_LIFECYCLE_LABELS[state]}
        </Chip>
        <p className="text-xs leading-relaxed text-default-500">{copy.body}</p>
      </CardBody>
    </Card>
  );
}
