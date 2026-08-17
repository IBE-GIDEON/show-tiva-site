import type { Metadata } from "next";

import { loadBrowse } from "../_lib/browse-data";
import BrowseClient from "./BrowseClient";

// Read the store per request so catalog edits appear without a rebuild.
export const dynamic = "force-dynamic";

// `params` is a Promise in this Next version and must be awaited.
type PageProps = { params: Promise<{ section: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { section } = await params;
  const data = await loadBrowse(section).catch(() => null);
  if (!data) return { title: "Category not found — Show Tiva" };

  return {
    title: `${data.section.title} — Show Tiva`,
    description: `Browse every title in ${data.section.title}.`,
  };
}

/** The destination for a catalog row's "View All". */
export default async function BrowsePage({ params }: PageProps) {
  // loadBrowse calls notFound() itself for an unknown id.
  const data = await loadBrowse((await params).section);
  return <BrowseClient {...data} />;
}
