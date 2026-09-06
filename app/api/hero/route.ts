import { revalidatePath } from "next/cache";

import { getContent, lookupMovie, mutateContent } from "@/lib/content";
import { writesBlocked } from "../_lib/guard";
import { ApiError, fail, ok, serverError } from "../_lib/respond";

export const dynamic = "force-dynamic";

/** GET /api/hero — which titles are hero slides, in carousel order. */
export async function GET() {
  try {
    const content = await getContent();
    const slides = content.heroSlideIds
      .map((id) => lookupMovie(content.movies, id))
      .filter((movie) => Boolean(movie));

    return ok({ count: slides.length, slideIds: content.heroSlideIds, slides });
  } catch (cause) {
    return serverError(cause);
  }
}

/**
 * PUT /api/hero — set the hero carousel.
 *
 * Body: { slideIds: ["spiderman", "toy-story", ...] } — order is the carousel
 * order. Any movie may be a slide; the fields the hero renders (duration,
 * subtitle, description) live on the movie record itself.
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

    const slideIds = (body as Record<string, unknown> | null)?.slideIds;
    if (!Array.isArray(slideIds) || slideIds.some((id) => typeof id !== "string")) {
      return fail(400, '"slideIds" must be an array of movie ids');
    }
    if (slideIds.length === 0) {
      return fail(400, '"slideIds" must contain at least one movie id');
    }

    const saved = await mutateContent((current) => {
      const ids = slideIds as string[];
      // Own properties only: a bare lookup treats inherited Object.prototype
      // keys ("constructor", "toString", …) as existing movies, which would
      // persist an id that later breaks rendering.
      const unknown = ids.filter((id) => !Object.hasOwn(current.movies, id));
      if (unknown.length > 0) throw new ApiError(400, `Unknown movie id(s): ${unknown.join(", ")}`);
      if (new Set(ids).size !== ids.length) {
        throw new ApiError(400, '"slideIds" contains duplicate ids');
      }

      return { ...current, heroSlideIds: ids };
    });

    revalidatePath("/watch");
    return ok({ slideIds: saved.heroSlideIds });
  } catch (cause) {
    return serverError(cause);
  }
}
