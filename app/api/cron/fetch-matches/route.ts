import { NextRequest, NextResponse } from "next/server";

import {
  logFetchMatchesError,
  runFetchMatchesJob,
} from "@/lib/cron/fetch-matches-job";
import { requireCronAuth } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Football fixture sync cron — creates on-chain market groups for upcoming matches.
 * Requires Authorization: Bearer ${CRON_SECRET} (Vercel cron sends this automatically).
 */
async function handleRequest(request: NextRequest): Promise<NextResponse> {
  const authError = requireCronAuth(request);

  if (authError) return authError;

  try {
    const summary = await runFetchMatchesJob();

    return NextResponse.json({ ok: true, ...summary }, { status: 200 });
  } catch (error) {
    logFetchMatchesError("Unhandled cron failure", error);
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
