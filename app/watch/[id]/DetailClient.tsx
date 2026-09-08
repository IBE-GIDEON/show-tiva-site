"use client";

// "Premium Minimal" detail page.
//
// Confident restraint: near-black, near-white, one mid-grey, and a single
// accent that appears exactly once (the rating). No pills, no badges, no card
// borders — metadata is quiet inline text on hairline dividers. Type carries
// the hierarchy; the artwork appears once, full-bleed and unadorned.
//
// Spacing runs on a single rhythm unit (--step) and its halves, so every
// section lands on the same vertical grid at every breakpoint.
import React, { useEffect, useRef, useState, useSyncExternalStore } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { cx } from "@/lib/cx";
import { getSignupHref, isDemoSignedIn } from "../../_auth/demo-auth";
import ProfileMenu from "../../_auth/ProfileMenu";
import type { Movie } from "@/lib/content-types";
import type { Brand, DetailLabels, FooterContent, PopoverLabels } from "@/lib/site-types";
import PosterCard from "../PosterCard";
import SearchOverlay from "../SearchOverlay";
import SiteFooter from "../SiteFooter";
import TitlePopover, { useTitlePopover } from "../TitlePopover";

interface DetailClientProps {
  movie: Movie;
  related: Movie[];
  /** Whole catalog, for the global search overlay. */
  allMovies: Movie[];
  brand: Brand;
  footer: FooterContent;
  labels: DetailLabels;
  popoverLabels: PopoverLabels;
}

/* ------------------------------------------------------------- styling -- */

/* Page-wide tokens: the shell width, the gutter, and the rhythm unit. */
const PAGE =
  "relative flex w-full min-h-dvh flex-1 flex-col bg-black font-body text-ink antialiased [--gutter:clamp(1.25rem,5vw,4rem)] [--shell-max:1240px] [--step:clamp(3.5rem,7.5vw,6.5rem)]";
const SHELL = "mx-auto w-full max-w-(--shell-max) px-(--gutter)";
const FOCUS_RING = "focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-ink";

/* How far a finger has to travel, in one unbroken drag, before the page is
   handed back while the theatre is open. Short enough that a real attempt to
   leave always works first time; long enough that the small movements a hand
   makes while holding a phone never do. */
const DRAG_RELEASE_PX = 80;

/* Rotation is only offered where it can be honoured: something to call lock()
   on, and a screen for which sideways means anything. Android has both; iOS
   Safari has no lock, so the control never appears there. */
const COARSE_QUERY = "(pointer: coarse)";

/** The lock half of the Screen Orientation API, which the DOM lib omits. */
type LockableOrientation = ScreenOrientation & {
  lock?: (orientation: string) => Promise<void>;
  unlock?: () => void;
};

