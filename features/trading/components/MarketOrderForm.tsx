"use client";

import { useState, useMemo } from "react";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import { Divider } from "@heroui/divider";
import { previewMarketBuy } from "@oddmaki-protocol/sdk";

import { usePlaceMarketOrder } from "../hooks/usePlaceMarketOrder";

import { useSession } from "@/features/auth";
import { useTokenBalance } from "@/features/wallet";
import { ChevronDownIcon } from "@/components/icons";
import { useMarketFees } from "@/features/market-detail/hooks/useMarketFees";
import { useMarkPrice } from "@/features/market-detail/hooks/useMarkPrice";
import { useImpliedTopOfBook } from "@/features/market-detail/hooks/useImpliedTopOfBook";
import { TransactionFlowModal } from "@/lib/oddmaki/TransactionFlowModal";
import { useCanTradeOnMarket } from "@/features/access-control";

const AMOUNT_DELTAS = [1, 5, 10, 100];

interface MarketOrderFormProps {
  marketId: string;
  outcomeIndex: 0 | 1;
  outcomeName: string;
  tickSize: string;
  side?: "BUY" | "SELL";
}

/**
 * Preset slippage chips. Anchored to the on-chain mark price; the protocol
 * caps slippage at 20% via `MAX_SLIPPAGE_BPS`, and the helper
 * `slippagePctToBps` enforces that bound when the value is forwarded to the
 * facet.
 */
const SLIPPAGE_PRESETS_PCT = [0.5, 1, 5, 10] as const;
const DEFAULT_SLIPPAGE_PCT = 5;

const ORDER_TYPE_OPTIONS = [
  { key: "FAK", label: "Fill & Kill (partial fill OK)" },
  { key: "FOK", label: "Fill or Kill (all or nothing)" },
];

