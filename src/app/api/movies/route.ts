import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";

import { getContent, lookupMovie, mutateContent } from "@/lib/content";
import type { Movie } from "@/lib/content-types";
import { writesBlocked } from "../_lib/guard";
import { ApiError, fail, ok, serverError } from "../_lib/respond";

export const dynamic = "force-dynamic";

/**
 * GET /api/movies              — every title
 * GET /api/movies?section=<id> — titles in one catalog row, in row order
 */
export async function GET(request: NextRequest) {
  try {
    const content = await getContent();
    const sectionId = request.nextUrl.searchParams.get("section");

    if (sectionId) {
      const section = content.sections.find((s) => s.id === sectionId);
      if (!section) return fail(404, `No section with id "${sectionId}"`);

      const movies = section.movieIds
        .map((id) => lookupMovie(content.movies, id))
        .filter((movie) => Boolean(movie));

      return ok({ section: section.id, count: movies.length, movies });
    }

    const movies = Object.values(content.movies);
    return ok({ count: movies.length, movies });
  } catch (cause) {
    return serverError(cause);
  }
}

/**
 * POST /api/movies — create a title.
 *
 * Body: the movie fields plus an optional `sectionId` to place it in a
 * catalog row. Missing optional fields get sensible defaults so a minimal
 * `{ id, title, image, rating, year, description }` is enough.
 */
export async function POST(request: NextRequest) {
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

    const { sectionId, ...fields } = body as Record<string, unknown>;
    for (const required of ["id", "title", "image", "rating", "year", "description"]) {
      if (typeof fields[required] !== "string" || !fields[required]) {
        return fail(400, `"${required}" is required and must be a non-empty string`);
      }
    }

    const content = await getContent();
    const id = fields.id as string;
    // Own properties only, so a legitimate id like "constructor" is not
    // rejected as a duplicate of an inherited Object.prototype member.
    if (Object.hasOwn(content.movies, id)) {
      return fail(409, `A movie with id "${id}" already exists`);
    }

    if (sectionId !== undefined && typeof sectionId !== "string") {
      return fail(400, '"sectionId" must be a string');
    }
    if (sectionId && !content.sections.some((section) => section.id === sectionId)) {
      return fail(404, `No section with id "${sectionId}"`);
    }

    const movie: Movie = {
      id,
      title: fields.title as string,
      subtitle: (fields.subtitle as string) ?? null,
      type: (fields.type as string) ?? null,
      duration: (fields.duration as string) ?? "1h 30m",
      rating: fields.rating as string,
      year: fields.year as string,
      description: fields.description as string,
      image: fields.image as string,
      backdrop: (fields.backdrop as string) ?? (fields.image as string),
      genres: Array.isArray(fields.genres) ? (fields.genres as string[]) : [],
      cast: Array.isArray(fields.cast) ? (fields.cast as Movie["cast"]) : [],
      trailerUrl: (fields.trailerUrl as string) ?? null,
    };

    // Re-check inside the lock: another request could have claimed this id
    // between the check above and the write.
    await mutateContent((current) => {
      if (Object.hasOwn(current.movies, id)) {
        throw new ApiError(409, `A movie with id "${id}" already exists`);
      }

      return {
        ...current,
        movies: { ...current.movies, [id]: movie },
        sections: current.sections.map((section) =>
          section.id === sectionId
            ? { ...section, movieIds: [...section.movieIds, id] }
            : section,
        ),
      };
    });

    revalidatePath("/watch");
    return ok({ movie, section: sectionId ?? null }, { status: 201 });
  } catch (cause) {
    return serverError(cause);
  }
}
