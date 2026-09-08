"use client";

// The floating detail pop-out that appears beside a hovered card, shared by
// the watch rows, the browse grid and the detail page's related grid.
//
// It is positioned in DOCUMENT coordinates, so the page that renders it must
// be the positioned ancestor at the document origin (position: relative on
// the page root), and any extra wrapper around the page would offset it.
import { useRef, useState } from "react";

import { cx } from "@/lib/cx";
import type { Movie } from "@/lib/content-types";
import type { PopoverLabels } from "@/lib/site-types";

export interface PopoverPosition {
  top: number;
  left: number;
  alignRight: boolean;
  height: number;
}

const POPOVER_WIDTH = 330;
/** Space between the card and the pop-out. */
const GAP = 12;
/** Grace period so moving the pointer across the gap does not dismiss it. */
const LEAVE_DELAY_MS = 200;

/* A touch screen has no hover to open this with, so a tap goes straight to
   the title's page and this never appears there. The guard below stops the
   emulated mouseenter a tap fires from flashing it up on the way out. */
const isCoarsePointer = () =>
  typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

/** Hover state and the handlers to spread on cards and on the popover. */
export function useTitlePopover() {
  const [movie, setMovie] = useState<Movie | null>(null);
  const [position, setPosition] = useState<PopoverPosition | null>(null);
  const leaveTimer = useRef<NodeJS.Timeout | null>(null);

  const cancelLeave = () => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
  };

  const hide = () => {
    setMovie(null);
    setPosition(null);
  };

  const cardProps = (target: Movie) => ({
    onMouseEnter: (event: React.MouseEvent) => {
      // Touch screens fire an emulated mouseenter on tap. Letting it through
      // would flash a panel up as the page is already leaving.
      if (isCoarsePointer()) return;
      cancelLeave();
      const rect = event.currentTarget.getBoundingClientRect();
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const scrollX = window.scrollX || document.documentElement.scrollLeft;

      // Flip to the card's left when there is no room on the right.
      let left = rect.right + GAP + scrollX;
      let alignRight = true;
      if (rect.right + GAP + POPOVER_WIDTH > window.innerWidth) {
        left = rect.left - POPOVER_WIDTH - GAP + scrollX;
        alignRight = false;
      }
      if (left < 0) left = 12;

      setPosition({ top: rect.top + scrollY, left, alignRight, height: rect.height });
      setMovie(target);
    },
    onMouseLeave: () => {
      if (isCoarsePointer()) return;
      leaveTimer.current = setTimeout(hide, LEAVE_DELAY_MS);
    },
  });

  const popoverProps = {
    onMouseEnter: cancelLeave,
    onMouseLeave: hide,
  };

  return { movie, position, cardProps, popoverProps };
}

interface TitlePopoverProps {
  movie: Movie;
  position: PopoverPosition;
  labels: PopoverLabels;
  saved: boolean;
  onToggleSave: () => void;
  onWatch: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

/* Same pairing as the hero: outer edges vertical, facing edges cut parallel. */
const ACTION =
  "[--btn-h:32px] [--slant:calc(var(--btn-h)/3)] flex h-(--btn-h) cursor-pointer items-center justify-center rounded-none border-0 transition-[background,transform] duration-200 ease-[ease] hover:[transform:translateY(-1px)]";

export default function TitlePopover({
  movie,
  position,
  labels,
  saved,
  onToggleSave,
  onWatch,
  onMouseEnter,
  onMouseLeave,
}: TitlePopoverProps) {
  return (
    <div
      className="pointer-events-auto absolute z-[999] flex w-[330px] animate-popover-fade-in flex-col overflow-hidden rounded-md border-0 bg-[#0d0d0d] shadow-[0_20px_40px_rgba(0,0,0,0.65),0_0_30px_rgba(0,0,0,0.2)]"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: `${POPOVER_WIDTH}px`,
        height: `${position.height}px`,
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Backdrop header image */}
      <div className="relative h-[48%] w-full overflow-hidden bg-[#101010]">
        <img src={movie.image} alt={movie.title} className="h-full w-full object-cover" />
        <div className="absolute inset-0 z-[1] bg-[image:linear-gradient(to_top,#0d0d0d_0%,rgba(0,0,0,0.4)_60%,transparent_100%)]" />

        <div className="absolute right-0 bottom-0 left-0 z-[2] flex flex-col gap-1 px-[14px] py-3">
          <h3 className="m-0 truncate font-heading text-[1.15rem] font-extrabold text-ink [text-shadow:0_2px_8px_rgba(0,0,0,0.8)]">{movie.title}</h3>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.72rem] font-semibold text-[rgba(255,255,225,0.7)]">
            <span className="rounded-[3px] bg-[rgba(255,255,255,0.12)] px-1 py-px uppercase">{labels.typeBadge}</span>
            <span className="text-[#ffc107]">★ {movie.rating}</span>
            <span className="inline-flex items-center">📅 {movie.year}</span>
            <span className="text-[rgba(255,255,225,0.5)]">{labels.languageBadge}</span>
          </div>
        </div>

        <div className="absolute top-[10px] right-[10px] z-[3] flex items-center gap-1 rounded-[4px] border border-[rgba(255,255,255,0.1)] bg-[rgba(0,0,0,0.65)] px-[6px] py-[3px] text-[0.72rem] font-bold text-[#ffc107] backdrop-blur-[4px]">
          <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <span>{movie.rating}</span>
        </div>
      </div>

      {/* Details body */}
      <div className="flex min-h-0 flex-1 flex-col justify-between gap-2 bg-[#0d0d0d] px-[14px] py-3">
        {/* The title already sits in the backdrop; this heading stays for the
            outline and is not displayed. */}
        <h4 className="hidden">{movie.title}</h4>
        <p className="m-0 line-clamp-2 font-body text-[0.82rem] leading-[1.5] text-[rgba(255,255,225,0.6)]">{movie.description}</p>

        {/* Same edge-gap trick as the hero pair: the facing cuts already sit a
            slant apart, so the trail is pulled back by one and --edge-gap is
            the real distance between the two diagonals. */}
        <div className="mt-1 flex items-center gap-0 [--edge-gap:6px]">
          <button
            type="button"
            className={cx(ACTION, "flex-1 gap-[6px] bg-white pr-[calc(14px+var(--slant))] pl-[14px] font-heading text-[0.82rem] font-bold text-black slant-lead hover:bg-[#e5e5e5]")}
            onClick={onWatch}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            <span>{labels.watchNow}</span>
          </button>

          {/* Borderless: clip-path would shear an outline off along the cut
              edge, so the fill carries the shape. */}
          <button
            type="button"
            className={cx(
              ACTION,
              "ml-[calc(var(--edge-gap)-var(--slant))] gap-[5px] pr-[11px] pl-[calc(11px+var(--slant))] font-heading text-[0.82rem] font-bold text-ink slant-trail",
              saved ? "bg-[#ff2e3d] hover:bg-[#e02432]" : "bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.18)]",
            )}
            onClick={onToggleSave}
            aria-pressed={saved}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              {saved ? (
                <polyline points="20 6 9 17 4 12" />
              ) : (
                <>
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </>
              )}
            </svg>
            <span>{labels.addToWatchlist}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
