"use client";

import { useCallback, useEffect, useMemo } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useSetActiveWallet } from "@privy-io/wagmi";
import { useAccount, useDisconnect } from "wagmi";

import type { SessionState } from "../types";

/**
 * Privy session: social/email auth OR external wallet connection counts as logged in.
 * Keeps wagmi's active wallet in sync with Privy's connected wallets.
 */
export function useSessionPrivy(): SessionState {
  const { ready: privyReady, authenticated, login, logout: privyLogout } =
    usePrivy();
  const { ready: walletsReady, wallets } = useWallets();
  const { setActiveWallet } = useSetActiveWallet();
  const { address, isConnected, isConnecting, isReconnecting } = useAccount();
  const { disconnect } = useDisconnect();

  useEffect(() => {
    if (!privyReady || !walletsReady || wallets.length === 0) return;
    if (address) return;

    const embedded = wallets.find((w) => w.walletClientType === "privy");
    const target = embedded ?? wallets[0];

    if (target) {
      void setActiveWallet(target).catch(() => {
        // Wallet may not be ready for activation yet (e.g. mid-connect on mobile).
      });
    }
  }, [privyReady, walletsReady, wallets, address, setActiveWallet]);

  const walletFallback = wallets.find((w) => w.address)?.address as
    | `0x${string}`
    | undefined;

  const resolvedAddress = address ?? walletFallback;
  const hasWallet = Boolean(resolvedAddress);
  const hasPrivyWallet = wallets.some((w) => Boolean(w.address));

  const loginMethod = useMemo((): SessionState["loginMethod"] => {
    if (!hasWallet) return null;
    if (authenticated) return "privy";

    return "wallet";
  }, [authenticated, hasWallet]);

  const isLoggedIn =
    hasWallet && (authenticated || isConnected || hasPrivyWallet);

  const isReady = privyReady && walletsReady && !isConnecting && !isReconnecting;

  const logout = useCallback(async () => {
    try {
      if (authenticated) await privyLogout();
    } finally {
      if (isConnected) disconnect();
    }
  }, [authenticated, privyLogout, isConnected, disconnect]);

  return {
    isReady,
    isLoggedIn,
    address: resolvedAddress,
    loginMethod,
    privyAuthenticated: authenticated,
    wagmiConnected: isConnected,
    login,
    logout,
  };
}
