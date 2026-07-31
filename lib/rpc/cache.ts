const LOG_PREFIX = "[rpc/cache]";

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class TtlCache<T> {
  private store = new Map<string, CacheEntry<T>>();
  private hits = 0;
  private misses = 0;

  constructor(private readonly name: string) {}

  get(key: string): T | undefined {
    const entry = this.store.get(key);

    if (!entry) {
      this.misses += 1;
      this.logAccess("miss", key);
      return undefined;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.misses += 1;
      this.logAccess("miss", key);
      return undefined;
    }

    this.hits += 1;
    this.logAccess("hit", key);
    return entry.value;
  }

  set(key: string, value: T, ttlMs: number): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  stats(): { hits: number; misses: number; size: number } {
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.store.size,
    };
  }

  private logAccess(kind: "hit" | "miss", key: string): void {
    if (process.env.RPC_CACHE_DEBUG !== "1") return;

    console.info(`${LOG_PREFIX} ${kind}`, {
      cache: this.name,
      key,
      ...this.stats(),
    });
  }
}

/** Shared in-memory caches for RPC read helpers. */
export const balanceCache = new TtlCache<bigint>("balance");
export const readContractCache = new TtlCache<unknown>("readContract");
