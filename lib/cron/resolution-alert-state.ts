import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";

const MAX_STORED_IDS = 5_000;

function statePath(): string {
  return (
    process.env.RESOLUTION_ALERTS_STATE_FILE?.trim() ??
    join(process.cwd(), ".data/resolution-alerts.json")
  );
}

export function loadNotifiedAssertionIds(): Set<string> {
  const path = statePath();

  try {
    if (!existsSync(path)) return new Set();

    const parsed = JSON.parse(readFileSync(path, "utf8")) as {
      assertionIds?: string[];
    };

    return new Set(parsed.assertionIds ?? []);
  } catch {
    return new Set();
  }
}

export function saveNotifiedAssertionIds(ids: Set<string>): void {
  const path = statePath();
  const assertionIds = Array.from(ids).slice(-MAX_STORED_IDS);

  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(
    path,
    JSON.stringify({ assertionIds, updatedAt: new Date().toISOString() }, null, 2),
  );
}

/** Optional Upstash Redis dedup — set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN. */
export async function markAssertionNotified(
  assertionId: string,
): Promise<boolean> {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (url && token) {
    const response = await fetch(
      `${url}/sadd/resolution-alerts/${encodeURIComponent(assertionId)}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (!response.ok) {
      throw new Error(`Upstash SADD failed: ${response.status}`);
    }

    const data = (await response.json()) as { result?: number };

    return data.result === 1;
  }

  const ids = loadNotifiedAssertionIds();

  if (ids.has(assertionId)) return false;

  ids.add(assertionId);
  saveNotifiedAssertionIds(ids);

  return true;
}
