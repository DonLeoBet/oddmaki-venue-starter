import { FixturesAdminPanel } from "@/features/admin/components/FixturesAdminPanel";
import { BRAND_CONFIG } from "@/config/brand.config";

export const metadata = {
  title: `Fixture Admin · ${BRAND_CONFIG.name}`,
};

export default function AdminFixturesPage() {
  return <FixturesAdminPanel />;
}
