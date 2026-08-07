export class ApiFootballError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiFootballError";
  }
}

export const API_FOOTBALL_BASE_URL = "https://v3.football.api-sports.io";

export const getApiFootballKey = () => {
  const apiFootballKey = process.env.API_FOOTBALL_KEY?.trim();
  if (apiFootballKey) return apiFootballKey;

  const apiSportsKey = process.env.APISPORTS_KEY?.trim();
  if (apiSportsKey) return apiSportsKey;

  const apiSportsAltKey = process.env.API_SPORTS_KEY?.trim();
  if (apiSportsAltKey) return apiSportsAltKey;

  const publicKey = process.env.NEXT_PUBLIC_API_FOOTBALL_KEY?.trim();
  if (publicKey) return publicKey;

  return undefined;
};

export const isApiFootballConfigured = () => Boolean(getApiFootballKey());

type ApiFootballResponse<T> = {
  response: T;
  errors?: Record<string, string>;
};

export const apiFootballFetch = async <T>(
  endpoint: string,
  params: Record<string, string | number> = {},
  revalidate = 86400,
): Promise<T> => {
  const apiKey = getApiFootballKey();

  if (!apiKey) {
    throw new ApiFootballError("API_FOOTBALL_KEY is not configured");
  }

  const url = new URL(
    `${API_FOOTBALL_BASE_URL}/${endpoint.replace(/^\//, "")}`,
  );

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, String(value));
  });

  const response = await fetch(url, {
    headers: {
      "x-apisports-key": apiKey,
    },
    next: { revalidate },
  });

  if (!response.ok) {
    throw new ApiFootballError(
      `API-Football request failed (${response.status})`,
    );
  }

  const payload = (await response.json()) as ApiFootballResponse<T>;

  if (payload.errors && Object.keys(payload.errors).length > 0) {
    throw new ApiFootballError(Object.values(payload.errors).join(", "));
  }

  return payload.response;
};

type ApiTeamResponse = Array<{
  team: {
    id: number;
    name: string;
    logo: string | null;
    country: string;
  };
}>;

export const searchTeamLogo = async (
  name: string,
): Promise<{ logo: string | null; country: string | null }> => {
  try {
    const response = await apiFootballFetch<ApiTeamResponse>("teams", {
      search: name,
    });

    const item = response[0];

    if (!item) {
      return { logo: null, country: null };
    }

    return {
      logo: item.team.logo,
      country: item.team.country,
    };
  } catch {
    return { logo: null, country: null };
  }
};
