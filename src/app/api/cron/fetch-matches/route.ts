import { NextRequest, NextResponse } from "next/server";

import {
  logFetchMatchesError,
  runFetchMatchesJob,
} from "@/lib/cron/fetch-matches-job";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function authorizeCron(request: NextRequest): NextResponse | null {
  const secret = process.env.CRON_SECRET;

  if (!secret) return null;

  const auth = request.headers.get("authorization");

  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

async function handleRequest(request: NextRequest): Promise<NextResponse> {
  const denied = authorizeCron(request);

  if (denied) return denied;

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
