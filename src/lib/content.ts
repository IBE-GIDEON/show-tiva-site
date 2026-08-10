// Server-only data access for the movie catalog store.
//
// The store is data/content.json, read from disk per request so edits (from
// the API routes or by hand) show up without a rebuild. Filesystem mechanics
// live in json-store.ts; this module owns the catalog's shape and queries.
//
// Reads are wrapped in React's `cache()`, which is request-scoped. A
// module-level variable would memoize for the whole process lifetime and
// reintroduce exactly the staleness this layer exists to avoid.
import "server-only";

import { cache } from "react";

import type { CastMember, Content, Movie, Section } from "./content-types";
import { mutateJson, readJson, StoreError, writeJson } from "./json-store";

const FILE = "content.json";

class ContentError extends StoreError {
  constructor(message: string) {
    super(FILE, message);
    this.name = "ContentError";
  }
}

/** Validate a cast array in place, naming the offending path on failure. */
function assertCast(value: unknown, at: string): void {
  if (!Array.isArray(value)) throw new ContentError(`${at} must be an array`);

  for (const [i, member] of value.entries()) {
    if (typeof member !== "object" || member === null) {
      throw new ContentError(`${at}[${i}] must be an object`);
    }
    const person = member as Record<string, unknown>;
    for (const field of ["name", "role"]) {
      if (typeof person[field] !== "string" || !person[field]) {
        throw new ContentError(`${at}[${i}].${field} must be a non-empty string`);
      }
    }
    if (person.image !== null && typeof person.image !== "string") {
      throw new ContentError(`${at}[${i}].image must be a string or null`);
    }
  }
}

/**
 * Narrow the parsed JSON to `Content`, failing loudly with the offending
 * path. JSON.parse returns `any`, so without this the first sign of a bad
 * store would be `undefined` surfacing inside JSX.
 */
function assertContent(value: unknown): Content {
  if (typeof value !== "object" || value === null) {
    throw new ContentError("expected a top-level object");
  }
  const c = value as Record<string, unknown>;

  if (!Array.isArray(c.heroSlideIds)) throw new ContentError("heroSlideIds must be an array");
  if (!Array.isArray(c.sections)) throw new ContentError("sections must be an array");
  assertCast(c.defaultCast, "defaultCast");
  if (typeof c.movies !== "object" || c.movies === null) {
    throw new ContentError("movies must be an object keyed by id");
  }

  // Every field is checked, not just the required ones. An unchecked field
  // written through the API would be persisted and then crash rendering (e.g.
  // `cast: "nobody"` throws on `movie.cast.map`), which a 400 should catch.
  for (const [id, movie] of Object.entries(c.movies as Record<string, unknown>)) {
    if (typeof movie !== "object" || movie === null) {
      throw new ContentError(`movies.${id} must be an object`);
    }
    const m = movie as Record<string, unknown>;

    for (const field of ["id", "title", "image", "rating", "year", "description"]) {
      if (typeof m[field] !== "string" || !m[field]) {
        throw new ContentError(`movies.${id}.${field} must be a non-empty string`);
      }
    }
    if (m.id !== id) {
      throw new ContentError(`movies.${id}.id must equal its key (got "${String(m.id)}")`);
    }

    // Non-empty when present, since the UI renders them directly.
    for (const field of ["duration", "backdrop"]) {
      if (typeof m[field] !== "string" || !m[field]) {
        throw new ContentError(`movies.${id}.${field} must be a non-empty string`);
      }
    }

    // Nullable strings.
    for (const field of ["subtitle", "type", "trailerUrl"]) {
      if (m[field] !== null && typeof m[field] !== "string") {
        throw new ContentError(`movies.${id}.${field} must be a string or null`);
      }
    }

    if (!Array.isArray(m.genres) || m.genres.some((g) => typeof g !== "string")) {
      throw new ContentError(`movies.${id}.genres must be an array of strings`);
    }

    assertCast(m.cast, `movies.${id}.cast`);
  }

  for (const [i, section] of (c.sections as unknown[]).entries()) {
    if (typeof section !== "object" || section === null) {
      throw new ContentError(`sections[${i}] must be an object`);
    }
    const s = section as Record<string, unknown>;
    for (const field of ["id", "title", "accent", "aspect"]) {
      if (typeof s[field] !== "string" || !s[field]) {
        throw new ContentError(`sections[${i}].${field} must be a non-empty string`);
      }
    }
    if (!Array.isArray(s.movieIds) || s.movieIds.some((m) => typeof m !== "string")) {
      throw new ContentError(`sections[${i}].movieIds must be an array of strings`);
    }
  }

  for (const [i, hero] of (c.heroSlideIds as unknown[]).entries()) {
    if (typeof hero !== "string") throw new ContentError(`heroSlideIds[${i}] must be a string`);
  }

  return value as Content;
}

