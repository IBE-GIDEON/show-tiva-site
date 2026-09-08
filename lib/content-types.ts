// Pure type definitions for the content store.
//
// This file must stay free of imports so that both server and client
// components can use these types. All runtime/filesystem access lives in
// content.ts, which is server-only.

export interface CastMember {
  name: string;
  role: string;
  image: string | null;
}

export interface Movie {
  id: string;
  title: string;
  subtitle: string | null;
  /** Falls back to "Movie" in the UI when null. */
  type: string | null;
  /** Runtime without the "Duration " prefix, e.g. "2h 8m". */
  duration: string;
  rating: string;
  year: string;
  description: string;
  /** Poster / card artwork. */
  image: string;
  /** Wide artwork for the detail hero; currently mirrors `image`. */
  backdrop: string;
  genres: string[];
  /** Empty means "use the store's defaultCast". */
  cast: CastMember[];
  /** Null means the UI falls back to a poster thumbnail. */
  trailerUrl: string | null;
}

/**
 * Card shape for a row, which follows what the row *is*:
 *
 * - `portrait` for a category — a bucket a title belongs to by what it is,
 *   whether that is a type (Movies, Cartoons & Animation, Wholesome Series)
 *   or a genre (Magical Worlds & Fantasy, Action & Adventure). Poster shape.
 * - `landscape` for a collection — a shifting, curated cut across the catalog
 *   rather than a bucket anything belongs to (Trending Now, New Releases).
 *   Still shape.
 *
 * A title sits in exactly one category and in any number of collections, which
 * is the test when adding a row.
 */
export type SectionAspect = "portrait" | "landscape";

/** A catalog row as stored: references movies by id. */
export interface StoredSection {
  id: string;
  title: string;
  titleColor: string;
  aspect: SectionAspect;
  /** Heading colour used by the catalog row. */
  accent: string;
  /**
   * Marks a row as the brand's own rather than one more slice of the
   * catalog: the heading takes the logo's mark and its off-white instead of
   * a colour of its own. Meant to stay rare — a second branded row would
   * cost the first one the distinction.
   */
  branded?: boolean;
  movieIds: string[];
}

/** A catalog row with its `movieIds` resolved to full records. */
export interface Section extends Omit<StoredSection, "movieIds"> {
  movies: Movie[];
}

/** Shape of data/content.json. */
export interface Content {
  version: number;
  updatedAt: string | null;
  defaultCast: CastMember[];
  heroSlideIds: string[];
  sections: StoredSection[];
  movies: Record<string, Movie>;
}

/**
 * The one section that opens its own player instead of a browse grid.
 *
 * Shorts is a surface, not a shelf: its cards go to the vertical feed at
 * /shorts and its heading carries no "View all", because there is no grid of
 * them to see. Kept here as a name rather than spelled into the components,
 * so the coupling is greppable.
 */
export const SHORTS_SECTION_ID = "shorts";
