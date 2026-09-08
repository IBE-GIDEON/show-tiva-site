"use client";

// The catalog card, shared by the watch rows, the browse grid and the detail
// page's related grid, so a title looks and behaves identically everywhere.
//
// One real link is stretched over the artwork: the card is reachable by
// keyboard and openable in a new tab, and its accessible name is the title.
// The link sits above the hover overlay, so a click anywhere on the artwork
// opens the title, and below the bookmark button and rating badge, which stay
// siblings rather than children so the HTML remains valid.
import Link from "next/link";

import { cx } from "@/lib/cx";
import type { Movie } from "@/lib/content-types";

type Aspect = "portrait" | "landscape";

interface PosterCardProps {
  movie: Movie;
  aspect?: Aspect;
  saved: boolean;
  saveLabel: string;
  onToggleSave: () => void;
  onMouseEnter?: (event: React.MouseEvent) => void;
  onMouseLeave?: () => void;
  /** Capture-phase click, so a touch tap can open the popover instead of
      following the card's link. */
  onClickCapture?: (event: React.MouseEvent) => void;
}

/* `group` lets every hover reveal below key off the card, and
   `group-has-[a:focus-visible]` gives keyboard focus the same reveal plus a
   ring on the frame, scoped to :focus-visible so a mouse click on the bookmark
   button does not light the whole card up. */
const CARD: Record<Aspect, string> = {
  portrait: "group flex-[0_0_190px] max-[768px]:flex-[0_0_132px] cursor-pointer transition-[transform] duration-280 ease-[ease]",
  landscape: "group flex-[0_0_380px] max-[768px]:flex-[0_0_260px] cursor-pointer transition-[transform] duration-280 ease-[ease]",
};

const FRAME: Record<Aspect, string> = {
  portrait: "aspect-[1/1.45]",
  landscape: "aspect-[16/9]",
};

const FRAME_BASE =
  "relative w-full overflow-hidden rounded-md border-0 bg-[#131313] shadow-[0_8px_22px_rgba(0,0,0,0.45)] transition-shadow duration-280 ease-[ease] group-hover:shadow-[0_14px_32px_rgba(0,0,0,0.6)] group-has-[a:focus-visible]:shadow-[0_0_0_3px_#ffffe1,0_14px_32px_rgba(0,0,0,0.6)]";

const BOOKMARK =
  "absolute top-2 left-2 z-[7] flex h-7 w-9 pointer-coarse:h-[34px] pointer-coarse:w-11 cursor-pointer items-center justify-center border-0 bg-transparent p-0 drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)] transition-[opacity,color] duration-200 ease-[ease] hover:opacity-100";

export default function PosterCard({
  movie,
  aspect = "portrait",
  saved,
  saveLabel,
  onToggleSave,
  onMouseEnter,
  onMouseLeave,
  onClickCapture,
}: PosterCardProps) {
  return (
    <div
      className={CARD[aspect]}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClickCapture={onClickCapture}
    >
      <div className={cx(FRAME_BASE, FRAME[aspect])}>
        {/* Decorative: the stretched link below carries the title. */}
        <img
          src={movie.image}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition-[transform] duration-400 ease-[ease] group-hover:[transform:scale(1.04)]"
        />

        <Link href={`/watch/${movie.id}`} className="absolute inset-0 z-[5] rounded-[inherit] outline-none">
          <span className="absolute h-px w-px overflow-hidden whitespace-nowrap [clip-path:inset(50%)]">{movie.title}</span>
        </Link>

        {/* Bookmark / Save (top-left). Skewed to the logo's slant, with the
            icon counter-skewed so it stays upright. */}
        <button
          type="button"
          className={cx(
            BOOKMARK,
            saved
              ? "text-[#f5c518] opacity-100"
              : "text-ink opacity-90",
          )}
          aria-label={saveLabel}
          aria-pressed={saved}
          onClick={onToggleSave}
        >
          <svg viewBox="0 0 24 24" width="15" height="15" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </button>

        {/* Rating badge (top-right) */}
        <div className="absolute top-2 right-2 z-[7] inline-flex items-center gap-[3px] rounded-md bg-[rgba(0,0,0,0.65)] px-[7px] py-[3px] font-body text-[0.72rem] leading-none font-bold text-[#f5c518] backdrop-blur-[6px] [&_span]:text-ink">
          <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <span>{movie.rating || "—"}</span>
        </div>

        {/* Hover play button */}
        <div className="absolute inset-0 z-[4] flex items-center justify-center bg-[rgba(0,0,0,0.4)] opacity-0 backdrop-blur-[2px] transition-opacity duration-250 ease-[ease] group-hover:opacity-100 group-has-[a:focus-visible]:opacity-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-[50%] bg-[#ff2e3d] text-ink shadow-[0_4px_14px_rgba(0,0,0,0.4)] transition-[transform] duration-280 ease-[cubic-bezier(0.34,1.56,0.64,1)] [transform:scale(0.85)] group-hover:[transform:scale(1)] group-has-[a:focus-visible]:[transform:scale(1)]">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>

        {/* Title / year revealed on hover — and standing on touch, where there
            is no hover to reveal it and the card would otherwise be an
            unlabelled thumbnail. */}
        <div className="pointer-events-none absolute right-0 bottom-0 left-0 z-[6] flex flex-col gap-[2px] bg-[image:linear-gradient(to_top,rgba(0,0,0,0.95)_0%,rgba(0,0,0,0.4)_55%,transparent_100%)] px-[10px] pt-7 pb-[10px] opacity-0 transition-[opacity,transform] duration-250 ease-[ease] [transform:translateY(6px)] group-hover:opacity-100 group-hover:[transform:translateY(0)] group-has-[a:focus-visible]:opacity-100 group-has-[a:focus-visible]:[transform:translateY(0)] pointer-coarse:opacity-100 pointer-coarse:[transform:translateY(0)]">
          <h4 className="m-0 truncate font-heading text-[0.88rem] font-semibold text-ink max-[768px]:text-[0.78rem]">{movie.title}</h4>
          <span className="text-[0.75rem] font-medium text-[#9ca3af] max-[768px]:text-[0.68rem]">{movie.year}</span>
        </div>
      </div>
    </div>
  );
}
