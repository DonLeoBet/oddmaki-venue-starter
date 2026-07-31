import { VAULT_CONFIG, type HousePoolStatus } from "@/config/vault.config";

export interface SafeVaultConfig {
  estimatedApyPercent: number;
  demoStats: {
    tvlUsd: number;
    totalRewardsPaidUsd: number;
    housePoolStatus: HousePoolStatus;
    utilizationPercent: number;
    activeMarketsBacked: number;
  };
  minDepositUsd: number;
  faq: { question: string; answer: string }[];
}

const FALLBACK_VAULT_CONFIG: SafeVaultConfig = {
  estimatedApyPercent: 18.5,
  demoStats: {
    tvlUsd: 0,
    totalRewardsPaidUsd: 0,
    housePoolStatus: "paused",
    utilizationPercent: 0,
    activeMarketsBacked: 0,
  },
  minDepositUsd: 100,
  faq: [],
};

/** Safe loader — never throws; returns fallbacks if config is missing or invalid. */
export function getVaultConfigSafe(): SafeVaultConfig {
  try {
    const cfg = VAULT_CONFIG;

    if (!cfg || typeof cfg !== "object") {
      return FALLBACK_VAULT_CONFIG;
    }

    return {
      estimatedApyPercent: Number(cfg.estimatedApyPercent) || 0,
      demoStats: {
        tvlUsd: Number(cfg.demoStats?.tvlUsd) || 0,
        totalRewardsPaidUsd: Number(cfg.demoStats?.totalRewardsPaidUsd) || 0,
        housePoolStatus: cfg.demoStats?.housePoolStatus ?? "paused",
        utilizationPercent: Number(cfg.demoStats?.utilizationPercent) || 0,
        activeMarketsBacked: Number(cfg.demoStats?.activeMarketsBacked) || 0,
      },
      minDepositUsd: Number(cfg.minDepositUsd) || 100,
      faq: Array.isArray(cfg.faq) ? [...cfg.faq] : [],
    };
  } catch (error) {
    console.error("[vault] getVaultConfigSafe failed:", error);

    return FALLBACK_VAULT_CONFIG;
  }
}
