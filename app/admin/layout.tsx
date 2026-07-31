import { BRAND_CONFIG } from "@/config/brand.config";
import { AdminSessionGate } from "@/features/admin/components/AdminSessionGate";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-0 flex-1"
      style={{ backgroundColor: BRAND_CONFIG.theme.backgroundColor }}
    >
      <AdminSessionGate>{children}</AdminSessionGate>
    </div>
  );
}
