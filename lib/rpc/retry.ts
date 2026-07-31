import { isRateLimitError } from "./errors";

const LOG_PREFIX = "[rpc/retry]";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface RpcRetryOptions {
  /** Total attempts including the first try. Default: 5 */
  maxAttempts?: number;
  /** Base delay for exponential backoff. Default: 100ms */
  baseDelayMs?: number;
  /** Optional label for logs (e.g. eth_call, getBalance). */
  label?: string;
}

/**
 * Retry an RPC operation on rate-limit errors with exponential backoff:
 * 100ms, 200ms, 400ms, 800ms, …
 */
export async function withRpcRetry<T>(
  fn: () => Promise<T>,
  options: RpcRetryOptions = {},
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? 5;
  const baseDelayMs = options.baseDelayMs ?? 100;
  const label = options.label ?? "rpc";

  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const result = await fn();

      if (attempt > 0) {
        console.info(`${LOG_PREFIX} Retry succeeded`, {
          label,
          attempt: attempt + 1,
        });
      }

      return result;
    } catch (error) {
      lastError = error;

      if (!isRateLimitError(error) || attempt === maxAttempts - 1) {
        throw error;
      }

      const delayMs = baseDelayMs * 2 ** attempt;

      console.warn(`${LOG_PREFIX} Rate limit — backing off`, {
        label,
        attempt: attempt + 1,
        maxAttempts,
        delayMs,
        error: error instanceof Error ? error.message : String(error),
      });

      await sleep(delayMs);
    }
  }

  throw lastError;
}
