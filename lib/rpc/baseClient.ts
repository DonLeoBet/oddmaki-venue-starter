import {
  createPublicClient,
  custom,
  type Address,
  type Chain,
  type PublicClient,
  type Transport,
} from "viem";

import { ACTIVE_CHAIN } from "@/lib/oddmaki/chain";

import { balanceCache, readContractCache } from "./cache";
import { rpcConcurrencyLimiter } from "./concurrency";
import { RpcRateLimitError, isRateLimitError } from "./errors";
import { withRpcRetry } from "./retry";

const LOG_PREFIX = "[rpc]";

export interface ResolveRpcUrlOptions {
  /** Prefer BOT_RPC_URL (server-side writes / cron). */
  bot?: boolean;
}

export function resolveRpcUrl(options: ResolveRpcUrlOptions = {}): string {
  if (options.bot) {
    return (
      process.env.BOT_RPC_URL ??
      process.env.NEXT_PUBLIC_RPC_URL ??
      ACTIVE_CHAIN.rpcUrls.default.http[0]
    );
  }

  return (
    process.env.NEXT_PUBLIC_RPC_URL ?? ACTIVE_CHAIN.rpcUrls.default.http[0]
  );
}

interface JsonRpcResponse {
  result?: unknown;
  error?: { code?: number; message?: string; data?: unknown };
}

async function performJsonRpcRequest(
  rpcUrl: string,
  method: string,
  params: unknown,
): Promise<unknown> {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now(),
      method,
      params,
    }),
  });

  if (response.status === 429) {
    throw new RpcRateLimitError(`HTTP 429 from ${rpcUrl}`, { status: 429 });
  }

  const body = (await response.json()) as JsonRpcResponse;

  if (body.error) {
    const error = new RpcRateLimitError(
      body.error.message ?? "JSON-RPC error",
      { code: body.error.code },
    );

    if (body.error.code === -32005) {
      throw error;
    }

    if (isRateLimitError(error)) {
      throw error;
    }

    throw new Error(body.error.message ?? "JSON-RPC error");
  }

  return body.result;
}

async function requestThroughLimiter(
  rpcUrl: string,
  method: string,
  params: unknown,
): Promise<unknown> {
  return rpcConcurrencyLimiter.run(
    () =>
      withRpcRetry(() => performJsonRpcRequest(rpcUrl, method, params), {
        label: method,
      }),
    method,
  );
}

/** Resilient viem transport: concurrency limit + rate-limit retry on every RPC call. */
export function createResilientTransport(
  options: ResolveRpcUrlOptions = {},
): Transport {
  const rpcUrl = resolveRpcUrl(options);

  return custom({
    name: "resilient-http",
    async request({ method, params }) {
      return requestThroughLimiter(rpcUrl, method, params);
    },
  });
}

const publicClientCache = new Map<string, PublicClient>();

export function getPublicClient(
  options: ResolveRpcUrlOptions = {},
): PublicClient {
  const key = options.bot ? "bot" : "default";
  const cached = publicClientCache.get(key);

  if (cached) return cached;

  const client = createPublicClient({
    chain: ACTIVE_CHAIN as Chain,
    transport: createResilientTransport(options),
  });

  publicClientCache.set(key, client);
  return client;
}

/** Default TTL for balance reads (15s). */
export const BALANCE_CACHE_TTL_MS = Number.parseInt(
  process.env.RPC_BALANCE_CACHE_TTL_MS ?? "15000",
  10,
);

/** Default TTL for static venue/config reads (5 min). */
export const STATIC_READ_CACHE_TTL_MS = Number.parseInt(
  process.env.RPC_STATIC_CACHE_TTL_MS ?? "300000",
  10,
);

function chainIdFor(publicClient: PublicClient): number {
  return publicClient.chain?.id ?? ACTIVE_CHAIN.id;
}

export async function cachedGetBalance(
  publicClient: PublicClient,
  address: Address,
  ttlMs: number = BALANCE_CACHE_TTL_MS,
): Promise<bigint> {
  const cacheKey = `${chainIdFor(publicClient)}:${address.toLowerCase()}`;
  const cached = balanceCache.get(cacheKey);

  if (cached !== undefined) return cached;

  const balance = await publicClient.getBalance({ address });

  balanceCache.set(cacheKey, balance, ttlMs);
  return balance;
}

function serializeReadContractKey(params: {
  address: Address;
  functionName: string;
  args?: readonly unknown[];
}): string {
  return JSON.stringify({
    address: params.address,
    functionName: params.functionName,
    args: params.args,
  });
}

export async function cachedReadContract(
  publicClient: PublicClient,
  params: Parameters<PublicClient["readContract"]>[0],
  options: { ttlMs?: number; cacheKey?: string } = {},
): Promise<unknown> {
  const ttlMs = options.ttlMs ?? STATIC_READ_CACHE_TTL_MS;
  const cacheKey =
    options.cacheKey ??
    `${chainIdFor(publicClient)}:${serializeReadContractKey({
      address: params.address as Address,
      functionName: params.functionName as string,
      args: params.args,
    })}`;

  const cached = readContractCache.get(cacheKey);

  if (cached !== undefined) return cached;

  const result = await publicClient.readContract(params);

  readContractCache.set(cacheKey, result, ttlMs);
  return result;
}

/** Invalidate cached venue reads after on-chain venue updates. */
export function invalidateVenueReadCache(venueId: bigint | number): void {
  readContractCache.delete(`venue:${venueId}`);
}

export function logRpcClientConfig(context: string): void {
  console.info(`${LOG_PREFIX} Client ready`, {
    context,
    botRpcHost: safeHost(resolveRpcUrl({ bot: true })),
    publicRpcHost: safeHost(resolveRpcUrl({ bot: false })),
  });
}

function safeHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return "invalid-url";
  }
}
