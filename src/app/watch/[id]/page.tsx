import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getAllMovies, getMovieById, getRelated } from "@/lib/content";
import { getChrome } from "@/lib/site";

import DetailClient from "./DetailClient";

// Read the store per request so content edits appear without a rebuild.
export const dynamic = "force-dynamic";

// `params` is a Promise in this Next version and must be awaited.
type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const movie = await getMovieById(id);
  if (!movie) return { title: "Title not found — Show Tiva" };

  return {
    title: `${movie.title} — Show Tiva`,
    description: movie.description,
  };
}

export default async function MovieDetailPage({ params }: PageProps) {
  const { id } = await params;
  const movie = await getMovieById(id);

  // Renders watch/[id]/not-found.tsx and returns a real 404 status.
  if (!movie) notFound();

  // No cast here any more: the detail page does not show one, so it does not
  // read defaultCast either. The stored cast and /api/cast are untouched.
  // allMovies feeds the global search overlay in the header.
  const [related, allMovies, chrome] = await Promise.all([
    getRelated(movie.id, 12),
    getAllMovies(),
    getChrome(),
  ]);

  return (
    <DetailClient
      movie={movie}
      related={related}
      allMovies={allMovies}
      brand={chrome.brand}
      footer={chrome.footer}
      labels={chrome.detail}
      popoverLabels={chrome.popover}
    />
  );
}
