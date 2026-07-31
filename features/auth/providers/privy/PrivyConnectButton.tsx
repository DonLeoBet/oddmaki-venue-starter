"use client";

import type { ConnectButtonProps } from "../../types";

import React from "react";
import { Button } from "@heroui/button";

import { UserSettings } from "../../components/UserSettings";
import { useSession } from "../../hooks/useSession";

export function PrivyConnectButton(_props: ConnectButtonProps) {
  const { isReady, isLoggedIn, address, login, logout } = useSession();
  const [bootTimedOut, setBootTimedOut] = React.useState(false);

  React.useEffect(() => {
    if (isReady) {
      setBootTimedOut(false);

      return;
    }

    const timer = window.setTimeout(() => setBootTimedOut(true), 8_000);

    return () => window.clearTimeout(timer);
  }, [isReady]);

  if (!isReady && !bootTimedOut) {
    return (
      <Button isDisabled isLoading size="sm">
        Loading...
      </Button>
    );
  }

  if (!isLoggedIn || !address) {
    return (
      <Button
        className="sm:text-sm px-3 sm:px-4 min-w-0 font-semibold"
        color="primary"
        size="sm"
        onPress={() => login()}
      >
        Log in
      </Button>
    );
  }

  return <UserSettings address={address} disconnect={logout} />;
}
