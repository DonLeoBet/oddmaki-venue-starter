"use client";

import type { DpmMarketSummary } from "../types";

import { Card, CardBody } from "@heroui/card";
import { Tabs, Tab } from "@heroui/tabs";

import { DpmActivity } from "./DpmActivity";
import { DpmTopHolders } from "./DpmTopHolders";
import { DpmYourPosition } from "./DpmYourPosition";

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
          classNames={{
            base: "w-full",
            tabList: "p-0 gap-6 w-full bg-transparent rounded-none",
            tab: "px-0 h-auto py-1 w-fit",
            cursor: "hidden",
            tabContent:
              "text-default-500 group-data-[selected=true]:text-foreground font-semibold text-base",
            panel: "pt-4 px-0",
          }}
          variant="light"
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
