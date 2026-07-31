"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@heroui/skeleton";

import { VaultErrorBoundary } from "@/features/vault/components/VaultErrorBoundary";

const VaultDashboard = dynamic(
  () =>
    import("@/features/vault/components/VaultDashboard").then(
      (mod) => mod.VaultDashboard,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col gap-4 pt-4">
        <Skeleton className="h-44 rounded-2xl" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    ),
  },
);

export default function VaultPage() {
  return (
    <VaultErrorBoundary>
      <VaultDashboard />
    </VaultErrorBoundary>
  );
}
