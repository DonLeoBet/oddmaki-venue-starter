"use server";

import type { AdminCreateResult } from "@/lib/admin/fixtures-service";

import {
  createFixtureMarket,
  listAdminFixtures,
} from "@/lib/admin/fixtures-service";
import {
  runTestBatchCreate,
  runTestBatchDryRun,
  type TestBatchCreateResult,
  type TestBatchDryRunResult,
} from "@/lib/admin/test-batch-service";
import { OUTRIGHT_SEASON_YEAR } from "@/config/top-leagues";
import {
  OutrightFetchError,
  runFetchOutrightsJob,
} from "@/lib/cron/fetch-outrights-job";
import { requireAdminSession } from "@/lib/server/admin-session";

export async function adminListFixtures(options: {
  page?: number;
  leagueId?: number;
}) {
  await requireAdminSession();

  const data = await listAdminFixtures(options);

  return { ok: true as const, ...data };
}

export async function adminCreateFixtureMarket(options: {
  fixtureId: number;
  dryRun: boolean;
}): Promise<{
  ok: true;
  dryRun: boolean;
  result: AdminCreateResult;
}> {
  await requireAdminSession();

  const data = await createFixtureMarket(options);

  return { ok: true, dryRun: data.dryRun, result: data.result };
}

export async function adminFetchOutrights(options: {
  dryRun: boolean;
  leagueIds?: number[];
  season?: number;
}) {
  await requireAdminSession();

  try {
    const summary = await runFetchOutrightsJob({
      dryRun: options.dryRun,
      season: options.season ?? OUTRIGHT_SEASON_YEAR,
      leagueIds: options.leagueIds?.filter((id) => Number.isFinite(id) && id > 0),
    });

    return { ok: true as const, ...summary };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const leagueErrors =
      error instanceof OutrightFetchError ? error.leagueErrors : undefined;

    throw new Error(
      leagueErrors ?
        `${message} (${JSON.stringify(leagueErrors)})`
      : message,
    );
  }
}

export async function adminTestBatchDryRun(): Promise<TestBatchDryRunResult> {
  await requireAdminSession();

  return runTestBatchDryRun();
}

export async function adminTestBatchCreate(): Promise<TestBatchCreateResult> {
  await requireAdminSession();

  return runTestBatchCreate();
}
