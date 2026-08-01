"use client";

import { generatePseudonym } from "./pseudonym";

const STORAGE_PREFIX = "polyfootball:displayName:";

function storageKey(address: string): string {
  return `${STORAGE_PREFIX}${address.toLowerCase()}`;
}

/** Read a user-chosen display name from localStorage (client only). */
export function getStoredDisplayName(address: string | null | undefined): string | null {
  if (!address || typeof window === "undefined") return null;

  const value = localStorage.getItem(storageKey(address))?.trim();

  return value || null;
}

/** Persist display name locally for this wallet (per browser). */
export function setStoredDisplayName(address: string, name: string): void {
  if (typeof window === "undefined") return;

  const trimmed = name.trim();

  if (!trimmed) {
    localStorage.removeItem(storageKey(address));
    return;
  }

  localStorage.setItem(storageKey(address), trimmed.slice(0, 32));
}

/** Pseudonym unless the user set a custom name on this device. */
export function resolveDisplayName(address: string): string {
  return getStoredDisplayName(address) ?? generatePseudonym(address);
}
