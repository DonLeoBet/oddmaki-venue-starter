import { NextRequest, NextResponse } from "next/server";

import {
  logFetchOutrightsError,
  runFetchOutrightsJob,
} from "@/lib/cron/fetch-outrights-job";
import { requireCronAuth } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Outright sync cron — requires Authorization: Bearer ${CRON_SECRET}.
 */
async function handleRequest(request: NextRequest): Promise<NextResponse> {
  const authError = requireCronAuth(request);

  if (authError) return authError;

  try {
    const summary = await runFetchOutrightsJob();

    return NextResponse.json({ ok: true, ...summary }, { status: 200 });
  } catch (error) {
    logFetchOutrightsError("Unhandled outright cron failure", error);
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
