import { getContent } from "@/lib/content";
import { ok, serverError } from "../_lib/respond";

// Read the store per request. GET handlers are already dynamic by default in
// this Next version, but this is declared explicitly so the endpoint keeps
// serving live data if caching defaults ever change.
export const dynamic = "force-dynamic";

/** GET /api/content — the whole store. */
export async function GET() {
  try {
    return ok(await getContent());
  } catch (cause) {
    return serverError(cause);
  }
}
