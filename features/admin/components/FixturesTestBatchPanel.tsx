"use client";

/**
 * Local test UI for the 10-day batch (1 fixture per league).
 * Dry-run previews selection; create-test-batch submits on-chain via bot wallet.
 *
 * Lokaal gebruik:
 * 1. npm run dev
 * 2. Ga naar http://localhost:3001/admin/fixtures
 * 3. Klik op "Dry-run (10-dagen batch)" om de selectie te bekijken.
 * 4. Als het er goed uitziet: klik op "Create test-batch (on-chain)".
 * 5. Controleer de tx's en de samenvatting.
 *
 * Unlock /admin via AdminSessionGate (ADMIN_SECRET → httpOnly cookie).
 * Works locally and on production (e.g. www.poly.football/admin/fixtures).
 */

import type {
  TestBatchCreateResult,
  TestBatchDryRunResult,
} from "@/lib/admin/test-batch-service";

import {
  adminTestBatchCreate,
  adminTestBatchDryRun,
} from "@/features/admin/actions/fixtures-admin";
import { useState } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";

function formatLocalDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatWindowLabel(fromYmd: string, toYmd: string): string {
  const from = new Date(`${fromYmd}T12:00:00.000Z`);
  const to = new Date(`${toYmd}T12:00:00.000Z`);

  return `${from.toLocaleDateString(undefined, { dateStyle: "medium" })} → ${to.toLocaleDateString(undefined, { dateStyle: "medium" })} (UTC window ${fromYmd} … ${toYmd})`;
}

function txExplorerUrl(chainId: number, txHash: string): string {
  if (chainId === 84532) {
    return `https://sepolia.basescan.org/tx/${txHash}`;
  }

  return `https://basescan.org/tx/${txHash}`;
}

function tableClassName(): string {
  return "w-full text-sm border-collapse";
}

function thClassName(): string {
  return "text-left text-xs font-semibold uppercase tracking-wide text-default-500 border-b border-default-200 py-2 pr-3";
}

function tdClassName(): string {
  return "border-b border-default-100 py-2 pr-3 align-top";
}

