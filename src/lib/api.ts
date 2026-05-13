import { NextResponse } from "next/server";
import { ZodError, type ZodTypeAny, type z } from "zod";
import { AppError, BadRequestError, NotFoundError, ValidationError } from "./errors";
import { logger } from "./logger";

const MAX_BODY_BYTES = 1024 * 256;

export function json<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

export function notFound(message = "Not found") {
  return errorResponse(new NotFoundError(message));
}

export function badRequest(message: string, details?: unknown) {
  return errorResponse(new BadRequestError(message, details));
}

export async function parseJsonBody<S extends ZodTypeAny>(request: Request, schema: S): Promise<z.output<S>> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new BadRequestError("Content-Type must be application/json");
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    throw new BadRequestError(`Request body exceeds ${MAX_BODY_BYTES} bytes`);
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new BadRequestError("Request body is not valid JSON");
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError("Request body failed validation", formatZodError(parsed.error));
  }
  return parsed.data;
}

export async function parseOptionalJsonBody<S extends ZodTypeAny>(request: Request, schema: S): Promise<z.output<S>> {
  const text = await request.text();
  if (!text.trim()) {
    const parsed = schema.safeParse({});
    if (!parsed.success) {
      throw new ValidationError("Empty body failed validation", formatZodError(parsed.error));
    }
    return parsed.data;
  }
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new BadRequestError("Request body is not valid JSON");
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError("Request body failed validation", formatZodError(parsed.error));
  }
  return parsed.data;
}

export function formatZodError(error: ZodError): Array<{ path: string; message: string }> {
  return error.issues.map((issue) => ({
    path: issue.path.join(".") || "(root)",
    message: issue.message
  }));
}

export function errorResponse(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json(error.toBody(), { status: error.status });
  }
  if (error instanceof ZodError) {
    return NextResponse.json(new ValidationError("Validation failed", formatZodError(error)).toBody(), { status: 422 });
  }
  logger.error("Unhandled API error", { error: error instanceof Error ? error : { message: String(error) } });
  return NextResponse.json(
    {
      error: {
        code: "internal_error",
        message: "Internal server error"
      }
    },
    { status: 500 }
  );
}

type RouteHandler<TArgs extends unknown[]> = (request: Request, ...args: TArgs) => Promise<Response> | Response;

export function withErrorHandling<TArgs extends unknown[]>(handler: RouteHandler<TArgs>): RouteHandler<TArgs> {
  return async (request, ...args) => {
    try {
      return await handler(request, ...args);
    } catch (error) {
      return errorResponse(error);
    }
  };
}
