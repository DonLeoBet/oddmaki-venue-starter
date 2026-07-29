"use client";

import { useEffect, useState } from "react";

import { formatCountdown } from "../lib/format";

/**
 * Live, client-side countdown to `closeTime` (unix seconds, bigint).
 *
 * Recomputes the formatted string once per second so the displayed time
 * ticks down in realtime without needing fresh data from the chain.
 * Stops ticking once the target has passed.
 */
export function useCountdown(closeTime: bigint): string {
  const [display, setDisplay] = useState(() => formatCountdown(closeTime));

  useEffect(() => {
    setDisplay(formatCountdown(closeTime));

    const interval = setInterval(() => {
      const next = formatCountdown(closeTime);

      setDisplay(next);
      if (next === "Expired") clearInterval(interval);
    }, 1_000);

    return () => clearInterval(interval);
  }, [closeTime]);

  return display;
}
