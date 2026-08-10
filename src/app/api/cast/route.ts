import { revalidatePath } from "next/cache";

import { getContent, mutateContent } from "@/lib/content";
import type { CastMember } from "@/lib/content-types";
import { writesBlocked } from "../_lib/guard";
import { fail, ok, serverError } from "../_lib/respond";

export const dynamic = "force-dynamic";

/** GET /api/cast — the shared fallback cast. */
export async function GET() {
  try {
    const content = await getContent();
    return ok({ count: content.defaultCast.length, defaultCast: content.defaultCast });
  } catch (cause) {
    return serverError(cause);
  }
}

/**
 * PUT /api/cast — replace the shared fallback cast.
 *
 * Body: { defaultCast: [{ name, role, image }] }
 *
 * This list is shown for every title whose own `cast` is empty, so editing it
 * changes the cast on all of those at once. `image` may be null, which renders
 * a placeholder avatar.
 */
export async function PUT(request: Request) {
  const blocked = writesBlocked();
  if (blocked) return blocked;

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return fail(400, "Body must be valid JSON");
    }

    const defaultCast = (body as Record<string, unknown> | null)?.defaultCast;
    if (!Array.isArray(defaultCast)) {
      return fail(400, '"defaultCast" must be an array of { name, role, image }');
    }

    // Shape is fully re-validated by the store before anything is written.
    const saved = await mutateContent((current) => ({
      ...current,
      defaultCast: defaultCast as CastMember[],
    }));

    revalidatePath("/watch");
    return ok({ defaultCast: saved.defaultCast });
  } catch (cause) {
    return serverError(cause);
  }
}
