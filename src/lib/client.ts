import type { ErrorBody } from "./errors";

export class HttpError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details?: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function apiFetch<T = unknown>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  headers.set("Accept", "application/json");

  const response = await fetch(input, { ...init, headers });
  const text = await response.text();
  const parsed = text ? safeJsonParse(text) : undefined;

  if (!response.ok) {
    const body = parsed as ErrorBody | undefined;
    throw new HttpError(
      body?.error?.message ?? `Request failed with status ${response.status}`,
      response.status,
      body?.error?.code,
      body?.error?.details
    );
  }

  return parsed as T;
}

function safeJsonParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

export function formatHttpError(error: unknown): string {
  if (error instanceof HttpError) {
    if (Array.isArray(error.details)) {
      const items = error.details as Array<{ path?: string; message?: string }>;
      const summary = items
        .filter((item) => item && item.message)
        .map((item) => (item.path ? `${item.path}: ${item.message}` : item.message))
        .join("; ");
      return summary ? `${error.message} — ${summary}` : error.message;
    }
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return "Unexpected error";
}
