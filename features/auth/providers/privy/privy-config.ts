/**
 * Privy — social login (email, Google, X, Apple, wallet) with embedded wallets.
 * No KYC for login or wallet creation. Users fund by sending USDC on Base.
 *
 * Dashboard: https://dashboard.privy.io
 *  - Login methods: email, Google, Twitter, Apple, wallet
 *  - App URL: https://poly.football (OAuth)
 *  - Skip Funding/on-ramp unless you want card deposits (KYC)
 */

import type { PrivyClientConfig } from "@privy-io/react-auth";

import {
  getPrivyLogoUrl,
  PRIVY_LOGIN_METHODS,
} from "@/config/auth.config";
import { BRAND_CONFIG } from "@/config/brand.config";
import { ACTIVE_CHAIN } from "@/lib/oddmaki/chain";

export const privyConfig: PrivyClientConfig = {
  loginMethods: PRIVY_LOGIN_METHODS,
  appearance: {
    theme: "dark",
    accentColor: BRAND_CONFIG.theme.primaryColor as `#${string}`,
    logo: getPrivyLogoUrl(),
    showWalletLoginFirst: false,
  },
  embeddedWallets: {
    ethereum: {
      /** Social / email users get an in-app wallet automatically */
      createOnLogin: "users-without-wallets",
    },
  },
  supportedChains: [ACTIVE_CHAIN],
  defaultChain: ACTIVE_CHAIN,
};
