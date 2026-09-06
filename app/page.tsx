import { getLanding, resolveRole } from "@/lib/site";

import LandingClient from "./LandingClient";

// Read the site copy store on every request so edits appear without a
// rebuild. Filesystem reads are not treated as a request-time API, so without
// this the copy would be baked into the build output.
export const dynamic = "force-dynamic";

// `searchParams` is a Promise in this Next version and must be awaited.
type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function Home({ searchParams }: PageProps) {
  // `?role=` selects the audience; anything unrecognised falls back to family.
  const role = resolveRole((await searchParams).role);
  const { content, introMinimizeDelayMs, stripeStaggerSeconds } = await getLanding(role);

  return (
    <LandingClient
      role={role}
      content={content}
      introMinimizeDelayMs={introMinimizeDelayMs}
      stripeStaggerSeconds={stripeStaggerSeconds}
    />
  );
}
