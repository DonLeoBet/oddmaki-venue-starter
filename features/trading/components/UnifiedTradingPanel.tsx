"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type CSSProperties,
} from "react";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import {
  minBuyTickToCross,
  maxSellTickToCross,
  priceToTick,
} from "@oddmaki-protocol/sdk";

import { LimitOrderForm } from "./LimitOrderForm";
import { MarketOrderForm } from "./MarketOrderForm";
import { TradingModeDropdown } from "./TradingModeDropdown";
import { SplitModal } from "./SplitModal";
import { MergeModal } from "./MergeModal";

import { useOrderbookLevels } from "@/features/orderbook/hooks/useOrderbookLevels";
import { useMarketFees } from "@/features/market-detail/hooks/useMarketFees";
import { TeamLogo } from "@/components/football/TeamLogo";
import { MarketImage } from "@/features/markets/components/MarketImage";
import { alpha, colors, shadows } from "@/lib/tokens";

const neonSelectedStyle = (accent: string): CSSProperties => ({
  background: alpha(accent, 0.2),
  color: accent,
  border: `1px solid ${alpha(accent, 0.7)}`,
  boxShadow: shadows.glow(accent),
});

interface UnifiedTradingPanelProps {
  marketId: string;
  outcomes: string[];
  tickSize: string;
  /** Fallback prices (0–100) from subgraph when orderbook is empty */
  yesPrice?: number;
  noPrice?: number;
  /** Group market label, e.g. "1X2 · Ajax" or "Harry Kane" */
  marketLabel?: string;
  metadataURI?: string;
  /** Team crest for team-specific match markets (replaces letter avatar). */
  teamLogoUrl?: string | null;
  initialOutcomeIndex?: 0 | 1;
}

