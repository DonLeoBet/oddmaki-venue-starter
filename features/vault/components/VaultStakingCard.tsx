"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Skeleton } from "@heroui/skeleton";
import { Tab, Tabs } from "@heroui/tabs";
import { toast } from "sonner";

import { ConnectButton, useSession } from "@/features/auth";
import { formatUsd } from "@/features/dpm/lib/format";
import { useSafeTokenBalance } from "@/features/vault/hooks/useSafeTokenBalance";
import { BRAND_CONFIG } from "@/config/brand.config";
import { getVaultConfigSafe } from "@/lib/vault/safe-config";
import { fonts } from "@/lib/tokens";

function parseAmount(value: string): number {
  const n = Number(value);

  return Number.isFinite(n) && n > 0 ? n : 0;
}

function VaultStakingCardInner() {
  const vaultConfig = getVaultConfigSafe();
  const primaryColor = BRAND_CONFIG.theme.primaryColor;
  const { isLoggedIn } = useSession();
  const { formatted, balance, isLoading } = useSafeTokenBalance();

  const [tab, setTab] = useState<string>("deposit");
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [vaultBalanceUsd] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const walletUsd = useMemo(() => Number(formatted) || 0, [formatted]);
  const depositNum = parseAmount(depositAmount);
  const withdrawNum = parseAmount(withdrawAmount);

  const depositValid =
    depositNum >= vaultConfig.minDepositUsd && depositNum <= walletUsd;
  const withdrawValid =
    withdrawNum > 0 && withdrawNum <= vaultBalanceUsd && vaultBalanceUsd > 0;

  const setMaxDeposit = useCallback(() => {
    setDepositAmount(walletUsd > 0 ? walletUsd.toFixed(2) : "");
  }, [walletUsd]);

  const setMaxWithdraw = useCallback(() => {
    setWithdrawAmount(vaultBalanceUsd > 0 ? vaultBalanceUsd.toFixed(2) : "");
  }, [vaultBalanceUsd]);

  const handleDeposit = useCallback(async () => {
    if (!isLoggedIn || !depositValid) return;
    setIsSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 900));
      toast.success("Vault deposit queued", {
        description: `Preview: ${formatUsd(depositNum)} USDC staged for House Pool. On-chain vault settlement activates in Vault v1.`,
      });
      setDepositAmount("");
    } catch (error) {
      console.error("[vault] deposit failed:", error);
      toast.error("Deposit failed", {
        description: "Could not queue deposit. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [depositNum, depositValid, isLoggedIn]);

  const handleWithdraw = useCallback(async () => {
    if (!isLoggedIn || !withdrawValid) return;
    setIsSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 900));
      toast.success("Withdrawal requested", {
        description: `Preview: ${formatUsd(withdrawNum)} USDC withdrawal queued. Available once your vault position is live on-chain.`,
      });
      setWithdrawAmount("");
    } catch (error) {
      console.error("[vault] withdraw failed:", error);
      toast.error("Withdrawal failed", {
        description: "Could not queue withdrawal. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [isLoggedIn, withdrawNum, withdrawValid]);

  return (
    <div
      className="sticky top-24 overflow-hidden rounded-2xl border"
      style={{
        background: "#111214",
        borderColor: `${primaryColor}35`,
        boxShadow: `0 0 32px ${primaryColor}10`,
      }}
    >
      <div
        className="border-b px-5 py-4 sm:px-6"
        style={{ borderColor: "#ffffff0a" }}
      >
        <p
          className="text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: primaryColor, fontFamily: fonts.sans }}
        >
          Stake USDC
        </p>
        <h2
          className="mt-1 text-lg font-bold"
          style={{ fontFamily: fonts.sans, letterSpacing: "-0.02em" }}
        >
          Liquidity Vault
        </h2>
        <p className="mt-1 text-xs text-default-500">
          Min. deposit {formatUsd(vaultConfig.minDepositUsd)} · Base mainnet USDC
        </p>
      </div>

      <div className="space-y-4 p-5 sm:p-6">
        <div
          className="flex items-center justify-between rounded-lg border px-4 py-3"
          style={{ borderColor: "#ffffff0a", background: "#0a0b0d" }}
        >
          <span className="text-xs text-default-500">Your vault balance</span>
          <span
            className="text-lg font-bold tabular-nums"
            style={{ color: primaryColor, fontFamily: fonts.sans }}
          >
            {formatUsd(vaultBalanceUsd)}
          </span>
        </div>

        {!isLoggedIn ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <p className="text-sm text-default-500">
              Connect a wallet to deposit USDC into the House Pool.
            </p>
            <ConnectButton />
          </div>
        ) : (
          <Tabs
            aria-label="Vault actions"
            selectedKey={tab}
            variant="underlined"
            onSelectionChange={(key) => setTab(String(key))}
          >
            <Tab key="deposit" title="Deposit">
              <div className="mt-4 space-y-4">
                <Input
                  description={
                    isLoading
                      ? "Loading wallet balance…"
                      : `Wallet: $${formatted} USDC`
                  }
                  endContent={
                    <Button size="sm" variant="light" onPress={setMaxDeposit}>
                      Max
                    </Button>
                  }
                  label="Amount (USDC)"
                  placeholder="0.00"
                  type="number"
                  value={depositAmount}
                  onValueChange={setDepositAmount}
                />

                {depositAmount && depositNum < vaultConfig.minDepositUsd ? (
                  <p className="text-xs text-warning">
                    Minimum deposit is {formatUsd(vaultConfig.minDepositUsd)}.
                  </p>
                ) : null}

                {depositAmount && depositNum > walletUsd ? (
                  <p className="text-xs text-danger">
                    Amount exceeds wallet balance (${formatted}).
                  </p>
                ) : null}

                <Button
                  className="w-full font-bold"
                  color="primary"
                  isDisabled={!depositValid || isSubmitting}
                  isLoading={isSubmitting}
                  size="lg"
                  style={
                    depositValid
                      ? {
                          background: primaryColor,
                          color: BRAND_CONFIG.theme.backgroundColor,
                        }
                      : undefined
                  }
                  onPress={handleDeposit}
                >
                  Deposit USDC into Vault
                </Button>
              </div>
            </Tab>

            <Tab key="withdraw" title="Withdraw">
              <div className="mt-4 space-y-4">
                <Input
                  description={
                    vaultBalanceUsd > 0
                      ? `Available in vault: ${formatUsd(vaultBalanceUsd)}`
                      : "No vault balance yet — deposit first"
                  }
                  endContent={
                    <Button
                      isDisabled={vaultBalanceUsd <= 0}
                      size="sm"
                      variant="light"
                      onPress={setMaxWithdraw}
                    >
                      Max
                    </Button>
                  }
                  isDisabled={vaultBalanceUsd <= 0}
                  label="Amount (USDC)"
                  placeholder="0.00"
                  type="number"
                  value={withdrawAmount}
                  onValueChange={setWithdrawAmount}
                />

                <Button
                  className="w-full font-semibold"
                  isDisabled={!withdrawValid || isSubmitting}
                  isLoading={isSubmitting}
                  size="lg"
                  variant="bordered"
                  onPress={handleWithdraw}
                >
                  Withdraw from Vault
                </Button>
              </div>
            </Tab>
          </Tabs>
        )}

        <p className="text-[11px] leading-relaxed text-default-500">
          Preview mode: wallet balance is live on-chain (
          {balance > BigInt(0) ? `$${formatted}` : "connect to view"}). Vault
          settlement contracts deploy in Vault v1 — UI is investor-ready today.
        </p>
      </div>
    </div>
  );
}

export function VaultStakingCard() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <Skeleton className="h-96 rounded-2xl" />;
  }

  return <VaultStakingCardInner />;
}
