"use client";

import { useCallback, useSyncExternalStore } from "react";

import {
  getStoredDisplayName,
  resolveDisplayName,
  setStoredDisplayName,
} from "@/lib/identity/display-name";
import { generatePseudonym } from "@/lib/identity/pseudonym";

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);

  return () => listeners.delete(listener);
}

function notifyDisplayNameChange() {
  listeners.forEach((listener) => listener());
}

/** Custom display name stored in localStorage, falling back to pseudonym. */
export function useDisplayName(address: string | null | undefined) {
  const snapshot = useSyncExternalStore(
    subscribe,
    () => (address ? resolveDisplayName(address) : ""),
    () => (address ? generatePseudonym(address) : ""),
  );

  const setDisplayName = useCallback(
    (name: string) => {
      if (!address) return;

      setStoredDisplayName(address, name);
      notifyDisplayNameChange();
    },
    [address],
  );

  const customName = address ? getStoredDisplayName(address) : null;

  return {
    displayName: snapshot,
    customName,
    setDisplayName,
    hasCustomName: Boolean(customName),
  };
}
