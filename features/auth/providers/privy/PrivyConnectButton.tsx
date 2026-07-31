"use client";

import type { ConnectButtonProps } from "../../types";

import React from "react";
import { Button } from "@heroui/button";

import { UserSettings } from "../../components/UserSettings";
import { useSession } from "../../hooks/useSession";

export function PrivyConnectButton(_props: ConnectButtonProps) {
  const { isReady, isLoggedIn, address, login, logout } = useSession();

  if (!isReady) {
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
