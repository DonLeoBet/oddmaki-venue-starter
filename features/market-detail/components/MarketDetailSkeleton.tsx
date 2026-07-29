"use client";

import { Skeleton } from "@heroui/skeleton";
import { Card, CardHeader, CardBody } from "@heroui/card";

export function MarketDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header — title row + stats row */}
      <div className="flex flex-col gap-4">
        {/* Title row: back btn + image + title  |  status chip + settings */}
        <div className="flex items-start justify-between gap-2 sm:gap-4">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <Skeleton className="h-8 w-8 rounded-lg shrink-0 mt-0.5" />
            <Skeleton className="h-12 w-12 rounded-md shrink-0" />
            <div className="flex flex-col gap-2 flex-1 min-w-0 pt-1">
              <Skeleton className="h-6 sm:h-7 w-full rounded" />
              <Skeleton className="h-6 sm:h-7 w-2/3 rounded" />
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
        </div>

        {/* Stats row — YES chance (large) + Volume + Traders */}
        <div className="flex flex-wrap items-end gap-4 sm:gap-6">
          <Skeleton className="h-9 sm:h-10 w-56 rounded" />
          <div className="flex flex-col gap-1">
            <Skeleton className="h-3 w-14 rounded" />
            <Skeleton className="h-6 w-24 rounded" />
          </div>
          <div className="flex flex-col gap-1">
            <Skeleton className="h-3 w-14 rounded" />
            <Skeleton className="h-6 w-16 rounded" />
          </div>
        </div>
      </div>

      {/* Two-column body — matches grid-cols-[1fr_338px] from the page */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_338px] gap-4 items-start">
        {/* Left column */}
        <div className="flex flex-col gap-4 order-2 md:order-1">
          {/* Price chart */}
          <Card>
            <CardHeader className="flex justify-end items-center pb-0">
              <div className="flex items-center gap-1">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={`tf-${i}`} className="h-7 w-9 rounded-lg" />
                ))}
              </div>
            </CardHeader>
            <CardBody className="pt-2">
              <Skeleton className="h-[300px] w-full rounded-lg" />
            </CardBody>
          </Card>

          {/* Orderbook */}
          <Card>
            <CardHeader className="flex justify-between items-center pb-0 gap-2 flex-wrap">
              <Skeleton className="h-6 w-28 rounded" />
              <div className="flex items-center gap-1">
                <Skeleton className="h-8 w-14 rounded-lg" />
                <Skeleton className="h-8 w-14 rounded-lg" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
            </CardHeader>
            <CardBody className="px-0 pb-2">
              <div className="flex flex-col gap-1 px-2 py-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton
                    key={`ask-${i}`}
                    className="w-full h-7 rounded-md"
                  />
                ))}
                <div className="h-7 flex items-center px-2">
                  <Skeleton className="h-4 w-full rounded" />
                </div>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton
                    key={`bid-${i}`}
                    className="w-full h-7 rounded-md"
                  />
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Match orders button (full-width) */}
          <Skeleton className="h-10 w-full rounded-xl" />

          {/* Market description */}
          <div className="rounded-xl border border-default-200 p-4">
            <Skeleton className="h-6 w-32 rounded mb-3" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-3/4 rounded" />
            </div>
          </div>

          {/* User positions */}
          <Card>
            <CardHeader className="flex justify-between items-center pb-0">
              <Skeleton className="h-6 w-32 rounded" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </CardHeader>
            <CardBody className="gap-2">
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </CardBody>
          </Card>

          {/* User orders */}
          <Card>
            <CardHeader className="flex justify-between items-center pb-0">
              <Skeleton className="h-6 w-28 rounded" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </CardHeader>
            <CardBody className="gap-2">
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </CardBody>
          </Card>

          {/* Recent trades */}
          <Card>
            <CardHeader className="flex justify-between items-center pb-0">
              <Skeleton className="h-6 w-32 rounded" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </CardHeader>
            <CardBody className="gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton
                  key={`trade-${i}`}
                  className="h-9 w-full rounded-md"
                />
              ))}
            </CardBody>
          </Card>

          {/* Top holders */}
          <Card>
            <CardBody className="gap-1">
              <Skeleton className="h-6 w-32 rounded mb-1" />
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={`holder-${i}`}
                  className="flex items-center justify-between py-2"
                >
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-3 w-3 rounded" />
                    <Skeleton className="h-[22px] w-[22px] rounded-full" />
                    <Skeleton className="h-4 w-24 rounded" />
                  </div>
                  <Skeleton className="h-4 w-12 rounded" />
                </div>
              ))}
            </CardBody>
          </Card>
        </div>

        {/* Right column — trading + resolution */}
        <div className="flex flex-col gap-4 order-1 md:order-2">
          {/* Unified trading panel */}
          <Card>
            <CardHeader className="flex flex-col gap-3 pb-0">
              <div className="flex justify-between items-center w-full">
                <div className="flex gap-2">
                  <Skeleton className="h-7 w-12 rounded" />
                  <Skeleton className="h-7 w-12 rounded" />
                </div>
                <Skeleton className="h-7 w-20 rounded-lg" />
              </div>
              <div className="flex gap-1 w-full">
                <Skeleton className="h-8 flex-1 rounded-lg" />
                <Skeleton className="h-8 flex-1 rounded-lg" />
              </div>
            </CardHeader>
            <CardBody className="gap-3">
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-11 w-full rounded-lg" />
            </CardBody>
          </Card>

          {/* Resolution panel */}
          <Card>
            <CardHeader className="pb-0">
              <Skeleton className="h-6 w-32 rounded" />
            </CardHeader>
            <CardBody className="gap-3">
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-3 w-3/4 rounded" />
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
