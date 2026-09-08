"use client";

// The Shorts feed: one title per screen, swiped vertically.
//
// Scroll snapping does the paging rather than a transform-driven carousel, so
// the gesture is the platform's own — momentum, rubber-banding and the
// scrollbar all behave the way the device expects, and a keyboard or a
// trackpad reaches it for free.
//
// Which short is "current" is read from an IntersectionObserver rather than
// from scroll offsets: the panels are viewport-height, so the one past 60%
// visible is unambiguously the one being watched, and it survives an address
// bar collapsing mid-scroll where an offset calculation would not.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import Link from "next/link";

import { cx } from "@/lib/cx";
import type { Movie } from "@/lib/content-types";
import type { Brand } from "@/lib/site-types";

interface ShortsClientProps {
  shorts: Movie[];
  startIndex: number;
  brand: Brand;
}

/* Counts are per-title and invented from the id, so a given short shows the
   same numbers on every visit instead of reshuffling on each render. Real
   engagement data would replace this wholesale. */
function seededCount(id: string, salt: number, max: number): number {
  let hash = salt;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return (hash % max) + Math.floor(max / 12);
}

function compact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1).replace(/\.0$/, "")}K`;
  return String(value);
}

const RAIL_BTN =
  "group/rail flex cursor-pointer flex-col items-center gap-1 border-0 bg-transparent p-0 text-ink transition-[transform] duration-200 ease-[ease] active:[transform:scale(0.88)] focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-ink motion-reduce:transition-none";
const RAIL_ICON =
  "grid size-11 place-items-center rounded-[999px] bg-[rgba(0,0,0,0.42)] backdrop-blur-[10px] transition-[background-color,color] duration-200 ease-[ease] group-hover/rail:bg-[rgba(255,255,255,0.16)]";
const RAIL_LABEL = "font-body text-[0.7rem] font-semibold tabular-nums [text-shadow:0_1px_3px_rgba(0,0,0,0.9)]";

export default function ShortsClient({ shorts, startIndex, brand }: ShortsClientProps) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const panelRefs = useRef<(HTMLElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(startIndex);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [disliked, setDisliked] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [muted, setMuted] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Land on the short that was tapped. Instant, not smooth: this is the
  // starting position, not a movement the viewer should watch happen.
  useEffect(() => {
    panelRefs.current[startIndex]?.scrollIntoView({ block: "start", behavior: "auto" });
  }, [startIndex]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = Number((entry.target as HTMLElement).dataset.index);
          if (!Number.isNaN(index)) setActiveIndex(index);
        }
      },
      { root: scroller, threshold: 0.6 },
    );

    for (const panel of panelRefs.current) {
      if (panel) observer.observe(panel);
    }
    return () => observer.disconnect();
  }, [shorts.length]);

  // The address bar swallows Escape on a phone, so this is really for the
  // desktop view of the same feed.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const step = useCallback(
    (direction: 1 | -1) => {
      const next = Math.min(shorts.length - 1, Math.max(0, activeIndex + direction));
      panelRefs.current[next]?.scrollIntoView({ block: "start", behavior: "smooth" });
    },
    [activeIndex, shorts.length],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowDown" || event.key === "PageDown") {
        event.preventDefault();
        step(1);
      }
      if (event.key === "ArrowUp" || event.key === "PageUp") {
        event.preventDefault();
        step(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step]);

  const counts = useMemo(
    () =>
      Object.fromEntries(
        shorts.map((movie) => [
          movie.id,
          {
            likes: seededCount(movie.id, 7, 240_000),
            comments: seededCount(movie.id, 13, 4_800),
            shares: seededCount(movie.id, 29, 9_400),
          },
        ]),
      ),
    [shorts],
  );

  const toggle = (
    setter: React.Dispatch<React.SetStateAction<Record<string, boolean>>>,
    id: string,
    opposite?: React.Dispatch<React.SetStateAction<Record<string, boolean>>>,
  ) => {
    setter((prev) => ({ ...prev, [id]: !prev[id] }));
    // Liking clears a dislike and the other way round, the way a single
    // opinion works everywhere else.
    if (opposite) opposite((prev) => ({ ...prev, [id]: false }));
  };

  return (
    <div className="fixed inset-0 z-0 bg-black font-body text-ink">
      {/* Chrome sits above the feed and never scrolls with it. */}
      <header className="pointer-events-none absolute top-0 right-0 left-0 z-20 flex items-center justify-between gap-3 bg-[image:linear-gradient(to_bottom,rgba(0,0,0,0.72),transparent)] px-4 pt-[max(0.9rem,env(safe-area-inset-top))] pb-8">
        <Link
          href="/watch"
          aria-label="Back to catalog"
          className="pointer-events-auto grid size-11 place-items-center rounded-[999px] bg-[rgba(0,0,0,0.38)] text-ink backdrop-blur-[10px] transition-[background-color] duration-200 ease-[ease] hover:bg-[rgba(255,255,255,0.16)]"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>

        <span className="pointer-events-none inline-flex items-center gap-[7px]">
          {/* Decorative: the word beside it is the accessible name. */}
          <img src={brand.mark} alt="" className="block h-[19px] w-auto" />
          <span className="font-heading text-[1.05rem] font-extrabold tracking-[-0.01em] text-ink">Shorts</span>
        </span>

        <button
          type="button"
          aria-label={muted ? "Unmute" : "Mute"}
          aria-pressed={muted}
          onClick={() => setMuted((value) => !value)}
          className="pointer-events-auto grid size-11 place-items-center rounded-[999px] bg-[rgba(0,0,0,0.38)] text-ink backdrop-blur-[10px] transition-[background-color] duration-200 ease-[ease] hover:bg-[rgba(255,255,255,0.16)]"
        >
          {muted ? (
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M11 5 6 9H3v6h3l5 4z" />
              <line x1="17" y1="9" x2="22" y2="15" />
              <line x1="22" y1="9" x2="17" y2="15" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M11 5 6 9H3v6h3l5 4z" />
              <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
            </svg>
          )}
        </button>
      </header>

      <div
        ref={scrollerRef}
        className="h-dvh w-full snap-y snap-mandatory overflow-y-auto overscroll-y-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {shorts.map((movie, index) => {
          const count = counts[movie.id];
          const isOpen = expanded === movie.id;

          return (
            <section
              key={movie.id}
              data-index={index}
              ref={(node) => {
                panelRefs.current[index] = node;
              }}
              className="relative flex h-dvh w-full snap-start snap-always items-center justify-center overflow-hidden"
              aria-label={`${movie.title}, short ${index + 1} of ${shorts.length}`}
            >
              {/* The still is blown up and blurred behind the frame so a
                  landscape crop never leaves bars down the sides. */}
              <img
                src={movie.image}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full scale-110 object-cover blur-[42px] brightness-[0.42]"
              />
              <img
                src={movie.image}
                alt={movie.title}
                className="relative z-[1] max-h-full w-full object-contain"
              />

              {/* Readability, weighted to the foot where the copy sits. */}
              <div className="pointer-events-none absolute inset-0 z-[2] bg-[image:linear-gradient(to_top,rgba(0,0,0,0.86)_0%,rgba(0,0,0,0.42)_26%,transparent_52%)]" />

              <div className="absolute right-0 bottom-0 left-0 z-[3] flex items-end justify-between gap-3 px-4 pb-[max(1.75rem,calc(env(safe-area-inset-bottom)+0.85rem))]">
                <div className="min-w-0 flex-1 pb-1">
                  <h2 className="m-0 font-heading text-[1.15rem] leading-[1.2] font-extrabold text-ink [text-shadow:0_2px_10px_rgba(0,0,0,0.85)]">
                    {movie.title}
                  </h2>

                  <p className="mt-[6px] flex flex-wrap items-center gap-x-2 gap-y-1 font-body text-[0.76rem] font-semibold text-[rgba(255,255,225,0.72)] [text-shadow:0_1px_4px_rgba(0,0,0,0.9)]">
                    {movie.type && (
                      <span className="rounded-[3px] bg-[rgba(255,255,255,0.16)] px-[6px] py-px uppercase">{movie.type}</span>
                    )}
                    <span className="text-[#ffc107]">★ {movie.rating}</span>
                    <span className="tabular-nums">{movie.year}</span>
                  </p>

                  {/* Tapping the synopsis opens it rather than pushing a
                      separate control onto an already busy frame. */}
                  <button
                    type="button"
                    className="mt-2 block w-full cursor-pointer border-0 bg-transparent p-0 text-left"
                    aria-expanded={isOpen}
                    onClick={() => setExpanded(isOpen ? null : movie.id)}
                  >
                    <span
                      className={cx(
                        "font-body text-[0.82rem] leading-[1.5] text-[rgba(255,255,225,0.86)] [text-shadow:0_1px_5px_rgba(0,0,0,0.9)]",
                        isOpen ? "block max-h-[34vh] overflow-y-auto" : "line-clamp-2",
                      )}
                    >
                      {movie.description}
                    </span>
                    <span className="mt-1 inline-block font-body text-[0.74rem] font-bold text-[rgba(255,255,225,0.6)]">
                      {isOpen ? "Less" : "More"}
                    </span>
                  </button>
                </div>

                <div className="flex flex-none flex-col items-center gap-[18px] pb-1">
                  <button
                    type="button"
                    className={RAIL_BTN}
                    aria-label={liked[movie.id] ? "Remove like" : "Like"}
                    aria-pressed={!!liked[movie.id]}
                    onClick={() => toggle(setLiked, movie.id, setDisliked)}
                  >
                    <span className={cx(RAIL_ICON, liked[movie.id] && "text-[#ff2e3d]")}>
                      <svg viewBox="0 0 24 24" width="23" height="23" fill={liked[movie.id] ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M7 22V10l5-8a2.5 2.5 0 0 1 2.4 3.2L13.4 9H19a2.5 2.5 0 0 1 2.4 3.1l-1.7 7A2.5 2.5 0 0 1 17.3 22z" />
                        <rect x="2" y="10" width="5" height="12" rx="1.2" />
                      </svg>
                    </span>
                    <span className={RAIL_LABEL}>{compact(count.likes + (liked[movie.id] ? 1 : 0))}</span>
                  </button>

                  <button
                    type="button"
                    className={RAIL_BTN}
                    aria-label={disliked[movie.id] ? "Remove dislike" : "Dislike"}
                    aria-pressed={!!disliked[movie.id]}
                    onClick={() => toggle(setDisliked, movie.id, setLiked)}
                  >
                    <span className={cx(RAIL_ICON, disliked[movie.id] && "text-[#7dd3fc]")}>
                      <svg viewBox="0 0 24 24" width="23" height="23" fill={disliked[movie.id] ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M17 2v12l-5 8a2.5 2.5 0 0 1-2.4-3.2L10.6 15H5a2.5 2.5 0 0 1-2.4-3.1l1.7-7A2.5 2.5 0 0 1 6.7 2z" />
                        <rect x="17" y="2" width="5" height="12" rx="1.2" />
                      </svg>
                    </span>
                    <span className={RAIL_LABEL}>Dislike</span>
                  </button>

                  <span className={RAIL_BTN} aria-label={`${count.comments} comments`}>
                    <span className={RAIL_ICON}>
                      <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M21 11.5a8.5 8.5 0 0 1-11.9 7.8L3 21l1.8-5.6A8.5 8.5 0 1 1 21 11.5z" />
                      </svg>
                    </span>
                    <span className={RAIL_LABEL}>{compact(count.comments)}</span>
                  </span>

                  <button
                    type="button"
                    className={RAIL_BTN}
                    aria-label={saved[movie.id] ? "Remove from watchlist" : "Save to watchlist"}
                    aria-pressed={!!saved[movie.id]}
                    onClick={() => toggle(setSaved, movie.id)}
                  >
                    <span className={cx(RAIL_ICON, saved[movie.id] && "text-[#f5c518]")}>
                      <svg viewBox="0 0 24 24" width="22" height="22" fill={saved[movie.id] ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                      </svg>
                    </span>
                    <span className={RAIL_LABEL}>{saved[movie.id] ? "Saved" : "Save"}</span>
                  </button>

                  <Link
                    href={`/watch/${movie.id}`}
                    className={RAIL_BTN}
                    aria-label={`Open ${movie.title}`}
                  >
                    <span className={RAIL_ICON}>
                      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
                        <polyline points="8 8 12 4 16 8" />
                        <line x1="12" y1="4" x2="12" y2="15" />
                      </svg>
                    </span>
                    <span className={RAIL_LABEL}>{compact(count.shares)}</span>
                  </Link>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {/* Pointer affordance only: on a touch screen you swipe. */}
      <div className="pointer-events-none absolute top-1/2 right-4 z-20 hidden -translate-y-1/2 flex-col gap-3 pointer-fine:flex">
        <button
          type="button"
          aria-label="Previous short"
          disabled={activeIndex === 0}
          onClick={() => step(-1)}
          className="pointer-events-auto grid size-11 cursor-pointer place-items-center rounded-[999px] border-0 bg-[rgba(0,0,0,0.45)] text-ink backdrop-blur-[10px] transition-[background-color,opacity] duration-200 ease-[ease] hover:bg-[rgba(255,255,255,0.16)] disabled:cursor-default disabled:opacity-25"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </button>
        <button
          type="button"
          aria-label="Next short"
          disabled={activeIndex === shorts.length - 1}
          onClick={() => step(1)}
          className="pointer-events-auto grid size-11 cursor-pointer place-items-center rounded-[999px] border-0 bg-[rgba(0,0,0,0.45)] text-ink backdrop-blur-[10px] transition-[background-color,opacity] duration-200 ease-[ease] hover:bg-[rgba(255,255,255,0.16)] disabled:cursor-default disabled:opacity-25"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>
    </div>
  );
}
