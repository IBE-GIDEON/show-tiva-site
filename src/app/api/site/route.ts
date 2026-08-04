import { getSite } from "@/lib/site";
import { ok, serverError } from "../_lib/respond";

export const dynamic = "force-dynamic";

/** GET /api/site — the whole site copy store. */
export async function GET() {
  try {
    return ok(await getSite());
  } catch (cause) {
    return serverError(cause);
  }
}
