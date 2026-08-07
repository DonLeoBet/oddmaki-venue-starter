import { useQuery } from "@tanstack/react-query";

type TeamLogosResponse = {
  logos?: Record<string, { logo: string | null; country: string | null }>;
  configured?: boolean;
};

export const useTeamLogos = (names: string[]) => {
  const key = names
    .map((n) => n.trim())
    .filter(Boolean)
    .sort()
    .join(",");

  return useQuery({
    queryKey: ["api-football-team-logos", key],
    enabled: key.length > 0,
    staleTime: 24 * 60 * 60 * 1000,
    queryFn: async (): Promise<Record<string, string | null>> => {
      const response = await fetch(
        `/api/football/team-logos?names=${encodeURIComponent(key)}`,
        { cache: "force-cache" },
      );

      if (!response.ok) {
        return {};
      }

      const payload = (await response.json()) as TeamLogosResponse;
      const logos = payload.logos ?? {};

      return Object.fromEntries(
        Object.entries(logos).map(([name, value]) => [name, value?.logo ?? null]),
      );
    },
  });
};
