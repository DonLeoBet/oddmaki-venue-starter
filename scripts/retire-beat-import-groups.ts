/**
 * Pause markets in mistaken beat-only match groups (Aug 2026 Eredivisie import).
 *
 * Usage:
 *   npx tsx scripts/retire-beat-import-groups.ts
 *   npx tsx scripts/retire-beat-import-groups.ts --log=/tmp/poly-football-imports/eredivisie-import.log
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile(path: string) {
  try {
    const raw = readFileSync(path, "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    // optional
  }
}

loadEnvFile(resolve(process.cwd(), ".env"));
loadEnvFile(resolve(process.cwd(), ".env.local"));

const WAIT_MS = 2000;

function wait(ms: number): Promise<void> {
  return new Promise((resolveWait) => setTimeout(resolveWait, ms));
}

function parseGroupIdsFromLog(logPath: string): string[] {
  const raw = readFileSync(logPath, "utf8");
  const ids = new Set<string>();
  const pattern = /groupId: '(\d+)'/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(raw)) !== null) {
    ids.add(match[1]);
  }

  return [...ids].sort((a, b) => Number(a) - Number(b));
}

async function main() {
  const logArg = process.argv.find((arg) => arg.startsWith("--log="));
  const logPath =
    logArg ?
      logArg.slice("--log=".length)
    : "/tmp/poly-football-imports/eredivisie-import.log";

  const groupIds = parseGroupIdsFromLog(logPath);

  if (groupIds.length === 0) {
    console.error(`[retire-beat] No group IDs found in ${logPath}`);
    process.exit(1);
  }

  console.log(
    `[retire-beat] Pausing markets in ${groupIds.length} groups from ${logPath}…`,
  );

  const { BOT_VENUE_ID } = await import("../lib/football/constants");
  const { createBotWalletContext } = await import(
    "../lib/oddmaki/server-bot-client"
  );

  const { client, publicClient, address } = createBotWalletContext();
  let paused = 0;
  let failed = 0;

  for (const groupId of groupIds) {
    const result = (await client.public.getGroupMarkets({
      groupId: BigInt(groupId),
      first: 50,
    })) as { markets?: Array<{ marketId?: string | bigint; status?: string }> };

    const markets = result.markets ?? [];

    for (const market of markets) {
      const marketId = market.marketId;

      if (marketId == null) continue;
      if (market.status === "Paused") continue;

      try {
        const hash = await client.market.pauseMarket(BigInt(marketId));

        await publicClient.waitForTransactionReceipt({ hash });
        paused += 1;
        console.log(`[retire-beat] Paused market ${marketId} (group ${groupId})`);
        await wait(WAIT_MS);
      } catch (error) {
        failed += 1;
        console.error(
          `[retire-beat] Failed market ${marketId} (group ${groupId}):`,
          error instanceof Error ? error.message : error,
        );
      }
    }
  }

  console.log(
    JSON.stringify(
      {
        bot: address,
        venueId: String(BOT_VENUE_ID),
        groups: groupIds.length,
        paused,
        failed,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error("[retire-beat] failed:", error);
  process.exit(1);
});
