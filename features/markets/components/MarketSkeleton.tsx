"use client";

import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import { Skeleton } from "@heroui/skeleton";

export function MarketSkeleton() {
  return (
    <Card className="w-full h-[180px]">
      <CardHeader className="flex flex-col items-start gap-2 pb-0 flex-1">
        <div className="flex justify-between w-full items-start gap-3">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <Skeleton className="h-10 w-10 rounded-md shrink-0" />
            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-3/4 rounded" />
            </div>
          </div>
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
        </div>
      </CardHeader>

      <CardBody className="gap-2 py-2 flex-shrink-0 flex-grow-0">
        <div className="flex gap-2">
          <Skeleton className="h-9 flex-1 rounded-lg" />
          <Skeleton className="h-9 flex-1 rounded-lg" />
        </div>
      </CardBody>

      <CardFooter className="flex flex-col gap-1 pt-0 flex-shrink-0">
        <div className="flex justify-between w-full">
          <Skeleton className="h-3 w-16 rounded" />
          <Skeleton className="h-3 w-20 rounded" />
        </div>
      </CardFooter>
    </Card>
  );
}
