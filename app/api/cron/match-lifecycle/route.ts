import { NextRequest, NextResponse } from "next/server";

import {
  logMatchLifecycleError,
  runMatchLifecycleJob,
} from "@/lib/cron/match-lifecycle-job";
import { requireCronAuth } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Auto-close finished fixtures (pause trading), assert from API-Football,
 * then settle/report undisputed UMA assertions.
 *
 * Vercel Hobby cannot schedule sub-daily crons — hit this every 10–15 min via
 * cron-job.org (or Pro) with Authorization: Bearer $CRON_SECRET.
 */
async function handleRequest(request: NextRequest): Promise<NextResponse> {
  const authError = requireCronAuth(request);

  if (authError) return authError;

  const dryRun =
    request.nextUrl.searchParams.get("dryRun") === "1" ||
    request.nextUrl.searchParams.get("dry_run") === "1";

  try {
    const summary = await runMatchLifecycleJob({ dryRun });

    return NextResponse.json({ ok: true, ...summary }, { status: 200 });
  } catch (error) {
    logMatchLifecycleError("Unhandled cron failure", error);
    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  return handleRequest(request);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return handleRequest(request);
}
