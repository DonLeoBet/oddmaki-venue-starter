import { createHash, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

/** HttpOnly cookie name — never expose ADMIN_SECRET to the browser bundle. */
export const ADMIN_SESSION_COOKIE = "pf_admin_session";

const SESSION_MAX_AGE_S = 60 * 60 * 24 * 7; // 7 days

function sessionDigest(secret: string): string {
  return createHash("sha256").update(`pf-admin-v1:${secret}`).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  const bufA = new TextEncoder().encode(a);
  const bufB = new TextEncoder().encode(b);

  return timingSafeEqual(bufA, bufB);
}

export function getAdminSecret(): string | null {
  const secret = process.env.ADMIN_SECRET?.trim();

  return secret || null;
}

/** Expected cookie value derived from ADMIN_SECRET (not the raw secret). */
export function expectedAdminSessionValue(): string | null {
  const secret = getAdminSecret();

  if (!secret) return null;

  return sessionDigest(secret);
}

export async function hasAdminSession(): Promise<boolean> {
  const expected = expectedAdminSessionValue();

  if (!expected) return false;

  const cookie = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;

  return cookie != null && safeEqual(cookie, expected);
}

/** Throws when the caller is not authenticated via admin session cookie. */
export async function requireAdminSession(): Promise<void> {
  if (!(await hasAdminSession())) {
    throw new Error("Unauthorized");
  }
}

/** Validate raw token and set httpOnly session cookie. Returns false on mismatch. */
export async function establishAdminSession(token: string): Promise<boolean> {
  const secret = getAdminSecret();

  if (!secret) return false;

  if (!safeEqual(token.trim(), secret)) return false;

  const expected = sessionDigest(secret);

  (await cookies()).set(ADMIN_SESSION_COOKIE, expected, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_S,
  });

  return true;
}

export async function clearAdminSession(): Promise<void> {
  (await cookies()).set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
