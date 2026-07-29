"use client";

import { Card, CardBody, CardHeader } from "@heroui/card";
import { Skeleton } from "@heroui/skeleton";

import { useDpmActivity } from "../hooks/useDpmActivity";
import { formatUsdc } from "../lib/format";

import { AddressAvatar, generatePseudonym } from "@/lib/identity";

function timeAgo(ts: string): string {
  const s = Math.max(0, Math.floor(Date.now() / 1000 - parseInt(ts)));

  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;

  return `${Math.floor(s / 86400)}d`;
}

const outcomeColor = (i: number): string =>
  i === 0 ? "text-primary" : i === 1 ? "text-secondary" : "text-default-500";

interface DpmActivityProps {
  marketId: string;
  /** Render without the surrounding Card (e.g. inside a tab panel). */
  bare?: boolean;
}

export function DpmActivity({ marketId, bare = false }: DpmActivityProps) {
  const { data: entries, isLoading } = useDpmActivity(marketId);

  const body = (
    <div className="flex flex-col gap-2">
      {isLoading ? (
        Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-full rounded" />
        ))
      ) : !entries || entries.length === 0 ? (
        <p className="py-6 text-center text-sm text-default-400">
          No pool entries yet
        </p>
      ) : (
        entries.map((e) => {
          const addr = e.trader.address;

          return (
            <div
              key={e.id}
              className="flex items-center justify-between gap-2 text-sm"
            >
              <div className="flex min-w-0 items-center gap-1.5">
                <AddressAvatar address={addr} size={20} />
                <span className="truncate text-default-600">
                  {generatePseudonym(addr)}
                </span>
                <span className="text-default-400">added</span>
                <span className="font-semibold">{formatUsdc(e.amount)}</span>
                <span className="text-default-400">to</span>
                <span className={`font-semibold ${outcomeColor(e.outcome)}`}>
                  {e.outcomeLabel}
                </span>
              </div>
              <span className="flex-shrink-0 text-xs text-default-400">
                {timeAgo(e.timestamp)}
              </span>
            </div>
          );
        })
      )}
    </div>
  );

  if (bare) return body;

  return (
    <Card>
      <CardHeader className="text-sm font-semibold">Activity</CardHeader>
      <CardBody className="pt-0">{body}</CardBody>
    </Card>
  );
}
