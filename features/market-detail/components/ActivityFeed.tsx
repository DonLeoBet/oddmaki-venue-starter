"use client";

import type { ActivityRow } from "../hooks/useMarketActivity";

import { useEffect, useRef } from "react";
import NextLink from "next/link";
import { Skeleton } from "@heroui/skeleton";
import { Button } from "@heroui/button";

import { useMarketActivity } from "../hooks/useMarketActivity";

import { ACTIVE_CHAIN } from "@/lib/oddmaki/chain";
import { AddressAvatar, generatePseudonym } from "@/lib/identity";

interface ActivityFeedProps {
  marketId: string;
  outcomes: string[];
  tickSize: string;
}

function tickToCents(tick: string, tickSize: string): string {
  const t = parseFloat(tick);
  const ts = parseFloat(tickSize);

  if (t === 0 || ts === 0) return "0.0";
  const price = (t * ts) / 1e18;

  return (price * 100).toFixed(1);
}

function formatQty(qty: string): string {
  const num = parseFloat(qty) / 1e6;

  if (num === 0) return "0";
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  if (num < 0.01) return num.toFixed(4);
  if (num < 1) return num.toFixed(2);

  return Math.round(num).toString();
}

function formatCost(cost: string): string {
  const num = parseFloat(cost) / 1e6;

  if (num < 1) return `$${num.toFixed(2)}`;
  if (num < 1000) return `$${Math.round(num)}`;
  if (num < 1_000_000) return `$${(num / 1000).toFixed(1)}K`;

  return `$${(num / 1_000_000).toFixed(2)}M`;
}

function timeAgo(timestamp: string): string {
  const seconds = Math.max(
    0,
    Math.floor(Date.now() / 1000 - parseInt(timestamp)),
  );

  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`;

  return new Date(parseInt(timestamp) * 1000).toLocaleDateString();
}

function txUrl(hash: string): string | null {
  const base = ACTIVE_CHAIN.blockExplorers?.default.url;

  return base ? `${base}/tx/${hash}` : null;
}

function ActivityItem({
  row,
  outcomes,
  tickSize,
}: {
  row: ActivityRow;
  outcomes: string[];
  tickSize: string;
}) {
  const outcomeName =
    outcomes[row.outcome] ?? (row.outcome === 0 ? "Yes" : "No");
  const outcomeColor = row.outcome === 0 ? "text-primary" : "text-secondary";
  const url = txUrl(row.transactionHash);

  return (
    <div className="flex items-center justify-between gap-3 py-2.5 border-b border-default-100 last:border-0">
      <div className="flex items-center gap-2.5 min-w-0">
        <AddressAvatar address={row.trader} size={26} />
        <div className="text-sm leading-tight min-w-0">
          <span className="text-default-700">
            <NextLink
              className="font-medium hover:text-primary transition-colors"
              href={`/trader/${row.trader}`}
            >
              {generatePseudonym(row.trader)}
            </NextLink>{" "}
            <span className="text-default-500">{row.side}</span>{" "}
            <span className="font-medium">{formatQty(row.amount)}</span>{" "}
            <span className={`font-medium ${outcomeColor}`}>{outcomeName}</span>{" "}
            <span className="text-default-500">
              at {tickToCents(row.tick, tickSize)}¢
            </span>{" "}
            <span className="text-default-500">({formatCost(row.cost)})</span>
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0 text-xs text-default-400">
        <span>{timeAgo(row.timestamp)}</span>
        {url && (
          <a
            aria-label="View transaction"
            className="hover:text-primary transition-colors"
            href={url}
            rel="noopener noreferrer"
            target="_blank"
          >
            <ExternalLinkIcon />
          </a>
        )}
      </div>
    </div>
  );
}

function ExternalLinkIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="13"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="13"
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" x2="21" y1="14" y2="3" />
    </svg>
  );
}

export function ActivityFeed({
  marketId,
  outcomes,
  tickSize,
}: ActivityFeedProps) {
  const { rows, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useMarketActivity(marketId);

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = sentinelRef.current;

    if (!node || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) fetchNextPage();
      },
      { rootMargin: "200px" },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="py-6 text-center">
        <p className="text-sm text-default-500">No activity yet</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {rows.map((row) => (
        <ActivityItem
          key={row.key}
          outcomes={outcomes}
          row={row}
          tickSize={tickSize}
        />
      ))}
      <div ref={sentinelRef} className="h-px" />
      {hasNextPage && (
        <div className="flex justify-center py-3">
          <Button
            isLoading={isFetchingNextPage}
            size="sm"
            variant="flat"
            onPress={() => fetchNextPage()}
          >
            Load more
          </Button>
        </div>
      )}
      {!hasNextPage && rows.length > 0 && (
        <div className="text-center py-3 text-xs text-default-400">
          End of activity
        </div>
      )}
    </div>
  );
}
