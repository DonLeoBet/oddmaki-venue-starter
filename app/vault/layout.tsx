import { BRAND_CONFIG } from "@/config/brand.config";

export const metadata = {
  title: `Liquidity Vault · ${BRAND_CONFIG.name}`,
  description: `Stake USDC in the ${BRAND_CONFIG.name} House Pool. Earn a share of trading fees and spread by backing prediction market liquidity.`,
};

export default function VaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
