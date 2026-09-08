import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";

import { getSections, mutateContent } from "@/lib/content";
import type { SectionAspect, StoredSection } from "@/lib/content-types";
import { writesBlocked } from "../_lib/guard";
import { ApiError, fail, ok, serverError } from "../_lib/respond";

export const dynamic = "force-dynamic";

const ASPECTS: SectionAspect[] = ["portrait", "landscape"];

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

/**
 * POST /api/sections — create a catalog row.
 *
 * Body: { id, title, accent, aspect?, titleColor?, branded?, movieIds?, position? }
 * `position` inserts at a specific index; omitted appends.
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
    const input = body as Record<string, unknown>;

    for (const required of ["id", "title", "accent"]) {
      if (typeof input[required] !== "string" || !input[required]) {
        return fail(400, `"${required}" is required and must be a non-empty string`);
      }
    }
    if (input.aspect !== undefined && !ASPECTS.includes(input.aspect as SectionAspect)) {
      return fail(400, `"aspect" must be one of: ${ASPECTS.join(", ")}`, { aspects: ASPECTS });
    }
    if (input.movieIds !== undefined && !Array.isArray(input.movieIds)) {
      return fail(400, '"movieIds" must be an array of movie ids');
    }
    if (input.position !== undefined && typeof input.position !== "number") {
      return fail(400, '"position" must be a number');
    }

    const id = input.id as string;
    const movieIds = (input.movieIds as string[]) ?? [];

    const section: StoredSection = {
      id,
      title: input.title as string,
      titleColor: (input.titleColor as string) ?? "normal",
      aspect: (input.aspect as SectionAspect) ?? "portrait",
      branded: input.branded === true,
      accent: input.accent as string,
      movieIds,
    };

    const saved = await mutateContent((current) => {
      if (current.sections.some((s) => s.id === id)) {
        throw new ApiError(409, `A section with id "${id}" already exists`);
      }
      // Own properties only: a bare lookup treats inherited Object.prototype
      // keys ("constructor", "toString", …) as existing movies.
      const unknown = movieIds.filter((movieId) => !Object.hasOwn(current.movies, movieId));
      if (unknown.length > 0) {
        throw new ApiError(400, `Unknown movie id(s): ${unknown.join(", ")}`);
      }
      // Mirrors PATCH /api/sections/[id]; without it the create path could
      // store a row that its own update endpoint rejects, and the duplicate
      // renders as two sibling cards sharing one React key.
      if (new Set(movieIds).size !== movieIds.length) {
        throw new ApiError(400, '"movieIds" contains duplicate ids');
      }

      const sections = [...current.sections];
      const at =
        typeof input.position === "number"
          ? Math.max(0, Math.min(sections.length, input.position))
          : sections.length;
      sections.splice(at, 0, section);

      return { ...current, sections };
    });

    revalidatePath("/watch");
    return ok({ section, order: saved.sections.map((s) => s.id) }, { status: 201 });
  } catch (cause) {
    return serverError(cause);
  }
}

/**
 * PUT /api/sections — reorder the rows.
 *
 * Body: { order: ["trending-now", "movies", ...] } — must list every row id
 * exactly once, which makes an accidental drop impossible.
 */
export async function PUT(request: NextRequest) {
  const blocked = writesBlocked();
  if (blocked) return blocked;

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return fail(400, "Body must be valid JSON");
    }
    const order = (body as Record<string, unknown> | null)?.order;
    if (!Array.isArray(order) || order.some((id) => typeof id !== "string")) {
      return fail(400, '"order" must be an array of section ids');
    }

    const saved = await mutateContent((current) => {
      const existing = current.sections.map((s) => s.id);
      const missing = existing.filter((id) => !order.includes(id));
      const unknown = (order as string[]).filter((id) => !existing.includes(id));

      if (unknown.length > 0) throw new ApiError(400, `Unknown section id(s): ${unknown.join(", ")}`);
      if (missing.length > 0) {
        throw new ApiError(
          400,
          `"order" must list every section. Missing: ${missing.join(", ")}`,
        );
      }
      if (new Set(order as string[]).size !== order.length) {
        throw new ApiError(400, '"order" contains duplicate ids');
      }

      const byId = new Map(current.sections.map((s) => [s.id, s]));
      return {
        ...current,
        sections: (order as string[]).map((id) => byId.get(id)!),
      };
    });

    revalidatePath("/watch");
    return ok({ order: saved.sections.map((s) => s.id) });
  } catch (cause) {
    return serverError(cause);
  }
}