export function MarketOrderForm({
  marketId,
  outcomeIndex,
  outcomeName,
  tickSize,
  side = "BUY",
}: MarketOrderFormProps) {
  const isBuy = side === "BUY";
  const sideLabel = isBuy ? "Buy" : "Sell";
  const sideColor = isBuy ? "primary" : "secondary";
  const { isLoggedIn } = useSession();
  const { startPlaceMarketOrder, flow } = usePlaceMarketOrder();
  const { data: canTrade = true } = useCanTradeOnMarket(
    marketId ? BigInt(marketId) : undefined,
  );
  const { data: fees } = useMarketFees(marketId);
  // Mark price is informational only (the "% chance" badge); the take
  // service anchors against the implied top of book, not the mark price.
  const { data: markPrice } = useMarkPrice(marketId, outcomeIndex, tickSize);
  // Implied top of book is the *actual* anchor the contract will use.
  // For BUY: implied ask = cheapest takeable cost (same-outcome ask OR mint
  // complement of opposite bid). For SELL: implied bid = richest payout.
  const { data: implied } = useImpliedTopOfBook(
    marketId,
    outcomeIndex,
    tickSize,
  );

  // The price the contract will anchor against — this is what `previewMarketBuy`
  // and the slippage cap will be computed from.
  const anchorPrice = isBuy ? implied?.askPrice : implied?.bidPrice;
  const hasTakeableLiquidity = !!anchorPrice;

  const { formatted: walletBalance } = useTokenBalance();
  const [amount, setAmount] = useState("");
  const [slippagePct, setSlippagePct] = useState<number>(DEFAULT_SLIPPAGE_PCT);
  const [orderType, setOrderType] = useState<"FOK" | "FAK">("FAK");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [flowOpen, setFlowOpen] = useState(false);

  const amountNum = parseFloat(amount);
  const balanceNum = parseFloat(walletBalance);
  const isValid = !isNaN(amountNum) && amountNum > 0;
  const hasInsufficientBalance =
    isBuy &&
    isLoggedIn &&
    !isNaN(amountNum) &&
    amountNum > 0 &&
    balanceNum < amountNum;

  /**
   * Pre-trade preview: shares + payout + profit at the *implied ask*
   * (= what the contract anchors against), with slippage + fees baked in.
   * Honest mirror of what the V2 facet will actually settle within slippage.
   */
  const buyEstimate = useMemo(() => {
    if (!isBuy) return null;
    if (!hasTakeableLiquidity || !fees || !anchorPrice) return null;
    if (!amount || amountNum <= 0) return null;

    return previewMarketBuy({
      amount: amountNum,
      markPrice: parseFloat(anchorPrice),
      slippagePct,
      feeBps: fees.totalFeeBps,
    });
  }, [
    isBuy,
    hasTakeableLiquidity,
    fees,
    amount,
    amountNum,
    anchorPrice,
    slippagePct,
  ]);

  const handleSubmit = async () => {
    if (!isValid) return;
    setFlowOpen(true);
    await startPlaceMarketOrder({
      marketId,
      outcomeIndex,
      side,
      amount,
      slippagePct,
      orderType,
    });
  };

  const handleFlowClose = () => {
    if (flow.isComplete) {
      setAmount("");
    }
    setFlowOpen(false);
    flow.reset();
  };

  // Headline price = "Buy/Sell at X¢" — the implied side the take service
  // will anchor against. Falls back to mark only when implied is empty
  // (which also means the Trade button is disabled).
  const headlinePrice = anchorPrice ?? markPrice?.price ?? null;
  const headlineLabel = headlinePrice
    ? `${isBuy ? "Buy" : "Sell"} at ${Math.round(parseFloat(headlinePrice) * 100)}¢`
    : "No takeable liquidity";

  const tradeButtonLabel = (() => {
    if (!isLoggedIn) return "Connect Wallet";
    if (!canTrade) return "Access Restricted";
    if (!hasTakeableLiquidity) return "No Liquidity";
    if (hasInsufficientBalance) return "Insufficient USDC";

    return "Trade";
  })();

  return (
    <div className="flex flex-col gap-3">
      {/* Amount input */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-default-500">Amount</span>
        <div className="flex items-center gap-0.5">
          <span className="text-lg font-semibold text-foreground">$</span>
          <input
            className="bg-transparent text-lg font-semibold text-foreground outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            min="0"
            placeholder="0"
            step="1"
            style={{ width: `${Math.max(1, amount.length || 1)}ch` }}
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
      </div>

      {/* Quick-add chips */}
      <div className="flex gap-1 rounded-lg p-1.5">
        {AMOUNT_DELTAS.map((d) => (
          <Button
            key={d}
            className="min-w-0 h-6 px-2 bg-default-100 text-xs flex-1"
            size="sm"
            variant="flat"
            onPress={() => {
              const current = parseFloat(amount) || 0;

              setAmount(String(current + d));
            }}
          >
            +${d}
          </Button>
        ))}
        <Button
          className="min-w-0 h-6 px-2 bg-default-100 text-xs flex-1"
          isDisabled={!isLoggedIn}
          size="sm"
          variant="flat"
          onPress={() => setAmount(walletBalance)}
        >
          Max
        </Button>
      </div>

      {/* Headline price + slippage chip set */}
      <div className="flex flex-col gap-1.5 px-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-default-400">{headlineLabel}</span>
          <span className="text-default-400">Max slippage</span>
        </div>
        <div className="flex gap-1 rounded-lg p-1.5 bg-default-50">
          {SLIPPAGE_PRESETS_PCT.map((p) => (
            <Button
              key={p}
              className={`min-w-0 h-6 px-2 text-xs flex-1 ${
                slippagePct === p ? "" : "bg-default-100"
              }`}
              color={slippagePct === p ? sideColor : "default"}
              size="sm"
              variant={slippagePct === p ? "solid" : "flat"}
              onPress={() => setSlippagePct(p)}
            >
              {p}%
            </Button>
          ))}
        </div>
      </div>

      {/* Total + To Win + Avg Price (fee + slippage aware) */}
      {amount && parseFloat(amount) > 0 && (
        <>
          <Divider />
          <div className="flex flex-col gap-1 px-1">
            <div className="flex justify-between text-sm">
              <span className="text-default-400">Total</span>
              <span className="font-semibold">
                ${parseFloat(amount).toFixed(2)}
              </span>
            </div>
            {isBuy && buyEstimate && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-default-400">To win 💵</span>
                  <span className="font-semibold text-success">
                    ${buyEstimate.expectedPayout.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-default-400">
                    Avg. Price{" "}
                    {Math.round(buyEstimate.expectedPricePerShare * 100)}¢
                  </span>
                  <span className="text-default-400">
                    Worst case: ${buyEstimate.worstCaseShares.toFixed(2)} shares
                  </span>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Collapsible order-type selector */}
      <button
        className="flex items-center gap-1 text-xs text-default-400 hover:text-default-600 transition-colors"
        onClick={() => setShowAdvanced(!showAdvanced)}
      >
        <span>Advanced</span>
        <ChevronDownIcon
          className={`transition-transform ${showAdvanced ? "rotate-180" : ""}`}
          size={12}
        />
      </button>

      {showAdvanced && (
        <div className="flex flex-col gap-3">
          <Select
            label="Order Type"
            selectedKeys={[orderType]}
            size="sm"
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0] as string;

              if (selected === "FOK" || selected === "FAK") {
                setOrderType(selected);
              }
            }}
          >
            {ORDER_TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.key}>{opt.label}</SelectItem>
            ))}
          </Select>
        </div>
      )}

      <Button
        className="w-full"
        color={sideColor as "primary" | "secondary"}
        isDisabled={
          !isLoggedIn ||
          !isValid ||
          !canTrade ||
          !hasTakeableLiquidity ||
          hasInsufficientBalance
        }
        isLoading={flow.isRunning}
        onPress={handleSubmit}
      >
        {tradeButtonLabel}
      </Button>

      {!hasTakeableLiquidity && (
        <p className="text-xs text-default-400 text-center">
          No takeable liquidity on either path - place a limit order to seed the
          book.
        </p>
      )}

      {hasInsufficientBalance && (
        <p className="text-xs text-danger text-center">
          You have ${walletBalance} USDC — add funds to place this order.
        </p>
      )}

      <TransactionFlowModal
        hasError={flow.hasError}
        isComplete={flow.isComplete}
        isOpen={flowOpen}
        isRunning={flow.isRunning}
        stepStates={flow.stepStates}
        title={`${sideLabel} ${outcomeName}`}
        onClose={handleFlowClose}
        onRetry={flow.retry}
      />
    </div>
  );
}
