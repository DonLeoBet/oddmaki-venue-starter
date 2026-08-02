import { NextRequest, NextResponse } from "next/server";

import {
  logResolutionAlertError,
  runResolutionAlertJob,
} from "@/lib/cron/resolution-alert-job";
import { requireCronAuth } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * Email alerts when a UMA resolution assertion is created on this venue.
 * Requires RESEND_API_KEY + RESOLUTION_ALERT_EMAIL.
 */
async function handleRequest(request: NextRequest): Promise<NextResponse> {
  const authError = requireCronAuth(request);

  if (authError) return authError;

  if (!process.env.RESOLUTION_ALERT_EMAIL?.trim()) {
    return NextResponse.json(
      { ok: false, error: "RESOLUTION_ALERT_EMAIL not configured" },
      { status: 503 },
    );
  }

  try {
    const summary = await runResolutionAlertJob();

    return NextResponse.json({ ok: true, ...summary }, { status: 200 });
  } catch (error) {
    logResolutionAlertError("Unhandled cron failure", error);
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
