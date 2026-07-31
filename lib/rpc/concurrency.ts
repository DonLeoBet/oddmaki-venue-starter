const LOG_PREFIX = "[rpc/concurrency]";

/** Max in-flight JSON-RPC requests (shared across bot + server reads). */
export const DEFAULT_RPC_CONCURRENCY = Number.parseInt(
  process.env.RPC_CONCURRENCY_LIMIT ?? "5",
  10,
);

class ConcurrencyLimiter {
  private active = 0;
  private queue: Array<() => void> = [];

  constructor(private readonly max: number) {}

  async run<T>(fn: () => Promise<T>, label?: string): Promise<T> {
    await this.acquire(label);

    try {
      return await fn();
    } finally {
      this.release();
    }
  }

  private acquire(label?: string): Promise<void> {
    if (this.active < this.max) {
      this.active += 1;
      return Promise.resolve();
    }

    if (process.env.RPC_CONCURRENCY_DEBUG === "1") {
      console.info(`${LOG_PREFIX} Queued RPC call`, {
        label,
        active: this.active,
        max: this.max,
        queued: this.queue.length + 1,
      });
    }

    return new Promise((resolve) => {
      this.queue.push(() => {
        this.active += 1;
        resolve();
      });
    });
  }

  private release(): void {
    this.active -= 1;

    const next = this.queue.shift();

    if (next) next();
  }
}

export const rpcConcurrencyLimiter = new ConcurrencyLimiter(
  DEFAULT_RPC_CONCURRENCY,
);

/** Pause between bulk-import batches to avoid RPC bursts. */
export const IMPORT_BATCH_SIZE = Number.parseInt(
  process.env.IMPORT_BATCH_SIZE ?? "10",
  10,
);

export const IMPORT_BATCH_DELAY_MS = Number.parseInt(
  process.env.IMPORT_BATCH_DELAY_MS ?? "1500",
  10,
);

export async function maybeDelayImportBatch(index: number): Promise<void> {
  if (index <= 0 || index % IMPORT_BATCH_SIZE !== 0) return;

  console.info(`${LOG_PREFIX} Import batch pause`, {
    afterItems: index,
    delayMs: IMPORT_BATCH_DELAY_MS,
  });

  await new Promise((resolve) => setTimeout(resolve, IMPORT_BATCH_DELAY_MS));
}
