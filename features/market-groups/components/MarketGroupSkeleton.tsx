"use client";

import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import { Skeleton } from "@heroui/skeleton";

export function MarketGroupSkeleton() {
  return (
    <Card className="w-full h-[180px]">
      <CardHeader className="flex flex-col items-start gap-2 pt-4 pb-0 flex-shrink-0">
        <Skeleton className="h-4 w-full rounded" />
        <Skeleton className="h-4 w-2/3 rounded" />
      </CardHeader>

      <CardBody className="gap-0 py-2 flex-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between py-1.5 gap-3"
          >
            <Skeleton className="h-4 flex-1 rounded" />
            <div className="flex items-center gap-3 flex-shrink-0">
              <Skeleton className="h-4 w-8 rounded" />
              <div className="flex gap-1">
                <Skeleton className="h-5 w-10 rounded" />
                <Skeleton className="h-5 w-10 rounded" />
              </div>
            </div>
          </div>
        ))}
      </CardBody>

      <CardFooter className="flex-shrink-0">
        <Skeleton className="h-3 w-20 rounded" />
      </CardFooter>
    </Card>
  );
}