export function FixturesTestBatchPanel() {
  const [dryRunLoading, setDryRunLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [dryRunError, setDryRunError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [dryRunResult, setDryRunResult] = useState<TestBatchDryRunResult | null>(
    null,
  );
  const [createResult, setCreateResult] = useState<TestBatchCreateResult | null>(
    null,
  );

  const runDryRun = async () => {
    setDryRunLoading(true);
    setDryRunError(null);

    try {
      setDryRunResult(await adminTestBatchDryRun());
    } catch (err) {
      setDryRunError(
        `Dry-run mislukt: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
      setDryRunResult(null);
    } finally {
      setDryRunLoading(false);
    }
  };

  const runCreateBatch = async () => {
    setCreateLoading(true);
    setCreateError(null);

    try {
      setCreateResult(await adminTestBatchCreate());
    } catch (err) {
      setCreateError(
        `Create test-batch mislukt: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
      setCreateResult(null);
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <Card className="border-warning/40 bg-warning/5">
      <CardHeader className="flex flex-col items-start gap-2 pb-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold">10-dagen test-batch</h2>
          <Chip color="warning" size="sm" variant="flat">
            batch-test_10d_1
          </Chip>
        </div>
        <p className="text-sm text-default-600">
          Werkt lokaal én online (Vercel). Beveiligd via admin-sessie (httpOnly
          cookie). On-chain creatie gebruikt de bot wallet op de server.
        </p>
      </CardHeader>

      <CardBody className="gap-4">
        <div className="flex flex-wrap gap-2">
          <Button
            color="default"
            isLoading={dryRunLoading}
            variant="flat"
            onPress={() => void runDryRun()}
          >
            Dry-run (10-dagen batch)
          </Button>
          <Button
            color="primary"
            isLoading={createLoading}
            onPress={() => void runCreateBatch()}
          >
            Create test-batch (on-chain)
          </Button>
        </div>

        {dryRunLoading && (
          <div className="flex items-center gap-2 text-sm text-default-500">
            <Spinner size="sm" />
            Dry-run bezig…
          </div>
        )}

        {createLoading && (
          <div className="flex items-center gap-2 text-sm text-default-500">
            <Spinner size="sm" />
            On-chain creatie bezig…
          </div>
        )}

        {dryRunError && (
          <p className="text-sm text-danger">{dryRunError}</p>
        )}

        {createError && (
          <p className="text-sm text-danger">{createError}</p>
        )}

        {dryRunResult && (
          <div className="flex flex-col gap-3">
            <div className="text-sm text-default-600">
              <p>
                <span className="font-medium">Venster:</span>{" "}
                {formatWindowLabel(
                  dryRunResult.selection.window.fromYmd,
                  dryRunResult.selection.window.toYmd,
                )}
              </p>
              <p className="mt-1 text-xs text-default-400">
                API calls: {dryRunResult.selection.apiCalls} · Venue{" "}
                {dryRunResult.venueId} · Chain {dryRunResult.chainId}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-sm">
              <Chip size="sm" variant="flat">
                wouldCreate: {dryRunResult.summary.wouldCreate}
              </Chip>
              <Chip color="warning" size="sm" variant="flat">
                alreadyOnChain: {dryRunResult.summary.alreadyOnChain}
              </Chip>
              <Chip size="sm" variant="bordered">
                skippedLeagues: {dryRunResult.summary.skippedLeagues}
              </Chip>
            </div>

            {dryRunResult.markets.length > 0 ? (
              <div className="overflow-x-auto">
                <table className={tableClassName()}>
                  <thead>
                    <tr>
                      <th className={thClassName()}>Competitie</th>
                      <th className={thClassName()}>Thuis / uit</th>
                      <th className={thClassName()}>Kickoff</th>
                      <th className={thClassName()}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dryRunResult.markets.map((row) => (
                      <tr key={row.fixtureId}>
                        <td className={tdClassName()}>{row.leagueName}</td>
                        <td className={tdClassName()}>
                          {row.home} vs {row.away}
                        </td>
                        <td className={tdClassName()}>
                          {formatLocalDateTime(row.kickoffIso)}
                        </td>
                        <td className={tdClassName()}>
                          <Chip
                            color={row.alreadyExists ? "warning" : "success"}
                            size="sm"
                            variant="flat"
                          >
                            {row.alreadyExists ?
                              "alreadyOnChain"
                            : "wouldCreate"}
                          </Chip>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-default-500">
                Geen wedstrijden geselecteerd in het venster.
              </p>
            )}

            {dryRunResult.selection.skippedLeagues.length > 0 && (
              <details className="text-xs text-default-500">
                <summary className="cursor-pointer font-medium">
                  Overgeslagen competities (
                  {dryRunResult.selection.skippedLeagues.length})
                </summary>
                <ul className="mt-2 list-disc pl-5 space-y-1">
                  {dryRunResult.selection.skippedLeagues.map((s) => (
                    <li key={s.leagueId}>
                      {s.leagueName}: {s.reason}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}

        {createResult && (
          <div className="flex flex-col gap-3 border-t border-default-200 pt-4">
            <p className="text-sm font-medium">Create test-batch resultaat</p>

            <div className="flex flex-wrap gap-2 text-sm">
              <Chip color="success" size="sm" variant="flat">
                created: {createResult.summary.created}
              </Chip>
              <Chip color="warning" size="sm" variant="flat">
                skipped: {createResult.summary.skipped}
              </Chip>
              <Chip color="danger" size="sm" variant="flat">
                failed: {createResult.summary.failed}
              </Chip>
            </div>

            {createResult.results.length > 0 ? (
              <div className="overflow-x-auto">
                <table className={tableClassName()}>
                  <thead>
                    <tr>
                      <th className={thClassName()}>Competitie</th>
                      <th className={thClassName()}>Thuis / uit</th>
                      <th className={thClassName()}>Status</th>
                      <th className={thClassName()}>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {createResult.results.map((row) => (
                      <tr key={`${row.fixtureId}-${row.status}`}>
                        <td className={tdClassName()}>{row.leagueName}</td>
                        <td className={tdClassName()}>
                          {row.home} vs {row.away}
                        </td>
                        <td className={tdClassName()}>
                          <Chip
                            color={
                              row.status === "created" ? "success"
                              : row.status === "skipped" ?
                                "warning"
                              : "danger"
                            }
                            size="sm"
                            variant="flat"
                          >
                            {row.status}
                          </Chip>
                        </td>
                        <td className={tdClassName()}>
                          {row.status === "created" && (
                            <div className="flex flex-col gap-1 text-xs">
                              <span>
                                groupId:{" "}
                                <code className="text-default-600">
                                  {row.groupId}
                                </code>
                              </span>
                              <span className="flex flex-col gap-0.5">
                                {row.txHashes.map((hash) => (
                                  <a
                                    key={hash}
                                    className="text-primary hover:underline break-all"
                                    href={txExplorerUrl(
                                      createResult.chainId,
                                      hash,
                                    )}
                                    rel="noopener noreferrer"
                                    target="_blank"
                                  >
                                    {hash.slice(0, 10)}…{hash.slice(-8)}
                                  </a>
                                ))}
                              </span>
                            </div>
                          )}
                          {row.status === "skipped" && (
                            <span className="text-xs text-default-500">
                              {row.reason}
                            </span>
                          )}
                          {row.status === "failed" && (
                            <span className="text-xs text-danger">
                              {row.error}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-default-500">Geen resultaten.</p>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
