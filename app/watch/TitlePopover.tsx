"use client";

// The floating detail pop-out that appears beside a hovered card, shared by
// the watch rows, the browse grid and the detail page's related grid.
//
// It is positioned in DOCUMENT coordinates, so the page that renders it must
// be the positioned ancestor at the document origin (position: relative on
// the page root), and any extra wrapper around the page would offset it.
import { useEffect, useRef, useState } from "react";

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

/* A touch screen has no hover to open this with, and a 330px panel beside a
   132px card has nowhere to go on a phone. There the first tap on a card
   opens it as a centred sheet instead of following the card through, so the
   details are readable before you commit to the page. */
const isCoarsePointer = () =>
  typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

/** Hover state and the handlers to spread on cards and on the popover. */
export function useTitlePopover() {
  const [movie, setMovie] = useState<Movie | null>(null);
  const [position, setPosition] = useState<PopoverPosition | null>(null);
  /** Open as a centred sheet rather than anchored beside the card. */
  const [sheet, setSheet] = useState(false);
  const leaveTimer = useRef<NodeJS.Timeout | null>(null);

  const cancelLeave = () => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
  };

  const hide = () => {
    setMovie(null);
    setPosition(null);
    setSheet(false);
  };

  // The sheet is modal: Escape closes it and the page behind it holds still.
  useEffect(() => {
    if (!sheet) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") hide();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheet]);

  const cardProps = (target: Movie) => ({
    onMouseEnter: (event: React.MouseEvent) => {
      // Touch screens fire an emulated mouseenter on tap; the sheet in onClick
      // handles those, and letting this run too would anchor a panel off screen.
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
    // Capture, not bubble: next/link reads event.defaultPrevented inside its
    // own handler on the anchor, which runs before any ancestor's, so
    // preventing on the way back up would be too late to stop the navigation.
    onClickCapture: (event: React.MouseEvent) => {
      if (!isCoarsePointer()) return;
      // The bookmark button sits inside the card and does its own job.
      if ((event.target as Element).closest("button")) return;

      event.preventDefault();
      setPosition({ top: 0, left: 0, alignRight: true, height: 0 });
      setSheet(true);
      setMovie(target);
    },
  });

  const popoverProps = {
    onMouseEnter: cancelLeave,
    onMouseLeave: hide,
    sheet,
    onDismiss: hide,
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
  /** Centred and modal instead of anchored beside the card. */
  sheet?: boolean;
  onDismiss?: () => void;
}

/* Same pairing as the hero: outer edges vertical, facing edges cut parallel. */
const ACTION =
  "[--btn-h:32px] [--slant:calc(var(--btn-h)/3)] flex h-(--btn-h) cursor-pointer items-center justify-center rounded-none border-0 transition-[background,transform] duration-200 ease-[ease] hover:[transform:translateY(-1px)] pointer-coarse:[--btn-h:44px]";

export default function TitlePopover({
  movie,
  position,
  labels,
  saved,
  onToggleSave,
  onWatch,
  onMouseEnter,
  onMouseLeave,
  sheet = false,
  onDismiss,
}: TitlePopoverProps) {
  return (
    <>
      {/* Tapping off the sheet closes it. Anchored mode has no backdrop: it
          follows the pointer and dismisses itself on leave. */}
      {sheet && (
        <button
          type="button"
          className="fixed inset-0 z-[998] animate-overlay-fade cursor-default border-0 bg-[rgba(0,0,0,0.62)] backdrop-blur-[6px]"
          aria-label="Close details"
          onClick={onDismiss}
        />
      )}

      <div
      className={cx(
        "z-[999] flex flex-col overflow-hidden rounded-md border-0 bg-[#0d0d0d] shadow-[0_20px_40px_rgba(0,0,0,0.65),0_0_30px_rgba(0,0,0,0.2)]",
        sheet
          ? // Sized by its own content rather than by the card it came from,
            // up to what the screen allows.
            "fixed top-1/2 left-1/2 max-h-[calc(100dvh-2rem)] w-[min(360px,calc(100vw-32px))] animate-popover-fade-in [transform:translate(-50%,-50%)]"
          : "pointer-events-auto absolute w-[330px] animate-popover-fade-in",
      )}
      style={
        sheet
          ? undefined
          : {
              top: `${position.top}px`,
              left: `${position.left}px`,
              width: `${POPOVER_WIDTH}px`,
              height: `${position.height}px`,
            }
      }
      role={sheet ? "dialog" : undefined}
      aria-modal={sheet ? true : undefined}
      aria-label={sheet ? movie.title : undefined}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Backdrop header image. Anchored, it takes a share of the card's
          height; as a sheet there is no card height to share, so it sets its
          own shape. */}
      <div className={cx("relative w-full overflow-hidden bg-[#101010]", sheet ? "aspect-[16/9]" : "h-[48%]")}>
        <img src={movie.image} alt={movie.title} className="h-full w-full object-cover" />
        <div className="absolute inset-0 z-[1] bg-[image:linear-gradient(to_top,#0d0d0d_0%,rgba(0,0,0,0.4)_60%,transparent_100%)]" />

        <div className="absolute right-0 bottom-0 left-0 z-[2] flex flex-col gap-1 px-[14px] py-3">
          <h3 className={cx("m-0 font-heading text-[1.15rem] font-extrabold text-ink [text-shadow:0_2px_8px_rgba(0,0,0,0.8)]", sheet ? "line-clamp-2" : "truncate")}>{movie.title}</h3>
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
      <div className={cx("flex min-h-0 flex-1 flex-col justify-between gap-2 bg-[#0d0d0d]", sheet ? "px-4 pt-3 pb-4" : "px-[14px] py-3")}>
        {/* The title already sits in the backdrop; this heading stays for the
            outline and is not displayed. */}
        <h4 className="hidden">{movie.title}</h4>
        <p className={cx("m-0 font-body text-[0.82rem] leading-[1.5] text-[rgba(255,255,225,0.6)]", sheet ? "overflow-y-auto" : "line-clamp-2")}>{movie.description}</p>

        <div className="mt-1 flex items-center gap-1">
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

          {/* Wider than tall so the cut does not close up the icon's breathing
              room. Borderless: clip-path would shear an outline off along the
              cut edge. */}
          <button
            type="button"
            className={cx(
              ACTION,
              "w-[calc(32px+var(--slant))] pl-(--slant) text-ink slant-trail",
              saved ? "bg-[#ff2e3d] hover:bg-[#e02432]" : "bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.18)]",
            )}
            onClick={onToggleSave}
            aria-label={labels.addToWatchlist}
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
          </button>
        </div>
      </div>
      </div>
    </>
  );
}
