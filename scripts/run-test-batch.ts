/**
 * One-off CLI: dry-run or create the 10-day test batch (1 fixture per league).
 * Usage: npx tsx scripts/run-test-batch.ts [--create]
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
    // optional file
  }
}

loadEnvFile(resolve(process.cwd(), ".env"));
loadEnvFile(resolve(process.cwd(), ".env.local"));

const create = process.argv.includes("--create");
const onlyFixtureIds = process.argv
  .slice(2)
  .filter((arg) => arg !== "--create")
  .map((arg) => Number.parseInt(arg, 10))
  .filter((id) => Number.isFinite(id) && id > 0);

async function main() {
  const { runTestBatchDryRun, runTestBatchCreate } = await import(
    "../lib/admin/test-batch-service"
  );

  if (!create) {
    const dry = await runTestBatchDryRun();
    const filtered =
      onlyFixtureIds.length > 0 ?
        {
          ...dry,
          markets: dry.markets.filter((m) =>
            onlyFixtureIds.includes(m.fixtureId),
          ),
        }
      : dry;
    console.log(JSON.stringify(filtered, null, 2));
    console.log(
      `\nSummary: wouldCreate=${filtered.summary.wouldCreate} alreadyOnChain=${filtered.summary.alreadyOnChain} skippedLeagues=${filtered.summary.skippedLeagues}`,
    );
    return;
  }

  if (onlyFixtureIds.length > 0) {
    const { selectTestFixtures } = await import(
      "../lib/football/select-test-fixtures"
    );
    const { applyTestBatchMetadata } = await import(
      "../lib/admin/test-batch-service"
    );
    const { mapFixtureToMarketGroup } = await import(
      "../lib/football/map-fixture-to-market-group"
    );
    const { createMatchMarketGroupOnChain, loadExistingFixtureTags } =
      await import("../lib/oddmaki/match-market-bot");
    const { createBotWalletContext } = await import(
      "../lib/oddmaki/server-bot-client"
    );
    const { createReadOnlyClient } = await import(
      "../lib/admin/fixtures-service"
    );
    const { BOT_VENUE_ID, fixtureTag } = await import(
      "../lib/football/constants"
    );
    const { maybeDelayImportBatch } = await import("../lib/rpc/concurrency");

    const selection = await selectTestFixtures();
    const existingTags = await loadExistingFixtureTags(
      createReadOnlyClient(),
      BOT_VENUE_ID,
    );
    const { client, publicClient, address } = createBotWalletContext();
    const results = [];

    for (let index = 0; index < onlyFixtureIds.length; index++) {
      const fixtureId = onlyFixtureIds[index];

      await maybeDelayImportBatch(index);

      const item = selection.selected.find((s) => s.fixtureId === fixtureId);

      if (!item) {
        results.push({ fixtureId, status: "failed", error: "Not in selection" });
        continue;
      }

      const tag = fixtureTag(fixtureId);

      if (existingTags.has(tag)) {
        results.push({
          fixtureId,
          status: "skipped",
          reason: `Market already exists (${tag})`,
        });
        continue;
      }

      const prepared = applyTestBatchMetadata(mapFixtureToMarketGroup(item.row));
      console.log(`Creating fixture ${fixtureId} (${item.leagueName})…`);

      const onChain = await createMatchMarketGroupOnChain(
        client,
        publicClient,
        BOT_VENUE_ID,
        address,
        prepared,
      );

      if (onChain.status === "created") {
        existingTags.add(tag);
        results.push({
          fixtureId,
          status: "created",
          groupId: onChain.groupId,
          txHashes: onChain.txHashes,
        });
      } else {
        results.push({
          fixtureId,
          status: "failed",
          error: onChain.error,
        });
      }
    }

    console.log(JSON.stringify({ results }, null, 2));
    return;
  }

  console.log("Creating test batch on-chain…");
  const result = await runTestBatchCreate();
  console.log(JSON.stringify(result, null, 2));
  console.log(
    `\nSummary: created=${result.summary.created} skipped=${result.summary.skipped} failed=${result.summary.failed}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
