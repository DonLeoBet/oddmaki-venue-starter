"use client";

import { Tabs, Tab } from "@heroui/tabs";

import { ActivityFeed } from "./ActivityFeed";
import { TopHoldersView } from "./TopHoldersView";
import { PositionsView } from "./PositionsView";
import { marketDetailTabClassNames } from "../marketDetailTabStyles";

interface MarketDetailTabsProps {
  marketId: string;
  outcomes: string[];
  tickSize: string;
  yesPrice: number;
  noPrice: number;
}

export function MarketDetailTabs({
  marketId,
  outcomes,
  tickSize,
  yesPrice,
  noPrice,
}: MarketDetailTabsProps) {
  return (
    <Tabs
      aria-label="Market detail tabs"
      classNames={marketDetailTabClassNames}
      variant="underlined"
    >
      <Tab key="activity" title="Activity">
        <ActivityFeed
          marketId={marketId}
          outcomes={outcomes}
          tickSize={tickSize}
        />
      </Tab>
      <Tab key="holders" title="Top Holders">
        <TopHoldersView marketId={marketId} outcomes={outcomes} />
      </Tab>
      <Tab key="positions" title="Positions">
        <PositionsView
          marketId={marketId}
          noPrice={noPrice}
          outcomes={outcomes}
          yesPrice={yesPrice}
        />
      </Tab>
    </Tabs>
  );
}
