import { NextResponse } from "next/server";

/**
 * Shared-secret Bearer auth for admin API routes (`/api/admin/*`).
 * Set ADMIN_SECRET in env; callers send `Authorization: Bearer <token>`.
 */
function readBearerToken(request: Request): string | null {
  const auth = request.headers.get("authorization");

  if (!auth?.startsWith("Bearer ")) return null;

  const token = auth.slice("Bearer ".length).trim();

  return token || null;
}

/** Returns a 401 NextResponse when unauthorized; `null` when the request may proceed. */
export function requireAdminAuth(request: Request): NextResponse | null {
  const secret = process.env.ADMIN_SECRET?.trim();

  if (!secret) {
    return NextResponse.json({ error: "ADMIN_SECRET not set" }, { status: 401 });
  }

  const token = readBearerToken(request);

  if (!token) {
    return NextResponse.json(
      { error: "Missing Authorization header" },
      { status: 401 },
    );
  }

  if (token !== secret) {
    return NextResponse.json({ error: "Invalid admin token" }, { status: 401 });
  }

  return null;
}

/**
 * Shared-secret Bearer auth for cron routes (`/api/cron/*`).
 * Vercel cron jobs send `Authorization: Bearer ${CRON_SECRET}` automatically.
 */
export function requireCronAuth(request: Request): NextResponse | null {
  const secret = process.env.CRON_SECRET?.trim();

  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not set" }, { status: 401 });
  }

  const token = readBearerToken(request);

  if (!token) {
    return NextResponse.json(
      { error: "Missing Authorization header" },
      { status: 401 },
    );
  }

  if (token !== secret) {
    return NextResponse.json({ error: "Invalid cron token" }, { status: 401 });
  }

  return null;
}
