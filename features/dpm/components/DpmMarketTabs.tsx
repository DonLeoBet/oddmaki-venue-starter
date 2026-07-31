"use client";

import type { DpmMarketSummary } from "../types";

import { Card, CardBody } from "@heroui/card";
import { Tabs, Tab } from "@heroui/tabs";

import { DpmActivity } from "./DpmActivity";
import { DpmTopHolders } from "./DpmTopHolders";
import { DpmYourPosition } from "./DpmYourPosition";
import { marketDetailTabClassNames } from "@/features/market-detail/marketDetailTabStyles";

interface DpmMarketTabsProps {
  marketId: string;
  data: DpmMarketSummary;
  outcomes: string[];
}

/** Activity / Top Holders for a pool (your own position is pinned above). */
export function DpmMarketTabs({
  marketId,
  data,
  outcomes,
}: DpmMarketTabsProps) {
  return (
    <Card>
      <CardBody>
        <DpmYourPosition data={data} marketId={marketId} outcomes={outcomes} />
        <Tabs
          aria-label="Pool detail tabs"
          classNames={marketDetailTabClassNames}
          variant="underlined"
        >
          <Tab key="activity" title="Activity">
            <DpmActivity bare marketId={marketId} />
          </Tab>
          <Tab key="holders" title="Top Holders">
            <DpmTopHolders
              data={data}
              marketId={marketId}
              outcomes={outcomes}
            />
          </Tab>
        </Tabs>
      </CardBody>
    </Card>
  );
}
