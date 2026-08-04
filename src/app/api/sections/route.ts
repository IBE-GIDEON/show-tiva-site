import { getSections } from "@/lib/content";
import { ok, serverError } from "../_lib/respond";

export const dynamic = "force-dynamic";

/** GET /api/sections — catalog rows with their movies resolved. */
export async function GET() {
  try {
    const sections = await getSections();
    return ok({
      count: sections.length,
      sections: sections.map((section) => ({
        ...section,
        movieCount: section.movies.length,
      })),
    });
  } catch (cause) {
    return serverError(cause);
  }
}
