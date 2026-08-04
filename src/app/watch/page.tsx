import { getHeroSlides, getSections } from "@/lib/content";

import WatchClient from "./WatchClient";

// Read the content store on every request so edits appear without a rebuild.
// Without this the page would be prerendered at build time: filesystem reads
// are not treated as a request-time API, so Next would happily bake the
// catalog into the build output.
export const dynamic = "force-dynamic";

export default async function WatchPage() {
  const [heroSlides, sections] = await Promise.all([getHeroSlides(), getSections()]);

  // Rendered without a wrapper element on purpose: the hover popover is
  // absolutely positioned using document coordinates, and it resolves against
  // `.watchContainer` inside WatchClient. Any extra element here would offset
  // the popover.
  return <WatchClient heroSlides={heroSlides} sections={sections} />;
}
