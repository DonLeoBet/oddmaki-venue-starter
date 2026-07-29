import {
  buildSubgraphGatewayUrl,
  createOddMakiClient,
  type OddMakiClient,
} from "@oddmaki-protocol/sdk";
import { privateKeyToAccount } from "viem/accounts";
import {
  createPublicClient,
  createWalletClient,
  http,
  type Account,
  type Address,
  type PublicClient,
} from "viem";

import { ACTIVE_CHAIN } from "@/lib/oddmaki/chain";

function normalizePrivateKey(raw: string): `0x${string}` {
  const trimmed = raw.trim();

  return (trimmed.startsWith("0x") ? trimmed : `0x${trimmed}`) as `0x${string}`;
}

export interface BotWalletContext {
  client: OddMakiClient;
  publicClient: PublicClient;
  account: Account;
  address: Address;
}

/**
 * Initialize a server-side OddMaki client backed by the operator bot wallet.
 * Uses viem (same stack as the frontend) with OPERATOR_BOT_PRIVATE_KEY.
 */
export function createBotWalletContext(): BotWalletContext {
  const privateKeyRaw = process.env.OPERATOR_BOT_PRIVATE_KEY;

  if (!privateKeyRaw?.trim()) {
    throw new Error(
      "Missing OPERATOR_BOT_PRIVATE_KEY for automated market creation.",
    );
  }

  const account = privateKeyToAccount(normalizePrivateKey(privateKeyRaw));
  const rpcUrl =
    process.env.BOT_RPC_URL ??
    process.env.NEXT_PUBLIC_RPC_URL ??
    ACTIVE_CHAIN.rpcUrls.default.http[0];

  const transport = http(rpcUrl);
  const publicClient = createPublicClient({ chain: ACTIVE_CHAIN, transport });
  const walletClient = createWalletClient({
    account,
    chain: ACTIVE_CHAIN,
    transport,
  });

  const graphApiKey = process.env.GRAPH_API_KEY ?? process.env.NEXT_PUBLIC_GRAPH_API_KEY;
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
