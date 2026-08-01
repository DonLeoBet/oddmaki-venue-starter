import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

export type MatchPredictionPick = "home" | "draw" | "away";

export interface MatchSocialEntry {
  address: string;
  displayName: string;
  prediction: MatchPredictionPick | null;
  comment: string;
  updatedAt: string;
}

export interface MatchSocialThread {
  fixtureId: number;
  entries: MatchSocialEntry[];
}

function dataDir(): string {
  if (process.env.MATCH_SOCIAL_DATA_DIR?.trim()) {
    return process.env.MATCH_SOCIAL_DATA_DIR.trim();
  }

  if (process.env.VERCEL) {
    return path.join("/tmp", "match-social");
  }

  return path.join(process.cwd(), "data", "match-social");
}

function threadPath(fixtureId: number): string {
  return path.join(dataDir(), `${fixtureId}.json`);
}

async function ensureDir(): Promise<void> {
  await mkdir(dataDir(), { recursive: true });
}

export async function readMatchSocialThread(
  fixtureId: number,
): Promise<MatchSocialThread> {
  try {
    const raw = await readFile(threadPath(fixtureId), "utf8");
    const parsed = JSON.parse(raw) as MatchSocialThread;

    return {
      fixtureId,
      entries: Array.isArray(parsed.entries) ? parsed.entries : [],
    };
  } catch {
    return { fixtureId, entries: [] };
  }
}

export async function upsertMatchSocialEntry(params: {
  fixtureId: number;
  address: string;
  displayName: string;
  prediction: MatchPredictionPick | null;
  comment: string;
}): Promise<MatchSocialThread> {
  await ensureDir();

  const thread = await readMatchSocialThread(params.fixtureId);
  const normalizedAddress = params.address.toLowerCase();
  const nextEntry: MatchSocialEntry = {
    address: normalizedAddress,
    displayName: params.displayName.trim().slice(0, 32) || "Trader",
    prediction: params.prediction,
    comment: params.comment.trim().slice(0, 500),
    updatedAt: new Date().toISOString(),
  };

  const withoutSelf = thread.entries.filter(
    (entry) => entry.address !== normalizedAddress,
  );

  if (!nextEntry.comment && !nextEntry.prediction) {
    const nextThread = { fixtureId: params.fixtureId, entries: withoutSelf };

    await writeFile(threadPath(params.fixtureId), JSON.stringify(nextThread, null, 2));

    return nextThread;
  }

  const nextThread = {
    fixtureId: params.fixtureId,
    entries: [nextEntry, ...withoutSelf].slice(0, 100),
  };

  await writeFile(threadPath(params.fixtureId), JSON.stringify(nextThread, null, 2));

  return nextThread;
}
