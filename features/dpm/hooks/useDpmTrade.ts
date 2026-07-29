"use client";

import type { FlowStep } from "@/lib/oddmaki/useTransactionFlow";

import { useCallback } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { parseUnits } from "viem";

import { useOddMakiClient } from "@/lib/oddmaki/hooks";
import { queryKeys } from "@/lib/oddmaki/queryKeys";
import {
  USDC_ADDRESS,
  DIAMOND_ADDRESS,
  USDC_DECIMALS,
} from "@/lib/oddmaki/constants";
import {
  useTransactionFlow,
  waitForAllowance,
} from "@/lib/oddmaki/useTransactionFlow";

/**
 * Pool (DPM) trading as a multi-step transaction flow — the same approve→action
 * pattern the CLOB uses. The USDC approval step polls `waitForAllowance` after
 * confirming, so the deposit never races a not-yet-propagated allowance (which
 * is what caused the intermittent `TransferFromFailed` on the first attempt).
 */
export function useDpmTrade(marketId: string) {
  const client = useOddMakiClient();
  const { address } = useAccount();
  const publicClient = usePublicClient();

  const flow = useTransactionFlow({
    invalidateKeys: [queryKeys.dpmMarket.all, queryKeys.balance.all],
  });

  const approvalStep = useCallback(
    (amount: string): FlowStep => {
      const usdcAmount = parseUnits(amount, USDC_DECIMALS);

      return {
        id: "usdc-approval",
        label: `Approve USDC ($${amount})`,
        shouldSkip: async () => {
          const allowance = (await client.token.getAllowance(
            USDC_ADDRESS,
            address!,
            DIAMOND_ADDRESS,
          )) as bigint;

          return allowance >= usdcAmount;
        },
        execute: async () => {
          const hash = await client.token.approve(
            USDC_ADDRESS,
            DIAMOND_ADDRESS,
            usdcAmount,
          );

          await publicClient!.waitForTransactionReceipt({ hash });
          await waitForAllowance(
            publicClient!,
            USDC_ADDRESS,
            address!,
            DIAMOND_ADDRESS,
            usdcAmount,
          );
        },
      };
    },
    [client, address, publicClient],
  );

  const enter = useCallback(
    (outcome: number, amount: string) =>
      flow.start([
        approvalStep(amount),
        {
          id: "add-to-pool",
          label: "Add to pool",
          execute: async () => {
            const hash = await client.dpm.enterSimple({
              marketId: BigInt(marketId),
              outcome: BigInt(outcome),
              amount,
            });

            await publicClient!.waitForTransactionReceipt({ hash });
          },
        },
      ]),
    [flow, approvalStep, client, publicClient, marketId],
  );

  const joinLobby = useCallback(
    (outcome: number, amount: string) =>
      flow.start([
        approvalStep(amount),
        {
          id: "join-lobby",
          label: "Add deposit",
          execute: async () => {
            const hash = await client.dpm.enterIntentSimple({
              marketId: BigInt(marketId),
              outcome: BigInt(outcome),
              amount,
            });

            await publicClient!.waitForTransactionReceipt({ hash });
          },
        },
      ]),
    [flow, approvalStep, client, publicClient, marketId],
  );

  const leaveLobby = useCallback(
    (outcome: number, amount: string) =>
      flow.start([
        {
          id: "leave-lobby",
          label: "Withdraw deposit",
          execute: async () => {
            const hash = await client.dpm.exitIntentSimple({
              marketId: BigInt(marketId),
              outcome: BigInt(outcome),
              amount,
            });

            await publicClient!.waitForTransactionReceipt({ hash });
          },
        },
      ]),
    [flow, client, publicClient, marketId],
  );

  const claim = useCallback(
    () =>
      flow.start([
        {
          id: "claim",
          label: "Claim payout",
          execute: async () => {
            const hash = await client.dpm.claim(BigInt(marketId));

            await publicClient!.waitForTransactionReceipt({ hash });
          },
        },
      ]),
    [flow, client, publicClient, marketId],
  );

  return { enter, joinLobby, leaveLobby, claim, flow };
}
