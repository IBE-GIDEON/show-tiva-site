import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getDefaultCast, getMovieById, getRelated } from "@/lib/content";

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

  const [related, defaultCast] = await Promise.all([getRelated(movie.id, 12), getDefaultCast()]);

  // The cast fallback is applied here at render time rather than inside the
  // data layer, so the API keeps returning the stored value and an edit form
  // can round-trip safely.
  const cast = movie.cast.length > 0 ? movie.cast : defaultCast;

  // No wrapper element: the hover popover positions against `.detailPage`
  // inside DetailClient.
  return <DetailClient movie={movie} related={related} cast={cast} />;
}
