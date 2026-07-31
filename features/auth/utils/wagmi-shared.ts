/**
 * Shared Wagmi Configuration
 *
 * Chain and transport config reused by all auth provider adapters.
 * Each adapter imports these to build its own wagmi config.
 */

import { createResilientTransport, resolveRpcUrl } from "@/lib/rpc/baseClient";
import { ACTIVE_CHAIN } from "@/lib/oddmaki/chain";

export const supportedChains = [ACTIVE_CHAIN] as const;

export const transports = {
  [ACTIVE_CHAIN.id]: createResilientTransport({ bot: false }),
} as const;

/** Exposed for debugging / env validation in dev tools. */
export const resolvedPublicRpcUrl = resolveRpcUrl({ bot: false });
