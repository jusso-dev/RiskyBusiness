export type ErrorCode =
  | "validation_failed"
  | "not_found"
  | "conflict"
  | "bad_request"
  | "unauthorized"
  | "forbidden"
  | "upstream_failed"
  | "internal_error";

export interface ErrorBody {
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
  };
}

export class AppError extends Error {
  readonly status: number;
  readonly code: ErrorCode;
  readonly details?: unknown;

  constructor(code: ErrorCode, status: number, message: string, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.details = details;
  }

  toBody(): ErrorBody {
    return { error: { code: this.code, message: this.message, details: this.details } };
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super("not_found", 404, id ? `${resource} '${id}' not found` : `${resource} not found`);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super("validation_failed", 422, message, details);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, details?: unknown) {
    super("bad_request", 400, message, details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: unknown) {
    super("conflict", 409, message, details);
  }
}

export class UpstreamError extends AppError {
  constructor(message: string, details?: unknown) {
    super("upstream_failed", 502, message, details);
  }
}
