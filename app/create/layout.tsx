import { BRAND_CONFIG } from "@/config/brand.config";

export const metadata = {
  title: `Create Market · ${BRAND_CONFIG.name}`,
  description: `Create a prediction market on ${BRAND_CONFIG.name}.`,
};

export default function CreateMarketLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
