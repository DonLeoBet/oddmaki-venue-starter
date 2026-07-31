"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
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
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const activationKeyRef = useRef<string | null>(null);

  const primaryWalletKey = useMemo(() => {
    if (!walletsReady || wallets.length === 0) return null;

    const embedded = wallets.find((w) => w.walletClientType === "privy");
    const target = embedded ?? wallets[0];

    return target?.address ?? `${target?.walletClientType ?? "wallet"}-0`;
  }, [walletsReady, wallets]);

  useEffect(() => {
    if (!privyReady || !walletsReady || !primaryWalletKey) return;

    if (address) {
      activationKeyRef.current = null;

      return;
    }

    if (activationKeyRef.current === primaryWalletKey) return;

    const embedded = wallets.find((w) => w.walletClientType === "privy");
    const target = embedded ?? wallets[0];

    if (!target) return;

    activationKeyRef.current = primaryWalletKey;

    void setActiveWallet(target).catch(() => {
      activationKeyRef.current = null;
    });
  }, [
    privyReady,
    walletsReady,
    primaryWalletKey,
    address,
    setActiveWallet,
    wallets,
  ]);

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

  // Privy SDK init only — don't block UI on wagmi connect/reconnect. Address
  // resolves from Privy wallets while wagmi syncs in the background.
  const isReady = privyReady && walletsReady;

  const logout = useCallback(async () => {
    activationKeyRef.current = null;

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
