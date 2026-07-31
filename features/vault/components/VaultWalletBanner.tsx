"use client";

import { useEffect, useState } from "react";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Skeleton } from "@heroui/skeleton";
import { toast } from "sonner";

import { ConnectButton, useSession } from "@/features/auth";
import { useSafeTokenBalance } from "@/features/vault/hooks/useSafeTokenBalance";
import { BRAND_CONFIG } from "@/config/brand.config";
import { fonts } from "@/lib/tokens";

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function VaultWalletBannerInner() {
  const { address, isLoggedIn } = useSession();
  const { formatted, isLoading, refetch } = useSafeTokenBalance();
  const primaryColor = BRAND_CONFIG.theme.primaryColor;

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-4 rounded-xl border px-4 py-4 sm:px-5"
      style={{
        background: "#111214",
        borderColor: isLoggedIn ? `${primaryColor}30` : "#ffffff0c",
      }}
    >
      <div className="min-w-0">
        <p
          className="text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: "#666", fontFamily: fonts.sans }}
        >
          Investor wallet
        </p>
        {isLoggedIn && address ? (
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Chip
              size="sm"
              style={{ color: primaryColor, borderColor: `${primaryColor}44` }}
              variant="bordered"
            >
              Connected
            </Chip>
            <span
              className="font-mono text-sm text-default-400"
              title={address}
            >
              {truncateAddress(address)}
            </span>
          </div>
        ) : (
          <p
            className="mt-1 text-sm"
            style={{ color: "#888", fontFamily: fonts.sans }}
          >
            Connect your wallet to view USDC balance and stake into the vault.
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {isLoggedIn ? (
          <>
            <div className="text-right">
              <p
                className="text-[10px] uppercase tracking-wider text-default-500"
                style={{ fontFamily: fonts.sans }}
              >
                Available USDC
              </p>
              <p
                className="text-xl font-bold tabular-nums"
                style={{ fontFamily: fonts.sans, color: primaryColor }}
              >
                {isLoading ? "…" : `$${formatted}`}
              </p>
            </div>
            <Button size="sm" variant="flat" onPress={() => void refetch()}>
              Refresh
            </Button>
          </>
        ) : (
          <ConnectButton />
        )}
      </div>
    </div>
  );
}

export function VaultWalletBanner() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <Skeleton className="h-20 rounded-xl" />;
  }

  return <VaultWalletBannerInner />;
}
