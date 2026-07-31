import {
  buildSubgraphGatewayUrl,
  createOddMakiClient,
  type OddMakiClient,
} from "@oddmaki-protocol/sdk";
import { mnemonicToAccount } from "viem/accounts";
import { createWalletClient, type Account, type Address } from "viem";

import { ACTIVE_CHAIN } from "@/lib/oddmaki/chain";
import {
  createResilientTransport,
  getPublicClient,
  logRpcClientConfig,
} from "@/lib/rpc/baseClient";

export interface BotWalletContext {
  client: OddMakiClient;
  publicClient: ReturnType<typeof getPublicClient>;
  account: Account;
  address: Address;
}

/**
 * Initialize a server-side OddMaki client backed by the operator bot wallet.
 * Uses viem (same stack as the frontend) with OPERATOR_BOT_MNEMONIC.
 */
export function createBotWalletContext(): BotWalletContext {
  const mnemonic = process.env.OPERATOR_BOT_MNEMONIC?.trim();

  if (!mnemonic) {
    throw new Error(
      "Missing OPERATOR_BOT_MNEMONIC for automated market creation.",
    );
  }

  const account = mnemonicToAccount(mnemonic);
  const transport = createResilientTransport({ bot: true });
  const publicClient = getPublicClient({ bot: true });
  const walletClient = createWalletClient({
    account,
    chain: ACTIVE_CHAIN,
    transport,
  });

  logRpcClientConfig("bot-wallet");

  const graphApiKey =
    process.env.GRAPH_API_KEY ?? process.env.NEXT_PUBLIC_GRAPH_API_KEY;
  const subgraphEndpoint = graphApiKey
    ? buildSubgraphGatewayUrl(ACTIVE_CHAIN.id, graphApiKey)
    : undefined;

  const client = createOddMakiClient({
    chain: ACTIVE_CHAIN,
    transport,
    walletClient,
    account,
    subgraphEndpoint,
  });

  return { client, publicClient, account, address: account.address };
}
