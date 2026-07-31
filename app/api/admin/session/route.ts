import { NextResponse } from "next/server";

import {
  clearAdminSession,
  establishAdminSession,
  hasAdminSession,
} from "@/lib/server/admin-session";

/** Check whether the browser has a valid admin session cookie. */
export async function GET() {
  const authenticated = await hasAdminSession();

  return NextResponse.json({ ok: true, authenticated });
}

/** Exchange ADMIN_SECRET for an httpOnly session cookie (one-time token entry in UI). */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { token?: string };
    const token = body.token?.trim();

    if (!token) {
      return NextResponse.json(
        { ok: false, error: "token is required" },
        { status: 400 },
      );
    }

    const ok = await establishAdminSession(token);

    if (!ok) {
      return NextResponse.json(
        { ok: false, error: "Invalid admin token" },
        { status: 401 },
      );
    }

    return NextResponse.json({ ok: true, authenticated: true });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request" },
      { status: 400 },
    );
  }
}

export async function DELETE() {
  await clearAdminSession();

  return NextResponse.json({ ok: true, authenticated: false });
}
