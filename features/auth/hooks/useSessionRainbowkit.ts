"use client";

import { useCallback } from "react";
import { useAccount, useDisconnect } from "wagmi";

import type { SessionState } from "../types";

/** RainbowKit session: connected EVM wallet = logged in. */
export function useSessionRainbowkit(): SessionState {
  const { address, isConnected, isConnecting, isReconnecting } = useAccount();
  const { disconnect } = useDisconnect();

  const isReady = !isConnecting && !isReconnecting;
  const isLoggedIn = isConnected && Boolean(address);

  const logout = useCallback(async () => {
    disconnect();
  }, [disconnect]);

  return {
    isReady,
    isLoggedIn,
    address: address as `0x${string}` | undefined,
    loginMethod: isLoggedIn ? "wallet" : null,
    privyAuthenticated: false,
    wagmiConnected: isConnected,
    login: () => {
      // Connect flow is owned by RainbowKitConnectButton.
    },
    logout,
  };
}
