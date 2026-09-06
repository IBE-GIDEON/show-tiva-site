import { revalidatePath } from "next/cache";

import { getMovieById, getRelated, lookupMovie, mutateContent } from "@/lib/content";
import type { Movie } from "@/lib/content-types";
import { writesBlocked } from "../../_lib/guard";
import { ApiError, fail, ok, serverError } from "../../_lib/respond";

export const dynamic = "force-dynamic";

// `params` is a Promise in this Next version and must be awaited.
type Context = { params: Promise<{ id: string }> };

/** Fields a client may change. `id` is intentionally immutable. */
const EDITABLE = [
  "title",
  "subtitle",
  "type",
  "duration",
  "rating",
  "year",
  "description",
  "image",
  "backdrop",
  "genres",
  "cast",
  "trailerUrl",
] as const;

/** Refresh the pages that render this title. */
function revalidateFor(id: string) {
  revalidatePath("/watch");
  revalidatePath(`/watch/${id}`);
}

/** GET /api/movies/:id — one title, plus its related grid. */
export async function GET(_request: Request, { params }: Context) {
  try {
    const { id } = await params;
    const movie = await getMovieById(id);
    if (!movie) return fail(404, `No movie with id "${id}"`);

    return ok({ movie, related: await getRelated(id) });
  } catch (cause) {
    return serverError(cause);
  }
}

/** PATCH/PUT /api/movies/:id — partial update of one title. */
export async function PUT(request: Request, context: Context) {
  const blocked = writesBlocked();
  if (blocked) return blocked;

  try {
    const { id } = await context.params;
    if (!(await getMovieById(id))) return fail(404, `No movie with id "${id}"`);

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

    // Read-modify-write inside the store lock so a concurrent edit to another
    // field cannot be lost. Every field is type-checked before it hits disk.
    let updated: Movie | undefined;
    const saved = await mutateContent((current) => {
      const existing = lookupMovie(current.movies, id);
      if (!existing) throw new ApiError(404, `No movie with id "${id}"`);

      updated = { ...existing };
      for (const key of Object.keys(patch)) {
        (updated as unknown as Record<string, unknown>)[key] = patch[key];
      }

      return { ...current, movies: { ...current.movies, [id]: updated } };
    });
    revalidateFor(id);

    return ok({ movie: lookupMovie(saved.movies, id) ?? updated });
  } catch (cause) {
    return serverError(cause);
  }
}

/** PATCH behaves identically to PUT here (both are partial updates). */
export async function PATCH(request: Request, context: Context) {
  return PUT(request, context);
}

/** DELETE /api/movies/:id — remove a title and any references to it. */
export async function DELETE(_request: Request, context: Context) {
  const blocked = writesBlocked();
  if (blocked) return blocked;

  try {
    const { id } = await context.params;
    if (!(await getMovieById(id))) return fail(404, `No movie with id "${id}"`);

    await mutateContent((current) => {
      const movies = { ...current.movies };
      delete movies[id];

      return {
        ...current,
        movies,
        // Drop dangling references so the store stays consistent.
        heroSlideIds: current.heroSlideIds.filter((heroId) => heroId !== id),
        sections: current.sections.map((section) => ({
          ...section,
          movieIds: section.movieIds.filter((movieId) => movieId !== id),
        })),
      };
    });
    revalidateFor(id);

    return ok({ deleted: id });
  } catch (cause) {
    return serverError(cause);
  }
}
