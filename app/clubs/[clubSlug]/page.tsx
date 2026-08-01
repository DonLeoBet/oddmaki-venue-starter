import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getClubPage } from "@/config/clubPages";
import { ClubPageView } from "@/features/clubs/components/ClubPageView";

interface PageProps {
  params: Promise<{ clubSlug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { clubSlug } = await params;
  const club = getClubPage(clubSlug);

  if (!club) return { title: "Club" };

  return {
    title: `${club.label} – Match Markets`,
    description: `Prediction markets for ${club.label} fixtures on Poly.Football.`,
  };
}

export default async function ClubPage({ params }: PageProps) {
  const { clubSlug } = await params;

  if (!getClubPage(clubSlug)) notFound();

  return <ClubPageView clubSlug={clubSlug} />;
}
