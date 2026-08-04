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

export type SectionAspect = "portrait" | "landscape";

/** A catalog row as stored: references movies by id. */
export interface StoredSection {
  id: string;
  title: string;
  titleColor: string;
  aspect: SectionAspect;
  /** Heading colour used by the catalog row. */
  accent: string;
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
