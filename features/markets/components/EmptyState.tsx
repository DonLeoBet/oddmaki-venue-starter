"use client";

import { Card, CardBody } from "@heroui/card";

import { alpha, colors } from "@/lib/tokens";

interface EmptyStateProps {
  title?: string;
  description?: string;
}

export function EmptyState({
  title = "No markets found",
  description = "There are currently no active markets. Check back later!",
}: EmptyStateProps) {
  return (
    <Card
      className="w-full flex-1 min-h-[50vh] border border-default-100/50 bg-content1/30 shadow-sm"
      style={{
        boxShadow: `0 0 48px ${alpha(colors.neonCyan, 0.04)}`,
      }}
    >
      <CardBody className="flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="flex max-w-md flex-col items-center gap-3">
          <h3 className="text-2xl font-bold tracking-tight text-foreground">
            {title}
          </h3>
          <p className="text-base leading-relaxed text-default-400">
            {description}
          </p>
        </div>
      </CardBody>
    </Card>
  );
}
