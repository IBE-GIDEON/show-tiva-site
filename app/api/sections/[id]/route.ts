import { revalidatePath } from "next/cache";

import { getContent, lookupMovie, mutateContent } from "@/lib/content";
import type { SectionAspect } from "@/lib/content-types";
import { writesBlocked } from "../../_lib/guard";
import { ApiError, fail, ok, serverError } from "../../_lib/respond";

export const dynamic = "force-dynamic";

// `params` is a Promise in this Next version and must be awaited.
type Context = { params: Promise<{ id: string }> };

const ASPECTS: SectionAspect[] = ["portrait", "landscape"];

/**
 * Fields a client may change. `id` is immutable — rename by creating a new row
 * and deleting the old one, so nothing silently loses its movie list.
 */
const EDITABLE = ["title", "accent", "aspect", "titleColor", "movieIds"] as const;

/** GET /api/sections/:id — one row with its movies resolved. */
export async function GET(_request: Request, { params }: Context) {
  try {
    const { id } = await params;
    const content = await getContent();
    const section = content.sections.find((s) => s.id === id);
    if (!section) return fail(404, `No section with id "${id}"`);

    const { movieIds, ...rest } = section;
    const movies = movieIds.map((movieId) => lookupMovie(content.movies, movieId)).filter(Boolean);

    return ok({ section: { ...rest, movies, movieCount: movies.length } });
  } catch (cause) {
    return serverError(cause);
  }
}

/**
 * PUT/PATCH /api/sections/:id — update a row.
 *
 * Setting `movieIds` covers every arrangement task: reordering within the row,
 * adding, removing, and (with a second call) moving a title to another row.
 */
export async function PUT(request: Request, { params }: Context) {
  const blocked = writesBlocked();
  if (blocked) return blocked;

  try {
    const { id } = await params;

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
    if (patch.aspect !== undefined && !ASPECTS.includes(patch.aspect as SectionAspect)) {
      return fail(400, `"aspect" must be one of: ${ASPECTS.join(", ")}`, { aspects: ASPECTS });
    }
    if (patch.movieIds !== undefined && !Array.isArray(patch.movieIds)) {
      return fail(400, '"movieIds" must be an array of movie ids');
    }

    const saved = await mutateContent((current) => {
      const index = current.sections.findIndex((s) => s.id === id);
      if (index === -1) throw new ApiError(404, `No section with id "${id}"`);

      if (Array.isArray(patch.movieIds)) {
        const ids = patch.movieIds as string[];
        // Own properties only: a bare lookup treats inherited Object.prototype
        // keys ("constructor", "toString", …) as existing movies.
        const unknown = ids.filter((movieId) => !Object.hasOwn(current.movies, movieId));
        if (unknown.length > 0) {
          throw new ApiError(400, `Unknown movie id(s): ${unknown.join(", ")}`);
        }
        if (new Set(ids).size !== ids.length) {
          throw new ApiError(400, '"movieIds" contains duplicate ids');
        }
      }

      const sections = [...current.sections];
      sections[index] = { ...sections[index], ...patch };
      return { ...current, sections };
    });

    revalidatePath("/watch");
    return ok({ section: saved.sections.find((s) => s.id === id) });
  } catch (cause) {
    return serverError(cause);
  }
}

/** PATCH behaves identically to PUT here (both are partial updates). */
export async function PATCH(request: Request, context: Context) {
  return PUT(request, context);
}

/**
 * DELETE /api/sections/:id — remove a row.
 *
 * The movies themselves are left in the store; only the row is removed. Pass
 * ?withMovies=true to also delete titles that no other row references.
 */
export async function DELETE(request: Request, { params }: Context) {
  const blocked = writesBlocked();
  if (blocked) return blocked;

  try {
    const { id } = await params;
    const withMovies = new URL(request.url).searchParams.get("withMovies") === "true";

    let orphaned: string[] = [];

    await mutateContent((current) => {
      const section = current.sections.find((s) => s.id === id);
      if (!section) throw new ApiError(404, `No section with id "${id}"`);

      const sections = current.sections.filter((s) => s.id !== id);
      if (!withMovies) return { ...current, sections };

      // Only drop titles nothing else points at.
      const stillReferenced = new Set([
        ...sections.flatMap((s) => s.movieIds),
        ...current.heroSlideIds,
      ]);
      orphaned = section.movieIds.filter((movieId) => !stillReferenced.has(movieId));

      const movies = { ...current.movies };
      for (const movieId of orphaned) delete movies[movieId];

      return { ...current, sections, movies };
    });

    revalidatePath("/watch");
    return ok({ deleted: id, deletedMovies: orphaned });
  } catch (cause) {
    return serverError(cause);
  }
}