/** Read and validate the store. Request-scoped: one disk read per request. */
export const getContent = cache(async (): Promise<Content> => {
  return readJson(FILE, assertContent);
});

/**
 * Look up a movie by id, own properties only.
 *
 * `movies` comes from JSON.parse, so it inherits Object.prototype: a bare
 * `movies[id]` lookup resolves ids like "constructor", "toString" and
 * "__proto__" to inherited members. Those are truthy, so they slipped past
 * every `if (!movie)` guard — /watch/constructor answered 500 instead of 404,
 * and the API returned 200 with the movie field missing.
 */
export function lookupMovie(movies: Content["movies"], id: string): Movie | undefined {
  return Object.hasOwn(movies, id) ? movies[id] : undefined;
}

/** Validate, back up, then atomically replace the catalog store. */
export async function writeContent(next: Content): Promise<Content> {
  return writeJson(FILE, { ...next, updatedAt: new Date().toISOString() }, assertContent);
}

/**
 * Read-modify-write the catalog under a single lock, so overlapping requests
 * cannot each read the same snapshot and lose one another's changes.
 */
export async function mutateContent(
  mutator: (current: Content) => Content | Promise<Content>,
): Promise<Content> {
  return mutateJson(FILE, assertContent, async (current) => ({
    ...(await mutator(current)),
    updatedAt: new Date().toISOString(),
  }));
}

/**
 * The shared fallback cast.
 *
 * Reads deliberately return the STORED value of `movie.cast` — an empty array
 * stays empty. Substituting the default during a read made round-tripping
 * unsafe: an edit form prefilled from the API would save those defaults back
 * and the title would stop tracking this list. Callers that render a cast
 * apply this fallback themselves.
 */
export async function getDefaultCast(): Promise<CastMember[]> {
  return (await getContent()).defaultCast;
}

/** Ordered hero carousel slides. */
export async function getHeroSlides(): Promise<Movie[]> {
  const content = await getContent();
  return content.heroSlideIds
    .map((id) => lookupMovie(content.movies, id))
    .filter((movie): movie is Movie => Boolean(movie));
}

/** Catalog rows with `movieIds` resolved to full records. */
export async function getSections(): Promise<Section[]> {
  const content = await getContent();
  return content.sections.map(({ movieIds, ...section }) => ({
    ...section,
    movies: movieIds
      .map((id) => lookupMovie(content.movies, id))
      .filter((movie): movie is Movie => Boolean(movie)),
  }));
}

/**
 * A single title exactly as stored, or undefined when the id is unknown.
 * `cast` is NOT resolved against `defaultCast` — see getDefaultCast().
 */
export async function getMovieById(id: string): Promise<Movie | undefined> {
  const content = await getContent();
  return lookupMovie(content.movies, id);
}

/**
 * Related titles for the "You may also like" grid: catalog order, deduped,
 * excluding the current title. Mirrors the previous getRelated() behaviour.
 */
export async function getRelated(id: string, count = 12): Promise<Movie[]> {
  const content = await getContent();
  const seen = new Set<string>([id]);
  const related: Movie[] = [];

  for (const section of content.sections) {
    for (const movieId of section.movieIds) {
      if (seen.has(movieId)) continue;
      seen.add(movieId);
      const movie = lookupMovie(content.movies, movieId);
      if (movie) related.push(movie);
      if (related.length >= count) return related;
    }
  }

  return related;
}
