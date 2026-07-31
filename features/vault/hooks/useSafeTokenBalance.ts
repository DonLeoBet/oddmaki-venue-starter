"use client";

import { useTokenBalance } from "@/features/wallet/hooks/useTokenBalance";

/** Defensive wrapper around useTokenBalance for vault UI. */
export function useSafeTokenBalance() {
  const result = useTokenBalance();

  return {
    balance: result.balance ?? BigInt(0),
    formatted: result.formatted ?? "0.00",
    isLoading: result.isLoading ?? false,
    refetch: result.refetch ?? (async () => {}),
  };
}
