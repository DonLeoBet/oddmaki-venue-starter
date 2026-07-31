"use client";

import type { GroupMarketDetail } from "../hooks/useGroupMarkets";

import { Card, CardBody, CardHeader } from "@heroui/card";

import { useBrand } from "@/features/brand";
import {
  groupMarketsBySection,
  categorizeGroupMarket,
} from "../utils/marketSections";

interface MatchMarketsDebugPanelProps {
  markets: GroupMarketDetail[];
  groupTags: string[];
}

export function MatchMarketsDebugPanel({
  markets,
  groupTags,
}: MatchMarketsDebugPanelProps) {
  const { brandId, locale, brandName } = useBrand();
  const sections = groupMarketsBySection(markets, {
    brandId,
    locale,
    forMatchDetail: true,
  });

  return (
    <Card className="border border-warning/40 bg-warning/5">
      <CardHeader>
        <h2 className="text-sm font-semibold text-warning">
          Dev debug — match markets ({brandName} / {locale})
        </h2>
      </CardHeader>
      <CardBody className="gap-4 text-xs font-mono">
        <div>
          <p className="text-default-500 mb-1">Group tags</p>
          <pre className="whitespace-pre-wrap break-all">
            {JSON.stringify(groupTags, null, 2)}
          </pre>
        </div>

        <div>
          <p className="text-default-500 mb-1">
            Raw markets ({markets.length})
          </p>
          <pre className="whitespace-pre-wrap break-all max-h-48 overflow-auto">
            {JSON.stringify(
              markets.map((market) => ({
                marketId: market.marketId,
                name: market.name,
                marketType: market.marketType,
                outcomeKey: market.outcomeKey,
                section: categorizeGroupMarket(market),
                status: market.status,
              })),
              null,
              2,
            )}
          </pre>
        </div>

        <div>
          <p className="text-default-500 mb-1">
            Grouped sections ({sections.length})
          </p>
          <pre className="whitespace-pre-wrap break-all max-h-48 overflow-auto">
            {JSON.stringify(
              sections.map((section) => ({
                id: section.id,
                label: section.label,
                markets: section.markets.map((market) => ({
                  marketId: market.marketId,
                  name: market.name,
                  marketType: market.marketType,
                  outcomeKey: market.outcomeKey,
                })),
              })),
              null,
              2,
            )}
          </pre>
        </div>
      </CardBody>
    </Card>
  );
}
