"use client";

import { useState, useEffect } from "react";
import { Button } from "@heroui/button";

import { useSession } from "@/features/auth";
import { useTokenBalance } from "../hooks/useTokenBalance";

export function WalletPanel() {
  const [mounted, setMounted] = useState(false);
  const { isLoggedIn } = useSession();
  const { formatted, isLoading } = useTokenBalance();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isLoggedIn) return null;

  const balanceLabel = isLoading ? (
    "..."
  ) : (
    <>
      <span className="sm:hidden">${formatted}</span>
      <span className="hidden sm:inline">${formatted} USDC</span>
    </>
  );

  // Plain, non-interactive balance display. Funding lives in the TopUp button.
  return (
    <Button
      disableRipple
      className="sm:text-sm px-2 sm:px-4 min-w-0 pointer-events-none"
      size="sm"
      variant="flat"
    >
      {balanceLabel}
    </Button>
  );
}