export function UnifiedTradingPanel({
  marketId,
  outcomes,
  tickSize,
  yesPrice,
  noPrice,
  marketLabel,
  metadataURI,
  teamLogoUrl,
  initialOutcomeIndex = 0,
}: UnifiedTradingPanelProps) {
  const [mode, setMode] = useState<"market" | "limit">("limit");
  const [outcomeIndex, setOutcomeIndex] = useState<0 | 1>(initialOutcomeIndex);
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [prefillPrice, setPrefillPrice] = useState<string | undefined>();
  const [splitModalOpen, setSplitModalOpen] = useState(false);
  const [mergeModalOpen, setMergeModalOpen] = useState(false);

  // Fetch orderbook for both outcomes to display prices on outcome buttons
  const { data: outcome0Book } = useOrderbookLevels(marketId, 0, tickSize);
  const { data: outcome1Book } = useOrderbookLevels(marketId, 1, tickSize);
  const { data: fees } = useMarketFees(marketId);
  // Use the selected outcome's book for mode detection
  const orderbook = outcomeIndex === 0 ? outcome0Book : outcome1Book;
  const hasSetDefaultRef = useRef(false);

  useEffect(() => {
    setOutcomeIndex(initialOutcomeIndex);
    setSide("BUY");
    setPrefillPrice(undefined);
    hasSetDefaultRef.current = false;
  }, [marketId, initialOutcomeIndex]);

  useEffect(() => {
    if (orderbook && !hasSetDefaultRef.current) {
      hasSetDefaultRef.current = true;
      const hasOrders = orderbook.bids.length > 0 || orderbook.asks.length > 0;

      setMode(hasOrders ? "market" : "limit");
    }
  }, [orderbook]);

  const outcomeName =
    outcomes[outcomeIndex] || (outcomeIndex === 0 ? "Yes" : "No");

  // Derive outcome prices in cents from each outcome's orderbook
  const getMidPrice = (book: typeof outcome0Book) => {
    if (book?.bestBidPrice && book?.bestAskPrice)
      return (
        (parseFloat(book.bestBidPrice) + parseFloat(book.bestAskPrice)) / 2
      );
    if (book?.bestAskPrice) return parseFloat(book.bestAskPrice);
    if (book?.bestBidPrice) return parseFloat(book.bestBidPrice);

    return null;
  };
  const mid0 = getMidPrice(outcome0Book);
  const mid1 = getMidPrice(outcome1Book);
  // Use orderbook midpoint, then complement, then subgraph fallback
  const outcome0Cents =
    mid0 != null
      ? Math.round(mid0 * 100)
      : mid1 != null
        ? 100 - Math.round(mid1 * 100)
        : yesPrice != null
          ? Math.round(yesPrice)
          : null;
  const outcome1Cents =
    mid1 != null
      ? Math.round(mid1 * 100)
      : mid0 != null
        ? 100 - Math.round(mid0 * 100)
        : noPrice != null
          ? Math.round(noPrice)
          : null;

  // Fee-aware crossing price: the actual minimum BUY (or maximum SELL) tick
  // that will fully cross *now* given fees, considering both normal-fill and
  // mint/merge-fill paths. Falls back to the displayed midpoint when no
  // liquidity is crossable yet.
  const tickSizeBig = (() => {
    try {
      return BigInt(tickSize || "0");
    } catch {
      return BigInt(0);
    }
  })();

  const decimalTick = (priceStr: string | null | undefined): bigint | null =>
    priceStr ? priceToTick(priceStr) : null;

  // Market orders go through LibMarketOrderService which can only do
  // same-outcome normal fills — they revert with NoLiquidityAvailable() when
  // asked to settle via the mint/merge path. Limit orders go on the book and
  // can later be matched via mint/merge by the matching engine, so they DO
  // get the opposite-outcome path.
  const crossPriceFor = (
    ownBook: typeof outcome0Book,
    otherBook: typeof outcome0Book,
  ): string | undefined => {
    if (!fees || tickSizeBig <= BigInt(0)) return undefined;
    const includeOpposite = mode === "limit";

    if (side === "BUY") {
      const r = minBuyTickToCross({
        sameOutcomeAskTick: decimalTick(ownBook?.bestAskPrice),
        oppositeOutcomeBidTick: includeOpposite
          ? decimalTick(otherBook?.bestBidPrice)
          : null,
        tickSize: tickSizeBig,
        feeBps: fees.totalFeeBps,
      });

      return r?.price;
    }
    const r = maxSellTickToCross({
      sameOutcomeBidTick: decimalTick(ownBook?.bestBidPrice),
      oppositeOutcomeAskTick: includeOpposite
        ? decimalTick(otherBook?.bestAskPrice)
        : null,
      tickSize: tickSizeBig,
      feeBps: fees.totalFeeBps,
    });

    return r?.price;
  };

  const cross0Price = crossPriceFor(outcome0Book, outcome1Book);
  const cross1Price = crossPriceFor(outcome1Book, outcome0Book);

  const midFallback = (cents: number | null) =>
    cents != null ? (cents / 100).toFixed(2) : undefined;
  const mid0Str = midFallback(outcome0Cents);
  const mid1Str = midFallback(outcome1Cents);

  // Button labels use the fee-aware crossing price so the displayed cents
  // match the price the form prefills (and that will actually cross).
  const displayPrice0 = cross0Price ?? mid0Str;
  const displayPrice1 = cross1Price ?? mid1Str;
  const displayCents0 = displayPrice0
    ? Math.round(parseFloat(displayPrice0) * 100)
    : outcome0Cents;
  const displayCents1 = displayPrice1
    ? Math.round(parseFloat(displayPrice1) * 100)
    : outcome1Cents;

  const currentOutcomePrice =
    outcomeIndex === 0 ? displayPrice0 : displayPrice1;

  /** Called from parent (OrderbookPanel) to prefill a price */
  const handlePriceClick = useCallback((price: string) => {
    setPrefillPrice(price);
    setMode("limit");
  }, []);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-3 pb-0">
          {marketLabel ? (
            <div className="flex w-full items-center gap-2.5">
              {teamLogoUrl ? (
                <TeamLogo name={marketLabel} size="md" src={teamLogoUrl} />
              ) : (
                <MarketImage
                  metadataURI={metadataURI ?? ""}
                  name={marketLabel}
                  size="md"
                />
              )}
              <span className="truncate text-base font-semibold text-foreground">
                {marketLabel}
              </span>
            </div>
          ) : null}

          {/* Row 1: Buy/Sell toggle (left) + Mode dropdown (right) */}
          <div className="flex justify-between items-center w-full">
            <div className="flex gap-1">
              {(["BUY", "SELL"] as const).map((value) => {
                const isActive = side === value;
                const accent =
                  value === "BUY" ? colors.neonCyan : colors.neonMagenta;

                return (
                  <button
                    key={value}
                    className="rounded-lg px-4 py-1.5 text-sm font-semibold transition-all"
                    style={
                      isActive
                        ? neonSelectedStyle(accent)
                        : {
                            color: colors.textMuted,
                            background: "transparent",
                            border: "1px solid transparent",
                          }
                    }
                    type="button"
                    onClick={() => setSide(value)}
                  >
                    {value === "BUY" ? "Buy" : "Sell"}
                  </button>
                );
              })}
            </div>

            <TradingModeDropdown
              mode={mode}
              onMergeOpen={() => setMergeModalOpen(true)}
              onModeChange={setMode}
              onSplitOpen={() => setSplitModalOpen(true)}
            />
          </div>

          {/* Row 2: Outcome selector */}
          <div className="flex gap-1 w-full">
            <Button
              className="flex-1 font-semibold"
              color="default"
              size="sm"
              style={
                outcomeIndex === 0
                  ? neonSelectedStyle(colors.neonCyan)
                  : undefined
              }
              variant="flat"
              onPress={() => setOutcomeIndex(0)}
            >
              {outcomes[0] || "Yes"}
              {displayCents0 != null ? ` ${displayCents0}¢` : ""}
            </Button>
            <Button
              className="flex-1 font-semibold"
              color="default"
              size="sm"
              style={
                outcomeIndex === 1
                  ? neonSelectedStyle(colors.neonMagenta)
                  : undefined
              }
              variant="flat"
              onPress={() => setOutcomeIndex(1)}
            >
              {outcomes[1] || "No"}
              {displayCents1 != null ? ` ${displayCents1}¢` : ""}
            </Button>
          </div>
        </CardHeader>

        <CardBody>
          {mode === "market" ? (
            <MarketOrderForm
              marketId={marketId}
              outcomeIndex={outcomeIndex}
              outcomeName={outcomeName}
              side={side}
              tickSize={tickSize}
            />
          ) : (
            <LimitOrderForm
              marketId={marketId}
              outcomeIndex={outcomeIndex}
              outcomeName={outcomeName}
              prefillPrice={prefillPrice || currentOutcomePrice}
              side={side}
            />
          )}
        </CardBody>
      </Card>

      <SplitModal
        isOpen={splitModalOpen}
        marketId={marketId}
        outcomes={outcomes}
        onClose={() => setSplitModalOpen(false)}
      />
      <MergeModal
        isOpen={mergeModalOpen}
        marketId={marketId}
        outcomes={outcomes}
        onClose={() => setMergeModalOpen(false)}
      />
    </>
  );
}
