import { NextResponse } from "next/server";

import { OUTRIGHT_SEASON_YEAR } from "@/config/top-leagues";
import {
  OutrightFetchError,
  runFetchOutrightsJob,
} from "@/lib/cron/fetch-outrights-job";
import { requireAdminAuth } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: Request) {
  const authError = requireAdminAuth(request);

  if (authError) return authError;

  try {
    const body = (await request.json().catch(() => ({}))) as {
      dryRun?: boolean;
      leagueIds?: number[];
      leagueId?: number;
      season?: number;
    };

    const leagueIds =
      body.leagueIds ??
      (body.leagueId != null ? [Number(body.leagueId)] : undefined);

    const summary = await runFetchOutrightsJob({
      dryRun: body.dryRun ?? false,
      season: body.season ?? OUTRIGHT_SEASON_YEAR,
      leagueIds:
        leagueIds?.filter((id) => Number.isFinite(id) && id > 0) ?? undefined,
    });

    return NextResponse.json({ ok: true, ...summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const leagueErrors =
      error instanceof OutrightFetchError ? error.leagueErrors : undefined;

    console.error("[api/admin/outrights/fetch]", message, error);

    return NextResponse.json(
      { ok: false, error: message, leagueErrors },
      { status: 500 },
    );
  }
}
