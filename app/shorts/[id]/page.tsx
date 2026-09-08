import { notFound } from "next/navigation";

import { getSections } from "@/lib/content";
import { SHORTS_SECTION_ID } from "@/lib/content-types";
import { getChrome } from "@/lib/site";

import ShortsClient from "./ShortsClient";

// Same reason as the catalog: read the store per request so edits to the
// Shorts row appear without a rebuild.
export const dynamic = "force-dynamic";

interface ShortsPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ShortsPageProps) {
  const { id } = await params;
  const [sections] = await Promise.all([getSections()]);
  const shorts = sections.find((s) => s.id === SHORTS_SECTION_ID);
  const current = shorts?.movies.find((m) => m.id === id);

  return { title: current ? current.title : "Shorts" };
}

export default async function ShortsPage({ params }: ShortsPageProps) {
  const { id } = await params;
  const [sections, chrome] = await Promise.all([getSections(), getChrome()]);

  const shorts = sections.find((section) => section.id === SHORTS_SECTION_ID);
  if (!shorts || shorts.movies.length === 0) notFound();

  const startIndex = shorts.movies.findIndex((movie) => movie.id === id);
  if (startIndex === -1) notFound();

  return <ShortsClient shorts={shorts.movies} startIndex={startIndex} brand={chrome.brand} />;
}
