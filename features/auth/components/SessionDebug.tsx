"use client";

import { useSession } from "../hooks/useSession";

/** Dev-only overlay for auth / wallet state. */
export function SessionDebug() {
  if (process.env.NODE_ENV !== "development") return null;

  const {
    isReady,
    isLoggedIn,
    address,
    loginMethod,
    privyAuthenticated,
    wagmiConnected,
  } = useSession();

  return (
    <div
      className="fixed bottom-2 left-2 z-[9999] max-w-xs rounded-lg border border-default-200 bg-background/95 p-2 font-mono text-[10px] leading-relaxed text-default-600 shadow-lg backdrop-blur"
      aria-hidden
    >
      <div className="mb-1 font-semibold text-default-800">Session debug</div>
      <div>ready: {String(isReady)}</div>
      <div>privyAuthenticated: {String(privyAuthenticated)}</div>
      <div>wagmiConnected: {String(wagmiConnected)}</div>
      <div>address: {address ?? "—"}</div>
      <div>loginMethod: {loginMethod ?? "—"}</div>
      <div className="font-semibold text-primary">
        isLoggedIn: {String(isLoggedIn)}
      </div>
    </div>
  );
}
