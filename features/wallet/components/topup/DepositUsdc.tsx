"use client";

import type { TopUpProps } from "./types";

import React, { useState } from "react";
import { Button } from "@heroui/button";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";
import { toast } from "sonner";

import { authConfig, useSession } from "@/features/auth";
import { ACTIVE_CHAIN } from "@/lib/oddmaki/chain";

/**
 * No KYC — user sends USDC on Base to their own wallet address.
 * Works with Privy embedded wallets (Gmail/X login) and external wallets.
 */
export function DepositUsdc({ className, label }: TopUpProps) {
  const { isLoggedIn, address } = useSession();
  const [open, setOpen] = useState(false);

  const handleOpen = () => {
    if (!isLoggedIn || !address) {
      toast.message("Log in first", {
        description: "Sign in to see your deposit address.",
      });

      return;
    }

    setOpen(true);
  };

  const handleCopy = async () => {
    if (!address) return;

    await navigator.clipboard.writeText(address);
    toast.success("Address copied", {
      description: "Send USDC on Base to this address.",
    });
  };

  return (
    <>
      <Button className={className} color="primary" size="sm" onPress={handleOpen}>
        {label ?? "Deposit"}
      </Button>

      <Modal isOpen={open} onOpenChange={setOpen}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Deposit USDC
              </ModalHeader>
              <ModalBody className="gap-3">
                <p className="text-sm text-default-500">
                  {authConfig.provider === "privy"
                    ? "Your account includes a built-in wallet — no KYC required. Send USDC on Base from an exchange or another wallet."
                    : "Send USDC on Base to your connected wallet address."}
                </p>
                <div className="rounded-lg bg-default-100 p-3 font-mono text-xs break-all">
                  {address}
                </div>
                <p className="text-xs text-default-400">
                  Network: {ACTIVE_CHAIN.name} (chain ID {ACTIVE_CHAIN.id}) ·
                  Token: USDC
                </p>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Close
                </Button>
                <Button color="primary" onPress={handleCopy}>
                  Copy address
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