function subscribeToPointerKind(onChange: () => void) {
  if (typeof window === "undefined") return () => undefined;
  const query = window.matchMedia(COARSE_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function readCanRotate() {
  const orientation = window.screen?.orientation as LockableOrientation | undefined;
  return typeof orientation?.lock === "function" && window.matchMedia(COARSE_QUERY).matches;
}

/* The action pair: see the slant utilities in globals.css.

   The pair only reads as one unit split by a single diagonal while the two
   buttons sit side by side — stacked, the lead's right-hand cut and the
   trail's left-hand cut face nothing and each button is just a lone
   parallelogram. So rather than going full-width on a narrow screen, the pair
   shrinks enough to stay on one line: at these metrics it measures ~248px,
   which clears the 280px a 320px viewport leaves inside the gutter. */
const ACTION =
  "[--btn-h:3.25rem] [--slant:calc(var(--btn-h)/3)] inline-flex h-(--btn-h) cursor-pointer items-center justify-center gap-[0.7rem] rounded-none border-0 text-[0.78rem] font-semibold tracking-[0.16em] uppercase transition-[background-color,border-color,color] duration-300 ease-[ease] max-[480px]:[--btn-h:2.75rem] max-[480px]:gap-2 max-[480px]:text-[0.7rem] max-[480px]:tracking-[0.12em] motion-reduce:transition-none " +
  FOCUS_RING;

/* Everything inside the theatre frame reveals on the frame's hover or focus,
   and stays revealed on coarse pointers, which never hover. */
const REVEAL = "group-hover/frame:opacity-100 group-focus-within/frame:opacity-100 [@media(hover:none)]:opacity-100";

const CONTROL =
  "inline-grid aspect-square flex-none cursor-pointer place-items-center rounded-[50%] border backdrop-blur-[12px] transition-[background,border-color,color,transform] duration-200 ease-[ease] hover:[transform:scale(1.12)] active:[transform:scale(0.95)] motion-reduce:transition-none " +
  FOCUS_RING;
const CONTROL_NEUTRAL =
  "border-[rgba(250,250,250,0.32)] bg-[rgba(0,0,0,0.42)] text-ink hover:border-[rgba(250,250,250,0.72)] hover:bg-[rgba(250,250,250,0.15)] hover:text-white";
const CONTROL_SKIP =
  "w-[clamp(3.8rem,6.5vw,4.8rem)] max-[560px]:w-[3.05rem] [&_svg]:h-[62%] [&_svg]:w-[62%] [&_svg]:overflow-visible [&_text]:fill-current [&_text]:font-body [&_text]:[font-size:7.6px] [&_text]:font-bold [&_text]:tracking-[-0.02em]";
const CONTROL_PRIMARY =
  "w-[clamp(4.15rem,7vw,5rem)] border-[rgba(255,48,64,0.65)] bg-[#ff3040] text-white shadow-[0_10px_28px_rgba(255,48,64,0.34)] hover:border-[rgba(255,255,255,0.8)] hover:bg-[#ff4f5f] max-[560px]:w-[3.3rem] [&_svg]:h-[46%] [&_svg]:w-[46%] [&_svg]:overflow-visible";
const CONTROL_FULLSCREEN = "w-[clamp(2.55rem,4vw,3rem)] [&_svg]:h-[56%] [&_svg]:w-[56%] [&_svg]:overflow-visible";

const SKIP_FEEDBACK =
  "pointer-events-none absolute top-1/2 z-[4] grid aspect-square w-[clamp(5rem,9vw,7rem)] animate-skip-flash place-items-center rounded-[50%] border border-[rgba(255,48,64,0.45)] bg-[rgba(0,0,0,0.58)] font-heading text-[clamp(1.3rem,2.5vw,2rem)] font-medium text-[#ff3040] [text-shadow:0_0_20px_rgba(255,48,64,0.45)] motion-reduce:animate-none motion-reduce:opacity-100";

/* ----------------------------------------------------------- component -- */

export default function DetailClient({
  movie,
  related,
  allMovies,
  brand,
  footer,
  labels,
  popoverLabels,
}: DetailClientProps) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Play expands the still into a full-height theatre and brings it to the top
  // of the viewport, so the screen is what you are looking at rather than
  // something below the fold.
  const [playing, setPlaying] = useState(false);
  const [playerPaused, setPlayerPaused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  // Whether we have asked the device to hold the screen sideways. Only
  // meaningful where the Screen Orientation API can lock, which in practice
  // means Android; iOS Safari has no lock, so the control hides there.
  const [isLandscape, setIsLandscape] = useState(false);
  // A device capability is something outside React to subscribe to, not state
  // to set from an effect. The server snapshot is false, so the control is
  // absent until the client has looked.
  const canRotate = useSyncExternalStore(subscribeToPointerKind, readCanRotate, () => false);
  const [skipPulse, setSkipPulse] = useState<"backward" | "forward" | null>(null);
  const [playerProgress, setPlayerProgress] = useState(38);
  const plateRef = useRef<HTMLDivElement | null>(null);
  const skipPulseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // A title opens at its title, not part way down it.
  //
  // next/link keeps the scroll position when the incoming page is already
  // visible in the viewport — documented behaviour, not a bug — and this
  // page's root spans the whole document, so it always counts as visible and
  // the scroll is never reset. Arriving from a scrolled catalog therefore
  // dropped you into the middle of a title you had not seen the top of.
  // Keyed on the id so stepping between related titles resets too.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [movie.id]);

  // Scrolling belongs in an effect, not the click handler: at click time the
  // frame is still at its poster height, so it would scroll to the wrong place.
  useEffect(() => {
    if (!playing) return;
    plateRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [playing]);

  // On a touch screen the page holds still while the theatre is open, so a
  // stray finger cannot slide the video off the top mid-scene. It is a soft
  // hold rather than a trap: a deliberate drag past DRAG_RELEASE_PX reads as
  // "I do want to leave", and the page is handed back for the rest of the
  // session. Closing the player arms it again.
  //
  // The lock is overflow, not preventDefault on touchmove: a prevented first
  // touchmove cancels panning for that whole gesture in Chrome, so there
  // would be no way to let go part-way through one. Touch events still fire
  // against a non-scrolling body, which is what measures the drag.
  useEffect(() => {
    if (!playing) return;
    if (!window.matchMedia("(pointer: coarse)").matches) return;

    const previousOverflow = document.body.style.overflow;
    let locked = false;
    let released = false;
    let startY = 0;

    const unlock = () => {
      if (!locked) return;
      document.body.style.overflow = previousOverflow;
      locked = false;
    };

    // startPlayer scrolls the theatre to the top of the viewport; locking
    // before that lands would leave it half way up the screen.
    const lockTimer = setTimeout(() => {
      document.body.style.overflow = "hidden";
      locked = true;
    }, 600);

    const onTouchStart = (event: TouchEvent) => {
      startY = event.touches[0]?.clientY ?? 0;
    };
    const onTouchMove = (event: TouchEvent) => {
      if (released) return;
      const y = event.touches[0]?.clientY ?? 0;
      if (Math.abs(y - startY) < DRAG_RELEASE_PX) return;
      released = true;
      unlock();
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });

    return () => {
      clearTimeout(lockTimer);
      unlock();
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, [playing]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const open = document.fullscreenElement === plateRef.current;
      setIsFullscreen(open);
      // Leaving fullscreen releases the lock with it, so the button must not
      // keep claiming the screen is held sideways.
      if (!open) setIsLandscape(false);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (skipPulseTimeoutRef.current) clearTimeout(skipPulseTimeoutRef.current);
    };
  }, []);

  // --- related grid state ---
  const [bookmarked, setBookmarked] = useState<{ [key: string]: boolean }>({});
  const popover = useTitlePopover();

  const toggleBookmark = (movieId: string) => {
    if (!isDemoSignedIn()) {
      router.push(getSignupHref());
      return;
    }

    setBookmarked((prev) => ({ ...prev, [movieId]: !prev[movieId] }));
  };

  const requireAuth = (action: () => void, returnTo?: string) => {
    if (isDemoSignedIn()) {
      action();
      return;
    }

    router.push(getSignupHref(returnTo));
  };

  const startPlayer = () => {
    setPlayerPaused(false);
    setPlaying(true);
  };

  const toggleCurrentSaved = () => {
    requireAuth(() => setSaved((value) => !value));
  };

  const closePlayer = () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined);
    }
    setPlayerPaused(false);
    setPlaying(false);
  };

  const flashSkip = (direction: "backward" | "forward") => {
    if (skipPulseTimeoutRef.current) clearTimeout(skipPulseTimeoutRef.current);
    setPlayerProgress((value) => {
      const nextValue = direction === "forward" ? value + 10 : value - 10;
      return Math.min(100, Math.max(0, nextValue));
    });
    setSkipPulse(direction);
    skipPulseTimeoutRef.current = setTimeout(() => {
      setSkipPulse(null);
    }, 620);
  };

  const toggleFullscreen = () => {
    const frame = plateRef.current;
    if (!frame) return;

    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined);
      return;
    }

    void frame.requestFullscreen().catch(() => undefined);
  };

  // Turning the phone sideways is a fullscreen affair: the orientation lock
  // is only granted to a fullscreen element, so this enters fullscreen first
  // and then asks for landscape. Going back releases both.
  const toggleOrientation = async () => {
    const frame = plateRef.current;
    const orientation = window.screen?.orientation as LockableOrientation | undefined;
    if (!frame || typeof orientation?.lock !== "function") return;

    if (isLandscape) {
      orientation.unlock?.();
      setIsLandscape(false);
      if (document.fullscreenElement) await document.exitFullscreen().catch(() => undefined);
      return;
    }

    if (!document.fullscreenElement) {
      await frame.requestFullscreen().catch(() => undefined);
    }
    // A refused lock leaves the video fullscreen and upright, which is still a
    // better place to watch from than where it started.
    await orientation.lock("landscape").then(
      () => setIsLandscape(true),
      () => setIsLandscape(false),
    );
  };

  // `||`, not `??`, throughout: the store's validator accepts "" as well as
  // null for the nullable fields, and an empty string would slip past `??` —
  // printing a blank meta cell, or a broken image for an empty src.
  const kind = movie.type || labels.typeFallback;
  const plateSrc = movie.trailerUrl || movie.backdrop;

  // Built as a list so a blank field drops out entirely rather than leaving a
  // hairline divider with nothing beside it.
  const meta: { key: string; text: string; accent?: boolean }[] = [
    { key: "year", text: movie.year },
    // The one place the accent is allowed to appear.
    { key: "rating", text: movie.rating, accent: true },
    { key: "duration", text: movie.duration },
    { key: "type", text: kind },
    { key: "quality", text: labels.qualityBadge },
  ].filter((item) => item.text.trim().length > 0);
  const playerProgressStyle = {
    "--player-progress": `${playerProgress}%`,
  } as React.CSSProperties;

  return (
    // Relative on purpose: the hover popover is positioned in document
    // coordinates and resolves against this element, which starts at 0,0 and
    // carries no padding.
    <div className={PAGE}>
      <header
        className={cx(
          SHELL,
          "grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-6 pt-[clamp(1.25rem,2vw,1.75rem)] pb-[clamp(1.25rem,2.4vw,2rem)] max-[760px]:pb-[clamp(2rem,8vw,3rem)]",
        )}
      >
        {/* A <button> rather than a link, because it calls router.back(). Two
            tracked-out words; wrapping them would read as a mistake. */}
        <button
          type="button"
          className={cx(
            "group/back inline-flex cursor-pointer items-center gap-3 border-0 bg-transparent p-0 text-[0.7rem] font-medium tracking-[0.22em] whitespace-nowrap text-[#8a8a8a] uppercase transition-[color] duration-300 ease-[ease] hover:text-ink pointer-coarse:min-h-11 pointer-coarse:min-w-11 motion-reduce:transition-none",
            FOCUS_RING,
          )}
          // The label is hidden below 768px, and display:none takes it out
          // of the accessibility tree with it — so the name lives here.
          aria-label={labels.goBack}
          onClick={() => router.back()}
        >
          <svg
            className="h-3 w-[18px] flex-none transition-[transform] duration-[0.35s] ease-[cubic-bezier(0.2,0.7,0.2,1)] group-hover/back:[transform:translateX(-4px)] motion-reduce:transition-none"
            viewBox="0 0 18 12"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="M6.2 1 1 6l5.2 5M1 6h17"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {/* Arrow only on a phone: the words cost width the lockup and the
              two icons need in the same row. */}
          <span className="max-[768px]:hidden">{labels.goBack}</span>
        </button>

        {/* On entry the lockup glides in from the left. Animated on the two
            images rather than the link, because an animation's final opacity
            outranks a normal declaration and would kill the hover fade on the
            parent. The wordmark trails the mark by a beat. */}
        <Link
          href={brand.homeHref}
          className={cx(
            "inline-flex flex-none items-center gap-[0.55rem] justify-self-center transition-[opacity] duration-300 ease-[ease] hover:opacity-70 pointer-coarse:min-h-11 motion-reduce:transition-none",
            FOCUS_RING,
          )}
        >
          <img className="block h-[clamp(17px,2.1vw,21px)] w-auto animate-lockup-glide-in motion-reduce:animate-none" src={brand.mark} alt="" />
          <img
            className="block h-[clamp(11px,1.5vw,14px)] w-auto animate-lockup-glide-in [animation-delay:0.09s] motion-reduce:animate-none"
            src={brand.wordmark}
            alt={brand.wordmarkAlt}
          />
        </Link>

        {/* Plain icon buttons, borderless — matches the Premium Minimal chrome. */}
        <div className="inline-flex items-center gap-[0.85rem] justify-self-end">
          <button
            type="button"
            className="inline-flex size-[2.35rem] flex-none cursor-pointer items-center justify-center rounded-[999px] border-0 bg-transparent p-0 text-[#8a8a8a] no-underline transition-[color] duration-300 ease-[ease] hover:text-ink"
            aria-label={labels.search}
            onClick={() => setSearchOpen(true)}
          >
            <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>

          <ProfileMenu ariaLabel={labels.profile} variant="minimal" />
        </div>
      </header>

      <main className="flex-1 pb-[clamp(6rem,10vw,10rem)]">
        {/* Compact info block above a full-bleed still: roughly 30/70 of the
            opening screen, so the artwork stays the dominant element. */}
        <section className={cx(SHELL, "pb-[clamp(0.9rem,1.6vw,1.35rem)]")}>
          {/* `balance` still will not break a single long word; on a 320px
              screen the display size is 34px, wide enough to run off the edge. */}
          <h1 className="mt-[clamp(1.35rem,2.1vw,1.7rem)] font-heading text-[clamp(2.2rem,4.2vw,3.4rem)] leading-[1.02] font-light tracking-[-0.03em] break-words text-balance max-[760px]:tracking-[-0.018em]">
            {movie.title}
          </h1>
          {movie.subtitle && (
            <p className="mt-[clamp(0.7rem,1vw,0.9rem)] font-heading text-[clamp(0.78rem,1.15vw,0.98rem)] font-normal tracking-[0.3em] text-[#8a8a8a] uppercase max-[430px]:tracking-[0.24em]">
              {movie.subtitle}
            </p>
          )}

          {/* Hairlines hang off the left edge of every item but the first,
              which breaks the moment the rail wraps; below 560px it always
              does, so they give way to plain spacing. */}
          {meta.length > 0 && (
            <ul className="mt-[clamp(1rem,1.55vw,1.28rem)] flex list-none flex-wrap items-center gap-x-0 gap-y-2 text-[0.84rem] tracking-[0.06em] text-[#8a8a8a] tabular-nums max-[560px]:gap-x-[1.15rem]">
              {meta.map((item) => (
                <li
                  key={item.key}
                  className="not-first:ml-[clamp(0.85rem,1.8vw,1.5rem)] not-first:border-l not-first:border-[rgba(250,250,250,0.11)] not-first:pl-[clamp(0.85rem,1.8vw,1.5rem)] max-[560px]:not-first:ml-0 max-[560px]:not-first:border-l-0 max-[560px]:not-first:pl-0"
                >
                  {item.accent ? <span className="text-[#ff3040]">{item.text}</span> : item.text}
                </li>
              ))}
            </ul>
          )}

          {/* Three lines: enough to read the premise while keeping the block
              inside its share of the opening screen. Full text stays in the
              DOM, so screen readers and SEO are unaffected. */}
          <p className="mt-[clamp(1.05rem,1.7vw,1.35rem)] line-clamp-3 max-w-[78ch] font-[family-name:'Segoe_UI',Roboto,-apple-system,BlinkMacSystemFont,sans-serif] text-[clamp(1rem,1.12vw,1.1rem)] leading-[1.78] font-medium tracking-[0] text-[#c7c7bd]">
            {movie.description}
          </p>

          <div className="mt-[clamp(1.18rem,1.9vw,1.58rem)] flex flex-nowrap gap-0 [--edge-gap:10px]">
            <button
              type="button"
              className={cx(ACTION, "[--pad:clamp(2.5rem,4.4vw,3.6rem)] max-[480px]:[--pad:2.1rem] bg-ink pr-[calc(var(--pad)+var(--slant))] pl-(--pad) text-black slant-lead hover:bg-[#e8e8cd]")}
              onClick={startPlayer}
            >
              <svg
                className="h-3 w-[10px] flex-none"
                viewBox="0 0 12 14"
                aria-hidden="true"
                focusable="false"
              >
                <path d="M0 0v14l12-7z" fill="currentColor" />
              </svg>
              <span>{labels.play}</span>
            </button>

            {/* The hairline outline is a clipped layer rather than a border,
                because clip-path shears a real border off along the cut edge:
                the element is the outline colour and ::before insets by 1px in
                the page colour. Saved reads as engaged, not disabled: a quiet
                fill, label at full strength. */}
            <button
              type="button"
              className={cx(
                ACTION,
                "[--pad:clamp(1.05rem,1.8vw,1.5rem)] max-[480px]:[--pad:0.7rem] relative isolate ml-[calc(var(--edge-gap)-var(--slant))] bg-[rgba(250,250,250,0.28)] pr-(--pad) pl-[calc(var(--pad)+var(--slant))] text-ink slant-trail before:absolute before:inset-px before:z-[-1] before:content-[''] before:[clip-path:polygon(0_0,100%_0,100%_100%,var(--slant)_100%)] hover:bg-ink",
                saved ? "before:bg-[#1a1a19] hover:before:bg-[#232322]" : "before:bg-black",
              )}
              aria-pressed={saved}
              onClick={toggleCurrentSaved}
            >
              {/* Wrapped so the button's counter-skew rule can reach the label —
                  a bare text node would stay sheared with the button. */}
              <span>{saved ? labels.inWatchlist : labels.watchlist}</span>
            </button>
          </div>
        </section>

        {/* Full-bleed and deliberately huge — the page's centrepiece. The 70vh
            floor holds it near two-thirds of the opening screen even on short,
            wide windows where 21:9 alone would compute much shorter. Playing,
            the frame drops its poster proportions and becomes a theatre. */}
        <figure className="w-full min-w-0">
          <div
            ref={plateRef}
            className={cx(
              "group/frame relative w-full overflow-hidden transition-[height] duration-[0.45s] ease-[cubic-bezier(0.2,0.7,0.2,1)]",
              playing
                ? "h-[92vh] max-h-none min-h-0 cursor-default bg-black aspect-auto"
                : // The fade-to-page gradient belongs to the poster state, not the theatre.
                  "max-h-[88vh] min-h-[68vh] bg-[#101010] aspect-[21/9] after:pointer-events-none after:absolute after:inset-0 after:bg-[image:linear-gradient(to_bottom,rgba(0,0,0,0.4)_0%,rgba(0,0,0,0)_30%,rgba(0,0,0,0)_58%,#000000_100%)] after:content-[''] max-[899px]:max-h-none max-[899px]:min-h-0 max-[899px]:aspect-[16/10] max-[760px]:aspect-[4/3]",
            )}
          >
            {/* contain, not cover, while playing: a film frame must never be cropped. */}
            <img
              className={playing ? "block h-full w-full bg-black object-contain" : "block h-full w-full object-cover object-[center_40%]"}
              src={plateSrc}
              alt={movie.title}
            />

            {playing ? (
              <>
                <button
                  type="button"
                  className={cx(
                    "absolute top-[clamp(0.75rem,1.6vw,1.25rem)] right-[clamp(0.75rem,1.6vw,1.25rem)] z-[5] inline-flex h-10 cursor-pointer items-center gap-[0.55rem] border-0 bg-[rgba(0,0,0,0.62)] pr-4 pl-[0.85rem] text-[0.7rem] font-semibold tracking-[0.14em] text-[#ff3040] uppercase backdrop-blur-[10px] transition-[background,color,transform] duration-250 ease-[ease] hover:bg-[rgba(0,0,0,0.85)] hover:text-[#ff4f5f] hover:[transform:translateY(-1px)] motion-reduce:transition-none",
                    FOCUS_RING,
                  )}
                  onClick={closePlayer}
                >
                  <svg
                    className="h-[11px] w-[11px] flex-none"
                    viewBox="0 0 12 12"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path
                      d="M1 1l10 10M11 1L1 11"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span>Close</span>
                </button>

                <div
                  className={cx(
                    "pointer-events-none absolute inset-0 z-[3] opacity-0 transition-opacity duration-[0.28s] ease-[ease] before:pointer-events-none before:absolute before:inset-0 before:bg-[image:linear-gradient(to_bottom,rgba(0,0,0,0.78),rgba(0,0,0,0)_33%),linear-gradient(to_top,rgba(0,0,0,0.88),rgba(0,0,0,0)_45%)] before:content-[''] motion-reduce:transition-none",
                    REVEAL,
                  )}
                >
                  <div
                    className={cx(
                      "absolute top-0 left-0 z-[1] px-[clamp(1rem,3vw,2.5rem)] py-[clamp(1rem,2.4vw,1.7rem)] opacity-0 [transition:opacity_0.3s_ease,transform_0.35s_cubic-bezier(0.2,0.7,0.2,1)] [transform:translateY(-34px)] group-hover/frame:[transform:translateY(0)] group-focus-within/frame:[transform:translateY(0)] [@media(hover:none)]:[transform:none] max-[560px]:right-[5.75rem] max-[560px]:px-4 max-[560px]:py-[0.9rem] motion-reduce:transition-none right-[clamp(8.8rem,12vw,10rem)]",
                      REVEAL,
                    )}
                  >
                    <h2 className="m-0 font-heading text-[clamp(1.35rem,3vw,2.4rem)] leading-[1.05] font-normal tracking-[-0.018em] break-words text-balance text-ink [text-shadow:0_8px_28px_rgba(0,0,0,0.78)]">
                      {movie.title}
                    </h2>
                  </div>

                  <div
                    className={cx(
                      "pointer-events-none absolute top-1/2 left-1/2 z-[1] flex items-center justify-center gap-[clamp(1rem,2.5vw,1.75rem)] opacity-0 [transition:opacity_0.24s_ease,transform_0.32s_cubic-bezier(0.2,0.7,0.2,1)] [transform:translate(-50%,-44%)_scale(0.96)] group-hover/frame:pointer-events-auto group-hover/frame:[transform:translate(-50%,-50%)_scale(1)] group-focus-within/frame:pointer-events-auto group-focus-within/frame:[transform:translate(-50%,-50%)_scale(1)] [@media(hover:none)]:pointer-events-auto [@media(hover:none)]:[transform:translate(-50%,-50%)_scale(1)] max-[560px]:gap-[0.7rem] motion-reduce:transition-none",
                      REVEAL,
                    )}
                  >
                    <button
                      type="button"
                      className={cx(CONTROL, CONTROL_NEUTRAL, CONTROL_SKIP)}
                      aria-label="Rewind 10 seconds"
                      onClick={() => flashSkip("backward")}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path
                          d="M15.6 6.3A8 8 0 1 1 10.1 5.2"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.9"
                          strokeLinecap="round"
                        />
                        <path d="M10.5 2.5 6.3 5.5l4.2 3z" fill="currentColor" stroke="none" />
                        <text x="12" y="16" textAnchor="middle">
                          10
                        </text>
                      </svg>
                    </button>

                    <button
                      type="button"
                      className={cx(CONTROL, CONTROL_PRIMARY)}
                      aria-label={playerPaused ? "Play movie" : "Pause movie"}
                      aria-pressed={!playerPaused}
                      onClick={() => setPlayerPaused((value) => !value)}
                    >
                      {playerPaused ? (
                        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                          <path d="M8 5v14l11-7z" fill="currentColor" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                          <path d="M8 5h3v14H8zM13 5h3v14h-3z" fill="currentColor" />
                        </svg>
                      )}
                    </button>

                    <button
                      type="button"
                      className={cx(CONTROL, CONTROL_NEUTRAL, CONTROL_SKIP)}
                      aria-label="Forward 10 seconds"
                      onClick={() => flashSkip("forward")}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path
                          d="M8.4 6.3A8 8 0 1 0 13.9 5.2"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.9"
                          strokeLinecap="round"
                        />
                        <path d="M13.5 2.5 17.7 5.5l-4.2 3z" fill="currentColor" stroke="none" />
                        <text x="12" y="16" textAnchor="middle">
                          10
                        </text>
                      </svg>
                    </button>
                  </div>

                  <div
                    className={cx(
                      "pointer-events-none absolute right-0 bottom-0 left-0 z-[1] px-[clamp(1rem,3vw,2.5rem)] py-[clamp(1rem,2.2vw,1.7rem)] opacity-0 [transition:opacity_0.25s_ease,transform_0.35s_cubic-bezier(0.2,0.7,0.2,1)] [transform:translateY(28px)] group-hover/frame:pointer-events-auto group-hover/frame:[transform:translateY(0)] group-focus-within/frame:pointer-events-auto group-focus-within/frame:[transform:translateY(0)] [@media(hover:none)]:pointer-events-auto [@media(hover:none)]:[transform:none] max-[560px]:px-4 max-[560px]:py-[0.9rem] motion-reduce:transition-none",
                      REVEAL,
                    )}
                  >
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={playerProgress}
                      className="player-range"
                      style={playerProgressStyle}
                      aria-label="Movie progress"
                      onChange={(event) => setPlayerProgress(Number(event.currentTarget.value))}
                    />

                    <div className="flex items-center justify-end gap-[clamp(0.5rem,1.2vw,0.85rem)]">
                      {canRotate && (
                        <button
                          type="button"
                          className={cx(CONTROL, CONTROL_NEUTRAL, CONTROL_FULLSCREEN)}
                          aria-label={isLandscape ? "Back to portrait" : "Watch in landscape"}
                          aria-pressed={isLandscape}
                          onClick={toggleOrientation}
                        >
                          {/* A phone turning: the handset outline sits upright
                              or on its side, with a curved arrow showing which
                              way the next press takes it. */}
                          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                            <rect
                              x={isLandscape ? "2.5" : "7.5"}
                              y={isLandscape ? "7.5" : "2.5"}
                              width={isLandscape ? "19" : "9"}
                              height={isLandscape ? "9" : "19"}
                              rx="1.8"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                            />
                            <path
                              d="M4.4 20.6a6.6 6.6 0 0 0 6 3.1"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                            />
                            <path
                              d="M2.2 18.2l2.4 2.6 2.9-1.9"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      )}

                      <button
                        type="button"
                        className={cx(CONTROL, CONTROL_NEUTRAL, CONTROL_FULLSCREEN)}
                        aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                        aria-pressed={isFullscreen}
                        onClick={toggleFullscreen}
                      >
                        {isFullscreen ? (
                          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                            <path
                              d="M9 4v5H4M4 9l6-6M15 20v-5h5M20 15l-6 6M20 9h-5V4M15 4l6 6M4 15h5v5M9 20l-6-6"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                            <path
                              d="M4 9V4h5M4 4l6 6M20 15v5h-5M20 20l-6-6M15 4h5v5M20 4l-6 6M9 20H4v-5M4 20l6-6"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {skipPulse && (
                  <div
                    className={cx(
                      SKIP_FEEDBACK,
                      skipPulse === "backward" ? "left-[28%] max-[560px]:left-[12%]" : "right-[28%] max-[560px]:right-[12%]",
                    )}
                    aria-hidden="true"
                  >
                    {skipPulse === "backward" ? "-10" : "+10"}
                  </div>
                )}

                {/* A quiet note rather than a blocking overlay: the screen still
                    shows the key art, so covering it would defeat the point. The
                    store carries no video file for a title yet — only key art. */}
                <p className="absolute bottom-[clamp(5.7rem,9vw,7rem)] left-1/2 z-[2] max-w-[calc(100%-2rem)] bg-[rgba(0,0,0,0.62)] px-4 py-[0.55rem] text-center text-[0.74rem] tracking-[0.06em] text-[#8a8a8a] backdrop-blur-[10px] [transform:translateX(-50%)] max-[560px]:bottom-[4.9rem] max-[560px]:text-[0.68rem]">
                  No video source attached to this title yet.
                </p>
              </>
            ) : (
              <button
                type="button"
                className={cx(
                  "absolute top-1/2 left-1/2 z-[1] grid aspect-square w-[clamp(58px,7vw,84px)] cursor-pointer place-items-center rounded-[50%] border border-[rgba(250,250,250,0.5)] bg-[rgba(0,0,0,0.15)] text-ink transition-[background-color,border-color] duration-[0.35s] ease-[ease] [transform:translate(-50%,-50%)] hover:border-ink hover:bg-[rgba(250,250,250,0.12)] motion-reduce:transition-none",
                  FOCUS_RING,
                )}
                aria-label={labels.trailerPlay}
                onClick={startPlayer}
              >
                <svg
                  className="ml-[0.2em] h-auto w-[clamp(11px,1.4vw,15px)]"
                  viewBox="0 0 12 14"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path d="M0 0v14l12-7z" fill="currentColor" />
                </svg>
              </button>
            )}
          </div>

          {/* The plate is full-bleed, so its caption re-applies the page shell
              to line up with the rest of the content. */}
          <figcaption className={SHELL}>
            <div className="mt-[clamp(0.9rem,1.4vw,1.2rem)] flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-t border-[rgba(250,250,250,0.11)] pt-[clamp(0.7rem,1.1vw,0.95rem)]">
              <span className="flex min-w-0 flex-col gap-[0.55rem]">
                <span className="text-[0.66rem] font-medium tracking-[0.28em] text-[#8a8a8a] uppercase">{labels.trailerHeading}</span>
                <span className="font-heading text-[clamp(0.95rem,1.4vw,1.15rem)] font-normal tracking-[0.01em]">
                  {movie.title} — {labels.trailerTitleSuffix}
                </span>
              </span>
              <span className="text-[0.72rem] tracking-[0.16em] text-[#8a8a8a] uppercase">{labels.trailerStudio}</span>
            </div>
          </figcaption>
        </figure>

        <div className={SHELL}>
          <section className="mt-(--step)">
            <div className="mb-[clamp(1.75rem,3.2vw,2.75rem)] flex items-center gap-[clamp(1.25rem,2.5vw,2rem)]">
              <h2 className="font-body text-[0.7rem] font-medium tracking-[0.28em] whitespace-nowrap text-[#8a8a8a] uppercase">{labels.relatedHeading}</h2>
              <span className="h-px flex-1 bg-[rgba(250,250,250,0.11)]" aria-hidden="true" />
            </div>

            {/* Fixed 190px tracks rather than fr-based columns: `1fr` stretched
                each card, so a related card came out larger than the same card
                on the catalog. Below 560px the cards fill the row instead, two
                up, so a fixed track cannot leave a lone column with a hole. */}
            {related.length > 0 ? (
              <ul className="grid list-none grid-cols-[repeat(auto-fill,190px)] [justify-content:start] gap-x-[10px] gap-y-[clamp(1.5rem,2.4vw,2rem)] max-[559px]:grid-cols-[repeat(auto-fill,minmax(140px,1fr))] max-[559px]:gap-y-6">
                {related.map((item) => (
                  <li key={item.id} className="min-w-0">
                    <PosterCard
                      movie={item}
                      saved={!!bookmarked[item.id]}
                      saveLabel={labels.saveToList}
                      onToggleSave={() => toggleBookmark(item.id)}
                      {...popover.cardProps(item)}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[0.95rem] leading-[1.7] text-[#8a8a8a]">Nothing else in this collection yet.</p>
            )}
          </section>
        </div>
      </main>

      <SiteFooter brand={brand} footer={footer} />

      <SearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        movies={allMovies}
        placeholder={`${labels.search} titles…`}
      />

      {popover.movie && popover.position && (
        <TitlePopover
          movie={popover.movie}
          position={popover.position}
          labels={popoverLabels}
          saved={!!bookmarked[popover.movie.id]}
          onToggleSave={() => toggleBookmark(popover.movie!.id)}
          onWatch={() => router.push(`/watch/${popover.movie!.id}`)}
          {...popover.popoverProps}
        />
      )}
    </div>
  );
}
