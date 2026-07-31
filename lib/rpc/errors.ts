function extractMessage(error: unknown): string {
  if (error instanceof Error) return error.message;

  if (typeof error === "object" && error !== null) {
    const record = error as Record<string, unknown>;

    if (typeof record.message === "string") return record.message;

    if (typeof record.details === "string") return record.details;

    if (
      typeof record.error === "object" &&
      record.error !== null &&
      typeof (record.error as Record<string, unknown>).message === "string"
    ) {
      return (record.error as Record<string, unknown>).message as string;
    }
  }

  return String(error ?? "");
}

function extractCode(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) return undefined;

  const record = error as Record<string, unknown>;

  if (typeof record.code === "number") return record.code;

  if (
    typeof record.error === "object" &&
    record.error !== null &&
    typeof (record.error as Record<string, unknown>).code === "number"
  ) {
    return (record.error as Record<string, unknown>).code as number;
  }

  return undefined;
}

function extractStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) return undefined;

  const record = error as Record<string, unknown>;

  if (typeof record.status === "number") return record.status;

  if (typeof record.statusCode === "number") return record.statusCode;

  return undefined;
}

/** Detect HTTP 429, JSON-RPC -32005, and common provider rate-limit messages. */
export function isRateLimitError(error: unknown): boolean {
  const status = extractStatus(error);

  if (status === 429) return true;

  const code = extractCode(error);

  if (code === -32005 || code === 429) return true;

  const message = extractMessage(error).toLowerCase();

  return (
    message.includes("rate limit") ||
    message.includes("too many requests") ||
    message.includes("over rate limit") ||
    message.includes("request limit") ||
    message.includes("429") ||
    message.includes("-32005")
  );
}

export class RpcRateLimitError extends Error {
  readonly status?: number;
  readonly code?: number;

  constructor(message: string, options?: { status?: number; code?: number }) {
    super(message);
    this.name = "RpcRateLimitError";
    this.status = options?.status;
    this.code = options?.code;
  }
}
