// Shared data loader for the category-browse design previews.
//
// Every variant gets the same payload so the comparison is purely about
// design. `?section=` picks the category, which is what "View All" on the
// catalog row will eventually pass.
import "server-only";

import { notFound } from "next/navigation";

import { getContent, getSections } from "@/lib/content";
import type { Movie, Section } from "@/lib/content-types";
import { getChrome } from "@/lib/site";
import type {
  Brand,
  DetailLabels,
  FooterContent,
  NotFoundLabels,
  PopoverLabels,
  WatchLabels,
} from "@/lib/site-types";

export const DEFAULT_SECTION_ID = "trending-now";

export interface BrowseChrome {
  brand: Brand;
  footer: FooterContent;
  watch: WatchLabels;
  detail: DetailLabels;
  popover: PopoverLabels;
  notFound: NotFoundLabels;
}

/** Facet values derived from the catalog, for the filter controls. */
export interface BrowseFacets {
  genres: string[];
  years: string[];
  types: string[];
}

/** The props every browse variant receives. Identical across all seven. */
export interface BrowseData {
  /** The category being viewed, with its movies resolved. */
  section: Section;
  /** Every category, for the switcher / breadcrumb. */
  sections: Section[];
  /** The whole catalog — filters widen beyond the current category. */
  allMovies: Movie[];
  facets: BrowseFacets;
  chrome: BrowseChrome;
}

export async function loadBrowse(sectionId?: string): Promise<BrowseData> {
  const [sections, content, chrome] = await Promise.all([
    getSections(),
    getContent(),
    getChrome(),
  ]);

  const wanted = sectionId || DEFAULT_SECTION_ID;
  const section = sections.find((s) => s.id === wanted);
  if (!section) notFound();

  const allMovies = Object.values(content.movies);

  const genres = [...new Set(allMovies.flatMap((m) => m.genres))].filter(Boolean).sort();
  const years = [...new Set(allMovies.map((m) => m.year))].filter(Boolean).sort().reverse();
  const types = [...new Set(allMovies.map((m) => m.type).filter((t): t is string => Boolean(t)))].sort();

  return { section, sections, allMovies, facets: { genres, years, types }, chrome };
}

/** Normalises a search param that may arrive as an array. */
export function readParam(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}
