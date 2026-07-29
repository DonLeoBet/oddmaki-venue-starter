"use client";

import { Card, CardBody } from "@heroui/card";

import { DpmProbabilityChart } from "./DpmProbabilityChart";

interface DpmOddsChartProps {
  marketId: string;
  outcomes: string[];
}

/**
 * Standalone implied-odds chart card for UMA Pool markets (which have no asset
 * price chart to tab into). Price pools render DpmProbabilityChart inside the
 * price section's Probability tab instead.
 */
export function DpmOddsChart({ marketId, outcomes }: DpmOddsChartProps) {
  return (
    <Card>
      <CardBody>
        <DpmProbabilityChart marketId={marketId} outcomes={outcomes} />
      </CardBody>
    </Card>
  );
}
