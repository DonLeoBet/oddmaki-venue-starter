"use client";

import type { MatchPredictionPick } from "@/lib/server/match-social-store";

import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Spinner } from "@heroui/spinner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { useSession } from "@/features/auth/hooks/useSession";
import { useDisplayName } from "@/features/identity/hooks/useDisplayName";
import { fixtureIdFromTag, isFixtureTag } from "@/lib/football/map-fixture-to-market-group";
import { queryKeys } from "@/lib/oddmaki/queryKeys";
import { AddressAvatar } from "@/lib/identity/avatar";
import { colors } from "@/lib/tokens";

interface MatchSocialPanelProps {
  groupTags: string[] | undefined;
  homeTeamName: string;
  awayTeamName: string;
}

function fixtureIdFromTags(tags: string[] | undefined): number | null {
  if (!tags) return null;

  for (const tag of tags) {
    if (!isFixtureTag(tag)) continue;

    return fixtureIdFromTag(tag);
  }

  return null;
}

const PICKS: Array<{ key: MatchPredictionPick; label: string; color: string }> = [
  { key: "home", label: "Home", color: colors.neonCyan },
  { key: "draw", label: "Draw", color: colors.textSecondary },
  { key: "away", label: "Away", color: colors.neonMagenta },
];

export function MatchSocialPanel({
  groupTags,
  homeTeamName,
  awayTeamName,
}: MatchSocialPanelProps) {
  const fixtureId = fixtureIdFromTags(groupTags);
  const { isLoggedIn, address, login } = useSession();
  const { displayName } = useDisplayName(address);
  const queryClient = useQueryClient();

  const [prediction, setPrediction] = useState<MatchPredictionPick | null>(null);
  const [comment, setComment] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.matchSocial.thread(fixtureId?.toString()),
    queryFn: async () => {
      const response = await fetch(`/api/match-social/${fixtureId}`);

      if (!response.ok) throw new Error("Failed to load predictions");

      return response.json() as Promise<{
        entries: Array<{
          address: string;
          displayName: string;
          prediction: MatchPredictionPick | null;
          comment: string;
          updatedAt: string;
        }>;
      }>;
    },
    enabled: fixtureId != null,
    staleTime: 15_000,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/match-social/${fixtureId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          displayName,
          prediction,
          comment,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));

        throw new Error(
          typeof payload.error === "string" ? payload.error : "Could not save",
        );
      }

      return response.json();
    },
    onSuccess: (thread) => {
      queryClient.setQueryData(queryKeys.matchSocial.thread(fixtureId?.toString()), thread);
    },
  });

  if (!fixtureId) return null;

  const myEntry =
    address ?
      data?.entries.find((entry) => entry.address === address.toLowerCase())
    : undefined;

  const pickLabels: Record<MatchPredictionPick, string> = {
    home: homeTeamName,
    draw: "Draw",
    away: awayTeamName,
  };

  return (
    <Card className="border border-default-100/50">
      <CardHeader className="pb-2">
        <h2 className="text-lg font-semibold">Predictions & comments</h2>
        <p className="text-[11px] text-default-400 font-normal">
          Log in to share your 1X2 pick and a short comment on this match.
        </p>
      </CardHeader>
      <CardBody className="pt-0 gap-4">
        {!isLoggedIn ?
          <Button color="primary" size="sm" onPress={login}>
            Connect to predict
          </Button>
        : <>
            <div className="flex flex-wrap gap-2">
              {PICKS.map((pick) => (
                <button
                  key={pick.key}
                  className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                    (prediction ?? myEntry?.prediction) === pick.key ?
                      "border-current bg-default-100/50"
                    : "border-default-200/60 hover:bg-default-100/30"
                  }`}
                  style={{
                    color:
                      (prediction ?? myEntry?.prediction) === pick.key ?
                        pick.color
                      : undefined,
                  }}
                  type="button"
                  onClick={() => setPrediction(pick.key)}
                >
                  {pick.key === "home" ? homeTeamName
                  : pick.key === "away" ? awayTeamName
                  : "Draw"}
                </button>
              ))}
            </div>
            <textarea
              className="w-full rounded-lg border border-default-200/60 bg-default-100/20 px-3 py-2 text-sm outline-none focus:border-primary min-h-[72px] resize-y"
              maxLength={500}
              placeholder="Your take on this match…"
              value={comment || myEntry?.comment || ""}
              onChange={(event) => setComment(event.target.value)}
            />
            <Button
              color="primary"
              isLoading={saveMutation.isPending}
              size="sm"
              onPress={() => saveMutation.mutate()}
            >
              Save prediction
            </Button>
            {saveMutation.isError && (
              <p className="text-xs text-danger">{saveMutation.error.message}</p>
            )}
          </>
        }

        {isLoading ?
          <div className="flex justify-center py-4">
            <Spinner size="sm" />
          </div>
        : data && data.entries.length > 0 ?
          <div className="flex flex-col gap-3 border-t border-default-100/50 pt-4">
            {data.entries.map((entry) => (
              <div key={entry.address} className="flex gap-2">
                <AddressAvatar address={entry.address} size={28} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{entry.displayName}</span>
                    {entry.prediction && (
                      <span className="text-[10px] rounded-full bg-default-100 px-2 py-0.5 text-default-500">
                        {pickLabels[entry.prediction]}
                      </span>
                    )}
                  </div>
                  {entry.comment && (
                    <p className="text-sm text-default-500 mt-0.5">{entry.comment}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        : null}
      </CardBody>
    </Card>
  );
}
