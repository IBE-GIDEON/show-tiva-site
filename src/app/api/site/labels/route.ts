import { revalidatePath } from "next/cache";

import { getSite, mutateSite } from "@/lib/site";
import type { LabelGroup } from "@/lib/site-types";
import { LABEL_GROUPS } from "@/lib/site-types";
import { writesBlocked } from "../../_lib/guard";
import { fail, ok, serverError } from "../../_lib/respond";

export const dynamic = "force-dynamic";

/**
 * GET /api/site/labels — every editable UI string, grouped by surface.
 *
 * Groups: watch, detail, popover, notFound, brand.
 */
export async function GET() {
  try {
    const site = await getSite();
    return ok({
      groups: LABEL_GROUPS,
      watch: site.watch,
      detail: site.detail,
      popover: site.popover,
      notFound: site.notFound,
      brand: site.brand,
    });
  } catch (cause) {
    return serverError(cause);
  }
}

/**
 * PUT /api/site/labels — partial update of one or more label groups.
 *
 * Body: { watch?: {...}, detail?: {...}, popover?: {...}, notFound?: {...}, brand?: {...} }
 * Each group is merged key-by-key, so sending a single label is enough.
 * Every key must remain a non-empty string; the store rejects anything else.
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
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return fail(400, "Body must be a JSON object");
    }

    const patch = body as Record<string, unknown>;
    const unknownGroups = Object.keys(patch).filter(
      (key) => !(LABEL_GROUPS as readonly string[]).includes(key),
    );
    if (unknownGroups.length > 0) {
      return fail(400, `Unsupported group(s): ${unknownGroups.join(", ")}`, {
        groups: LABEL_GROUPS,
      });
    }
    for (const group of Object.keys(patch)) {
      const value = patch[group];
      if (typeof value !== "object" || value === null || Array.isArray(value)) {
        return fail(400, `"${group}" must be an object of label keys`);
      }
    }

    const saved = await mutateSite((current) => {
      const next = { ...current };
      for (const group of Object.keys(patch) as LabelGroup[]) {
        next[group] = { ...current[group], ...(patch[group] as object) } as never;
      }
      return next;
    });

    // Labels appear across the catalog, every detail page and the landing page.
    revalidatePath("/watch");
    revalidatePath("/watch/[id]", "page");
    revalidatePath("/");

    return ok({
      watch: saved.watch,
      detail: saved.detail,
      popover: saved.popover,
      notFound: saved.notFound,
      brand: saved.brand,
    });
  } catch (cause) {
    return serverError(cause);
  }
}
