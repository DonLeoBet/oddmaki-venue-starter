"use client";

import { Tabs, Tab } from "@heroui/tabs";

import { ActivityFeed } from "./ActivityFeed";
import { TopHoldersView } from "./TopHoldersView";
import { PositionsView } from "./PositionsView";

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
      classNames={{
        base: "w-full",
        tabList: "p-0 gap-6 w-full bg-transparent rounded-none",
        tab: "px-0 h-auto py-1 w-fit",
        cursor: "hidden",
        tabContent:
          "text-default-500 group-data-[selected=true]:text-foreground font-semibold text-base",
        panel: "pt-6 px-0",
      }}
      variant="light"
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
