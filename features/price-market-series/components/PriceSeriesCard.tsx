"use client";

import type { FormattedPriceMarketSeries } from "../types";

import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import NextLink from "next/link";

import { MarketImage } from "@/features/markets/components/MarketImage";
import { MarketProgress } from "@/features/markets/components/MarketProgress";

interface PriceSeriesCardProps {
  series: FormattedPriceMarketSeries;
  /**
   * The series' current live/next window, derived client-side (the subgraph no
   * longer denormalizes it). Falls back to `series.currentMarket` for safety.
   */
  currentWindow?: FormattedPriceMarketSeries["currentMarket"];
}

export function PriceSeriesCard({
  series,
  currentWindow,
}: PriceSeriesCardProps) {
  const current = currentWindow ?? series.currentMarket;

  // No live/next window yet (all resolved, or windows still loading) — skip.
  if (!current) return null;

  const chancePercentage = Math.round(current.yesPrice);
  const href = `/market/${current.marketId}`;

  // The current market is "live" only while now is within its trading window.
  // Just after a window closes (resolution lagging) it can still be the current
  // market without being tradeable, so don't claim LIVE in that gap.
  const nowSec = Math.floor(Date.now() / 1000);
  const openSec = Number(current.openTime);
  const closeSec = Number(current.closeTime);
  const isLive =
    Number.isFinite(openSec) &&
    Number.isFinite(closeSec) &&
    nowSec >= openSec &&
    nowSec < closeSec;

  return (
    <NextLink className="block" href={href}>
      <Card className="w-full h-[180px] hover:scale-[1.02] transition-transform cursor-pointer">
        <CardHeader className="flex flex-col items-start gap-2 pb-0 flex-1">
          <div className="flex justify-between w-full items-start gap-3">
            <div className="flex items-start gap-2 flex-1">
              <MarketImage
                metadataURI={current.metadataURI ?? ""}
                name={series.title}
                size="sm"
              />
              <h3 className="text-sm font-semibold flex-1 line-clamp-3 text-pretty min-w-0">
                {series.title}
              </h3>
            </div>
            <MarketProgress
              className="flex-shrink-0 -mt-1"
              percentage={chancePercentage}
            />
          </div>
        </CardHeader>

        <CardBody className="gap-2 py-2 flex-shrink-0 flex-grow-0">
          <div className="flex gap-2">
            <div className="flex-1 rounded-lg bg-primary/10 py-2.5 text-center text-sm font-semibold text-primary">
              {current.outcomes[0] || "Up"} {Math.round(current.yesPrice)}¢
            </div>
            <div className="flex-1 rounded-lg bg-secondary/10 py-2.5 text-center text-sm font-semibold text-secondary">
              {current.outcomes[1] || "Down"} {Math.round(current.noPrice)}¢
            </div>
          </div>
        </CardBody>

        <CardFooter className="flex flex-col gap-1 pt-0 flex-shrink-0">
          <div className="flex justify-between w-full text-xs text-default-400">
            <span className="flex items-center gap-1.5">
              {isLive ? (
                <>
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-danger animate-pulse" />
                  LIVE
                </>
              ) : nowSec < openSec ? (
                <>
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-default-300" />
                  UPCOMING
                </>
              ) : (
                <>
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-warning" />
                  PENDING
                </>
              )}
            </span>
            <span className="text-default-400 uppercase">
              {series.interval}
            </span>
          </div>
        </CardFooter>
      </Card>
    </NextLink>
  );
}
