"use client";

import { Tabs, Tab } from "@heroui/tabs";

import { ActivityFeed } from "./ActivityFeed";
import { TopHoldersView } from "./TopHoldersView";
import { PositionsView } from "./PositionsView";
import { marketDetailTabClassNames } from "../marketDetailTabStyles";
import { BookmakerOddsTab } from "@/features/football/components/BookmakerOddsTab";

interface MarketDetailTabsProps {
  marketId: string;
  outcomes: string[];
  tickSize: string;
  yesPrice: number;
  noPrice: number;
  /** When set on fixture pages, shows a bookmaker reference odds tab. */
  groupTags?: string[];
}

export function MarketDetailTabs({
  marketId,
  outcomes,
  tickSize,
  yesPrice,
  noPrice,
  groupTags,
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
      {groupTags && (
        <Tab key="bookmaker-odds" title="Bookmaker odds">
          <BookmakerOddsTab groupTags={groupTags} />
        </Tab>
      )}
    </Tabs>
  );
}
