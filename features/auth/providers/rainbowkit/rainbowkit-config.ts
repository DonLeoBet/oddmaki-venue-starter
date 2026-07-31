/**
 * RainbowKit — wallet-only login (MetaMask, Coinbase, WalletConnect, injected).
 *
 * Use for admin/dev or crypto-native users. Does NOT support Gmail / X login —
 * for that, set NEXT_PUBLIC_AUTH_PROVIDER=privy (see config/auth.config.ts).
 *
 * WalletConnect requires your domain on https://cloud.reown.com allowlist.
 */

import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  coinbaseWallet,
  injectedWallet,
  metaMaskWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { createConfig } from "wagmi";

import { isWalletConnectEnabled } from "@/config/auth.config";
import { BRAND_CONFIG } from "@/config/brand.config";
import { venueConfig } from "@/config/venue.config";

import { supportedChains, transports } from "../../utils/wagmi-shared";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_ID;

const walletGroups = [
  {
    groupName: "Popular",
    wallets: [metaMaskWallet, coinbaseWallet, injectedWallet],
  },
  ...(isWalletConnectEnabled()
    ? [
        {
          groupName: "Mobile",
          wallets: [walletConnectWallet],
        },
      ]
    : []),
];

const connectors = connectorsForWallets(walletGroups, {
  appName: venueConfig.branding.name,
  projectId: projectId ?? "00000000000000000000000000000000",
  appUrl: `https://${BRAND_CONFIG.domain}`,
});

export const rainbowkitWagmiConfig = createConfig({
  chains: supportedChains,
  transports,
  connectors,
  ssr: true,
});
