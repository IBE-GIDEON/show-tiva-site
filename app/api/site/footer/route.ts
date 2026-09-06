import { revalidatePath } from "next/cache";

import { getSite, mutateSite } from "@/lib/site";
import type { FooterContent } from "@/lib/site-types";
import { writesBlocked } from "../../_lib/guard";
import { fail, ok, serverError } from "../../_lib/respond";

export const dynamic = "force-dynamic";

const EDITABLE = [
  "tagline",
  "backgroundImage",
  "backgroundAlt",
  "copyright",
  "columns",
  "socials",
] as const;

/** GET /api/site/footer — footer copy, link columns and social links. */
export async function GET() {
  try {
    return ok({ footer: (await getSite()).footer });
  } catch (cause) {
    return serverError(cause);
  }
}

/**
 * PUT /api/site/footer — partial update of the footer.
 *
 * `columns` and `socials` are replaced wholesale (send the full array).
 * Social icons come from a built-in set keyed by `platform`; an unrecognised
 * platform renders a generic link icon.
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
    const unknownKeys = Object.keys(patch).filter(
      (key) => !(EDITABLE as readonly string[]).includes(key),
    );
    if (unknownKeys.length > 0) {
      return fail(400, `Unsupported field(s): ${unknownKeys.join(", ")}`, { editable: EDITABLE });
    }

    const saved = await mutateSite((current) => ({
      ...current,
      footer: { ...current.footer, ...(patch as Partial<FooterContent>) },
    }));

    // The footer renders on both the catalog and every detail page.
    revalidatePath("/watch");
    revalidatePath("/watch/[id]", "page");

    return ok({ footer: saved.footer });
  } catch (cause) {
    return serverError(cause);
  }
}
