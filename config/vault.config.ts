/**
 * Liquidity Vault — investor-facing copy and demo metrics.
 * Replace demo stats with on-chain reads when Vault v1 launches.
 */

export type HousePoolStatus = "active" | "paused" | "full";

export const VAULT_CONFIG = {
  /** Projected net APY shown to investors (fee share + spread capture). */
  estimatedApyPercent: 18.5,

  /** Demo pool metrics for investor previews until vault contracts go live. */
  demoStats: {
    tvlUsd: 125_000,
    totalRewardsPaidUsd: 18_420,
    housePoolStatus: "active" as HousePoolStatus,
    utilizationPercent: 72,
    activeMarketsBacked: 48,
  },

  /** Minimum deposit hint (USDC). */
  minDepositUsd: 100,

  faq: [
    {
      question: "What is the Liquidity Vault?",
      answer:
        "The Liquidity Vault is the platform's House Pool. Investors deposit USDC that the venue uses as counterparty liquidity across prediction markets — football match markets, crypto price feeds, and more. You earn a pro-rata share of trading fees and house-edge capture instead of taking directional bets yourself.",
    },
    {
      question: "How do I earn yield?",
      answer:
        "When traders buy and sell on {brand} markets, the protocol collects trading fees and spread. A configurable share is routed to vault depositors. Your yield scales with your share of total vault TVL and overall platform volume. The displayed APY is an estimate based on projected volume, not a guaranteed return.",
    },
    {
      question: "What risks should I know about?",
      answer:
        "Vault capital can act as the house across open markets. If traders win more than the house captures in fees and spread, vault NAV can decline. Smart-contract, oracle, and market-resolution risks apply. Only deposit capital you can afford to lock while markets are open. This dashboard is not financial advice.",
    },
    {
      question: "When can I withdraw?",
      answer:
        "Withdrawals are subject to a utilization buffer: if a large share of vault USDC is reserved as open-market exposure, partial withdrawals may queue until positions settle. Idle liquidity withdraws immediately once the on-chain vault is live.",
    },
    {
      question: "Why stake instead of trading?",
      answer:
        "Staking suits investors who want diversified exposure to platform revenue without picking individual outcomes. You provide cold-start liquidity so new markets launch with tight spreads from day one — and participate in the upside as volume grows.",
    },
  ],
} as const;
