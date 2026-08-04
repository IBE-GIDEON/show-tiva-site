import { fail } from "./respond";

/**
 * Blocks writes in production.
 *
 * The store is a JSON file on disk. That works locally and on a long-lived
 * server, but most production/serverless filesystems are read-only (or
 * per-instance and ephemeral), so a write would either throw or silently
 * vanish on the next deploy. Failing loudly beats pretending it persisted.
 *
 * When this moves to a real database, delete this guard.
 */
export function writesBlocked(): Response | null {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_CONTENT_WRITES !== "true") {
    return fail(
      503,
      "Content writes are disabled in production. The JSON store requires a writable filesystem; set ALLOW_CONTENT_WRITES=true only on a host with persistent disk.",
    );
  }
  return null;
}
