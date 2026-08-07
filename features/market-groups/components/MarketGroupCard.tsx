"use client";

import type { FormattedMarketGroup, FormattedGroupOutcome } from "../types";

import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import { Avatar } from "@heroui/avatar";
import NextLink from "next/link";

import { MarketGroupStatus } from "../types";

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        clipRule="evenodd"
        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
        fillRule="evenodd"
      />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        clipRule="evenodd"
        d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z"
        fillRule="evenodd"
      />
    </svg>
  );
}

interface MarketGroupCardProps {
  group: FormattedMarketGroup;
}

function OutcomeRow({
  outcome,
  isWinner,
  isResolved,
}: {
  outcome: FormattedGroupOutcome;
  isWinner: boolean;
  isResolved: boolean;
}) {
  const yes = Math.round(outcome.probability);
  const no = Math.max(0, Math.min(100, 100 - yes));

  return (
    <div className="flex items-center justify-between py-2 gap-3">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Avatar
          className="flex-shrink-0"
          name={outcome.name}
          radius="sm"
          size="sm"
        />
        <span className="text-sm truncate">{outcome.name}</span>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        {isResolved ? (
          <div className="flex items-center gap-1">
            {isWinner ? (
              <CheckIcon className="w-4 h-4 text-primary" />
            ) : (
              <XIcon className="w-4 h-4 text-secondary" />
            )}
            <span
              className={`text-xs font-semibold ${isWinner ? "text-primary" : "text-secondary"}`}
            >
              {isWinner ? "Yes" : "No"}
            </span>
          </div>
        ) : (
          <>
            <span
              className={`text-sm font-semibold ${yes >= 50 ? "text-primary" : "text-default-500"}`}
            >
              {yes}%
            </span>
            <div className="flex gap-1">
              <span className="text-xs rounded bg-primary/10 text-primary px-2 py-0.5 font-semibold">
                Yes {yes}¢
              </span>
              <span className="text-xs rounded bg-secondary/10 text-secondary px-2 py-0.5 font-semibold">
                No {no}¢
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function MarketGroupCard({ group }: MarketGroupCardProps) {
  const isUpcoming = group.status === MarketGroupStatus.DRAFT;

  // Sort by probability so the current favourite is first
  const sortedOutcomes = [...group.outcomes].sort(
    (a, b) => b.probability - a.probability,
  );

  return (
    <NextLink className="block" href={`/market/multi/${group.groupId}`}>
      <Card className="w-full h-auto min-h-[180px] hover:scale-[1.02] transition-transform cursor-pointer">
        <CardHeader className="flex flex-col items-start gap-2 pt-4 pb-0 flex-shrink-0">
          <h3 className="text-base font-semibold line-clamp-2">
            {group.marketQuestion}
          </h3>
        </CardHeader>

        <CardBody className="gap-0 py-2 flex-1">
          <div className="flex flex-col divide-y divide-default-100">
            {sortedOutcomes.map((outcome) => (
              <OutcomeRow
                key={outcome.marketId}
                isResolved={group.status === MarketGroupStatus.RESOLVED}
                isWinner={outcome.marketId === group.resolvedMarketId}
                outcome={outcome}
              />
            ))}
          </div>
        </CardBody>

        <CardFooter className="flex-shrink-0">
          <div className="flex justify-between w-full text-xs text-default-400">
            {isUpcoming ? (
              <span className="text-warning font-semibold">UPCOMING</span>
            ) : (
              <span>{group.volumeFormatted} Vol.</span>
            )}
            <span>{group.participantCount} traders</span>
          </div>
        </CardFooter>
      </Card>
    </NextLink>
  );
}
