// Shared response helpers so every endpoint returns a consistent shape.
import { isValidationError } from "@/lib/json-store";

/**
 * Error carrying an intended HTTP status. Useful for failures detected inside
 * a store mutation (which runs in a lock), where returning a Response
 * directly isn't possible.
 */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function ok(data: unknown, init?: ResponseInit): Response {
  return Response.json(data, init);
}

export function fail(status: number, message: string, details?: unknown): Response {
  return Response.json({ error: message, ...(details ? { details } : {}) }, { status });
}

/**
 * Turns a thrown error into a response without leaking a stack trace.
 *
 * - `ApiError` carries its own status.
 * - Schema-validation failures are the caller's fault, so they answer 400.
 * - Anything else (unreadable store, unexpected bug) becomes 500.
 */
export function serverError(cause: unknown): Response {
  if (cause instanceof ApiError) return fail(cause.status, cause.message);

  const message = cause instanceof Error ? cause.message : "Unknown error";
  if (isValidationError(cause)) return fail(400, message);

  console.error("[api]", cause);
  return fail(500, message);
}
