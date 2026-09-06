import Link from "next/link";

import { getChrome } from "@/lib/site";

// Rendered without the detail page around it, so it restates the few tokens it
// needs. Returns a real 404 status.
export default async function MovieNotFound() {
  const { notFound } = await getChrome();

  return (
    <div className="flex min-h-dvh flex-1 flex-col items-center justify-center gap-7 bg-black px-[clamp(1.25rem,5vw,4rem)] py-8 text-center font-body text-ink">
      <h1 className="font-heading text-[clamp(1.75rem,5vw,2.75rem)] leading-[1.15] font-light tracking-[-0.02em] break-words">{notFound.title}</h1>
      <Link
        href="/watch"
        className="border-b border-[rgba(250,250,250,0.28)] pb-[0.35rem] text-[0.875rem] tracking-[0.08em] text-[#8a8a8a] uppercase transition-[color,border-color] duration-200 ease-[ease] hover:border-[#fafafa] hover:text-ink"
      >
        {notFound.backLabel}
      </Link>
    </div>
  );
}
