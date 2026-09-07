"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { cx } from "@/lib/cx";
import { getSignupHref, isDemoSignedIn } from "../_auth/demo-auth";
import ProfileMenu from "../_auth/ProfileMenu";
import type { Movie, Section } from "@/lib/content-types";
import type { Brand, FooterContent, PopoverLabels, WatchLabels } from "@/lib/site-types";
import PosterCard from "./PosterCard";
import SearchOverlay from "./SearchOverlay";
import SiteFooter from "./SiteFooter";
import TitlePopover, { useTitlePopover } from "./TitlePopover";

interface WatchClientProps {
  heroSlides: Movie[];
  sections: Section[];
  /** Whole catalog, for the global search overlay. */
  allMovies: Movie[];
  brand: Brand;
  footer: FooterContent;
  labels: WatchLabels;
  popoverLabels: PopoverLabels;
}

/* ------------------------------------------------------------- styling -- */

/* Frosted round icon buttons in the header. */
const ICON_BTN =
  "relative flex h-[42px] w-[42px] max-[768px]:h-9 max-[768px]:w-9 cursor-pointer items-center justify-center rounded-[50%] border bg-[rgba(255,255,255,0.06)] backdrop-blur-[10px] transition-[background,border-color] duration-250 ease-[ease] hover:border-[rgba(255,255,255,0.22)] hover:bg-[rgba(255,255,255,0.14)]";

/* The hero's still: idle waiting just off to the right, active in place, the
   one being replaced easing out to the left. The travel is deliberately small
   (3%) — at 40px+ it reads as a swipe; this should feel like the image is
   barely breathing. Transform runs longer than opacity so the outgoing slide
   is fully faded before it finishes travelling, which hides the reset back to
   the waiting position. Keep the transform duration in sync with
   SLIDE_EXIT_MS. With reduced motion it is a plain cross-fade. */
const SLIDE =
  "absolute inset-0 flex items-center [transition:opacity_1.1s_ease,transform_1.6s_cubic-bezier(0.22,1,0.36,1)] motion-reduce:[transform:none] motion-reduce:[transition:opacity_0.4s_ease]";
/* One class per property per state: two utilities for the same property on
   one element resolve by stylesheet order, not by which was written last. */
const SLIDE_STATE = {
  idle: "pointer-events-none opacity-0 [transform:translateX(3%)]",
  active: "pointer-events-auto opacity-100 [transform:translateX(0)]",
  leaving: "pointer-events-none opacity-0 [transform:translateX(-3%)]",
};

/* The action pair: see the slant utilities in globals.css. Watch Now's cut
   insets its TOP-right corner and Add List's its BOTTOM-left, so the two
   diagonals already sit a full slant apart with the boxes touching. Add List
   is pulled back by that slant, which makes --edge-gap the real, visible
   distance between the two edges; the clip keeps the overlap from taking
   clicks, so Watch Now stays clickable right up to its edge. */
const HERO_BTN =
  "[--btn-h:48px] [--slant:calc(var(--btn-h)/3)] flex h-(--btn-h) cursor-pointer items-center gap-[10px] rounded-none border-0 font-heading text-[0.9rem] font-bold tracking-[0.05em] whitespace-nowrap uppercase transition-[background,transform] duration-250 ease-[ease] hover:[transform:translateY(-2px)] max-[768px]:[--btn-h:42px] max-[768px]:gap-2 max-[768px]:text-[0.75rem]";

const WISHLIST_ICON_BTN =
  "grid cursor-pointer place-items-center border transition-[background,border-color,color] duration-200 ease-[ease]";

/* ----------------------------------------------------------- component -- */

export default function WatchClient({
  heroSlides,
  sections,
  allMovies,
  brand,
  footer,
  labels,
  popoverLabels,
}: WatchClientProps) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [bookmarked, setBookmarked] = useState<{ [key: string]: boolean }>({});
  const [searchOpen, setSearchOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const wishlistCount = Object.values(bookmarked).filter(Boolean).length;
  const savedMovies = allMovies.filter((movie) => bookmarked[movie.id]);

  const popover = useTitlePopover();
  const router = useRouter();

  const requireAuth = (action: () => void, returnTo?: string) => {
    if (isDemoSignedIn()) {
      action();
      return;
    }

    router.push(getSignupHref(returnTo));
  };

  /**
   * Move the outgoing slide off to the left while the incoming one settles in
   * from the right. Which slide is leaving can't be derived from activeSlide
   * alone, so it gets its own state, cleared once the exit has finished.
   *
   * Must match the transform duration in SLIDE, otherwise the class is
   * dropped mid-flight and the slide snaps back across the screen.
   */
  const SLIDE_EXIT_MS = 1600;

  const [leavingSlide, setLeavingSlide] = useState<number | null>(null);
  // Mirrors activeSlide so the interval can read the current index without
  // being re-created every time it changes (which would restart the timer).
  const activeSlideRef = useRef(0);
  const leaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerSlideChange = (newIndex: number) => {
    const current = activeSlideRef.current;
    if (newIndex === current) return;

    activeSlideRef.current = newIndex;
    setLeavingSlide(current);
    setActiveSlide(newIndex);

    // Once the exit finishes the slide returns to its waiting position on the
    // right. That reset is itself animated, but runs at opacity 0 so it is
    // never seen.
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    leaveTimerRef.current = setTimeout(() => setLeavingSlide(null), SLIDE_EXIT_MS);
  };

  // Auto-advance hero slides every 7 seconds.
  //
  // Skipped when there are no slides: heroSlideIds may resolve to nothing (the
  // store only requires it to be an array, and deleting the last hero title
  // empties it), and `% 0` is NaN — which would stick in activeSlide and leave
  // every slide inactive with no way back.
  useEffect(() => {
    if (heroSlides.length < 2) return;

    const timer = setInterval(() => {
      triggerSlideChange((activeSlideRef.current + 1) % heroSlides.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  // The exit timer outlives the slide change, so it has to be cancelled if the
  // page unmounts mid-transition.
  useEffect(() => () => {
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
  }, []);

  useEffect(() => {
    if (!wishlistOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setWishlistOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [wishlistOpen]);

  const toggleBookmark = (movieId: string) => {
    if (!isDemoSignedIn()) {
      router.push(getSignupHref());
      return;
    }

    setBookmarked((prev) => ({ ...prev, [movieId]: !prev[movieId] }));
  };

  // The copy layer renders the current slide directly rather than riding along
  // inside the mapped stills.
  const activeMovie = heroSlides[activeSlide] ?? null;
  const activeMovieSaved = !!(activeMovie && bookmarked[activeMovie.id]);

  const scrollRow = (e: React.MouseEvent<HTMLButtonElement>, direction: number) => {
    const section = (e.currentTarget as HTMLElement).closest("section");
    const row = section?.querySelector<HTMLElement>("[data-poster-row]");
    if (row) row.scrollBy({ left: direction * row.clientWidth * 0.85, behavior: "smooth" });
  };

  return (
    // Relative on purpose: the hover popover is positioned in document
    // coordinates and resolves against this element.
    <div className="relative min-h-screen w-full overflow-x-hidden bg-black font-body text-ink">
      {/* Full-bleed bar so the gradient spans the viewport; the contents are
          constrained to the same 1480px/48px box as the catalog below, so the
          logo starts on the poster rows' left edge. */}
      <header className="absolute top-0 right-0 left-0 z-[100] bg-[image:linear-gradient(to_bottom,rgba(0,0,0,0.85)_0%,rgba(0,0,0,0)_100%)] py-[22px] max-[768px]:py-[14px]">
        <div className="mx-auto flex max-w-[1480px] items-center justify-between px-12 max-[768px]:px-5">
          {/* Mark runs slightly taller than the wordmark's cap height so the
              lockup reads as one unit rather than two same-size blocks. */}
          <Link
            href={brand.homeHref}
            // shrink-0: preflight lets images shrink to fit, which would squash
            // the wordmark on a narrow header instead of letting it overflow.
            className="flex shrink-0 items-center gap-[10px] font-heading text-[1.7rem] font-extrabold tracking-[-0.03em] no-underline transition-[opacity] duration-250 ease-[ease] select-none hover:opacity-85 max-[768px]:gap-[7px] max-[768px]:text-[1.15rem]"
          >
            {/* Decorative: the wordmark beside it carries the accessible name. */}
            <img src={brand.mark} alt="" className="block h-[26px] w-auto max-[768px]:h-5" />
            <img src={brand.wordmark} alt={brand.wordmarkAlt} className="block h-5 w-auto max-[768px]:h-[15px]" />
          </Link>

          <div className="flex items-center gap-[14px] max-[768px]:gap-2">
            <button
              type="button"
              className={cx(ICON_BTN, "border-[rgba(255,255,255,0.1)] text-ink")}
              aria-label={labels.search}
              onClick={() => setSearchOpen(true)}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>

            <button
              type="button"
              className={cx(
                ICON_BTN,
                wishlistCount > 0
                  ? "border-[rgba(245,197,24,0.36)] text-[#f5c518]"
                  : "border-[rgba(255,255,255,0.1)] text-ink",
              )}
              aria-label={wishlistCount > 0 ? `Saved to watch later, ${wishlistCount} saved` : "Saved to watch later"}
              aria-expanded={wishlistOpen}
              onClick={() => requireAuth(() => setWishlistOpen(true))}
              title="Saved to watch later"
            >
              {wishlistCount > 0 && (
                <span className="absolute top-[-3px] right-[-3px] grid h-[18px] min-w-[18px] place-items-center rounded-[999px] border-2 border-black bg-[#ff2e3d] px-[5px] text-[0.6rem] leading-none font-extrabold text-white tabular-nums">
                  {wishlistCount}
                </span>
              )}
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            </button>

            <ProfileMenu ariaLabel={labels.profile} variant="glass" />
          </div>
        </div>
      </header>

      {/* Full-bleed hero: copy bottom-left over a top-anchored still. Only the
          stills cross-fade and drift; the copy and the buttons are a separate
          layer that never travels with them. */}
      <section className="relative flex h-[75vh] w-full items-end overflow-hidden bg-black max-[768px]:h-[62vh] max-[768px]:min-h-[440px]">
        {heroSlides.map((slide, index) => {
          const state = index === activeSlide ? "active" : index === leavingSlide ? "leaving" : "idle";
          return (
            <div key={slide.id} aria-hidden={state !== "active"} className={cx(SLIDE, SLIDE_STATE[state])}>
              {/* object-top keeps the crop anchored to the top of the artwork,
                  so faces and titles near the top survive the 75vh crop. */}
              <img src={slide.image} alt={slide.title} className="absolute inset-0 z-[1] h-full w-full object-cover object-top" />
              {/* A readability scrim over the copy on the left that thins out
                  rather than going opaque, plus a bottom fade so the hero melts
                  into the catalog instead of ending on a hard edge. */}
              <div className="pointer-events-none absolute inset-0 z-[2] bg-[image:linear-gradient(to_right,#000000_0%,rgba(0,0,0,0.9)_24%,rgba(0,0,0,0.58)_48%,rgba(0,0,0,0.22)_72%,rgba(0,0,0,0.05)_100%),linear-gradient(to_top,#000000_0%,rgba(0,0,0,0.5)_14%,transparent_34%),linear-gradient(to_bottom,rgba(0,0,0,0.7)_0%,transparent_18%)] max-[768px]:bg-[image:linear-gradient(to_top,#000000_0%,rgba(0,0,0,0.82)_30%,rgba(0,0,0,0.35)_58%,transparent_82%),linear-gradient(to_bottom,rgba(0,0,0,0.75)_0%,transparent_22%)]" />
            </div>
          );
        })}

        {/* Same 1480/48 box as the header and the catalog, so the hero copy
            starts on the logo's and the poster rows' left edge; lifted 96px
            off the hero's bottom edge. */}
        {activeMovie && (
          <div className="relative z-[10] mx-auto w-full max-w-[1480px] px-12 pb-24 max-[900px]:px-[5vw] max-[768px]:px-5 max-[768px]:pb-10">
            <div className="w-full max-w-[620px] max-[900px]:max-w-none">
              {/* Keyed on the slide so the words are replaced outright rather
                  than tweened across. */}
              <div key={activeMovie.id} className="animate-hero-copy-swap motion-reduce:animate-none">
                <span className="mb-3 block font-body text-[0.85rem] font-medium tracking-[0.04em] text-[#9ca3af] max-[768px]:mb-1.5 max-[768px]:text-[0.78rem]">
                  {labels.heroDurationPrefix} {activeMovie.duration}
                </span>
                <h1 className="m-0 mb-4 font-heading text-[clamp(2rem,3.6vw,3.4rem)] leading-[1.08] font-extrabold tracking-[-0.02em] whitespace-nowrap text-ink uppercase max-[768px]:mb-2.5 max-[768px]:text-[clamp(1.5rem,7vw,2rem)] max-[768px]:whitespace-normal">
                  {activeMovie.title}
                </h1>
                <p className="mb-[30px] line-clamp-3 max-w-[560px] font-body text-[1rem] leading-[1.65] font-normal text-[rgba(235,237,240,0.8)] max-[768px]:mb-5 max-[768px]:line-clamp-2 max-[768px]:text-[0.9rem] max-[768px]:leading-[1.55]">
                  {activeMovie.description}
                </p>
              </div>

              {/* Outside the keyed block on purpose: the pair stays put across
                  slide changes, so it never re-animates. */}
              <div className="flex flex-nowrap items-center gap-0 [--edge-gap:10px]">
                <button
                  type="button"
                  className={cx(HERO_BTN, "bg-[#ff2e3d] pr-[calc(30px+var(--slant))] pl-[30px] text-ink slant-lead hover:bg-[#ff4552] max-[768px]:pr-[calc(18px+var(--slant))] max-[768px]:pl-[18px]")}
                  onClick={() => router.push(`/watch/${activeMovie.id}`)}
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <span>{labels.heroWatchNow}</span>
                </button>

                {/* Borderless: clip-path would shear a border off along the cut
                    edge. The glass fill carries the shape instead. */}
                <button
                  type="button"
                  className={cx(
                    HERO_BTN,
                    "ml-[calc(var(--edge-gap)-var(--slant))] pr-[30px] pl-[calc(30px+var(--slant))] backdrop-blur-[10px] slant-trail hover:bg-[rgba(255,255,255,0.22)] max-[768px]:pr-[18px] max-[768px]:pl-[calc(18px+var(--slant))]",
                    activeMovieSaved ? "bg-[rgba(74,222,128,0.18)] text-[#4ade80]" : "bg-[rgba(255,255,255,0.14)] text-ink",
                  )}
                  onClick={() => toggleBookmark(activeMovie.id)}
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    {activeMovieSaved ? (
                      <polyline points="20 6 9 17 4 12" />
                    ) : (
                      <>
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </>
                    )}
                  </svg>
                  <span>{activeMovieSaved ? labels.heroAdded : labels.heroAddList}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Catalog rows */}
      <main className="mx-auto max-w-[1480px] px-12 pt-16 pb-40 max-[768px]:px-5 max-[768px]:pt-12 max-[768px]:pb-[120px]">
        {sections.map((section) => (
          <section key={section.id} id={section.id} className="mb-9">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2
                  className="font-heading text-[1.4rem] font-extrabold tracking-[-0.01em] text-ink max-[768px]:text-[1.3rem]"
                  style={{ color: section.accent }}
                >
                  {section.title}
                </h2>
                <span className="h-[18px] w-px bg-[rgba(255,255,255,0.22)]" />
                <Link
                  href={`/browse/${section.id}`}
                  className="cursor-pointer border-0 bg-transparent p-0 font-body text-[0.85rem] font-semibold text-[#9ca3af] transition-[color] duration-200 ease-[ease] hover:text-ink"
                >
                  {labels.viewAll}
                </Link>
              </div>

              {/* Hidden on touch: the row is swipeable there, so the arrows
                  are chrome that earns nothing. */}
              <div className="flex gap-[14px] max-[768px]:hidden">
                {[
                  { label: labels.scrollLeft, direction: -1, points: "15 18 9 12 15 6" },
                  { label: labels.scrollRight, direction: 1, points: "9 18 15 12 9 6" },
                ].map((arrow) => (
                  <button
                    key={arrow.direction}
                    type="button"
                    className="flex h-[34px] w-6 cursor-pointer items-center justify-center rounded-none border-0 bg-transparent p-0 text-[#9ca3af] transition-[color,transform] duration-200 ease-[ease] hover:text-ink active:[transform:scale(0.9)]"
                    aria-label={arrow.label}
                    onClick={(e) => scrollRow(e, arrow.direction)}
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points={arrow.points} />
                    </svg>
                  </button>
                ))}
              </div>
            </div>

            {/* The row hides its scrollbar with both mechanisms; the arrows above
                scroll it. */}
            <div data-poster-row className="flex gap-[10px] overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {section.movies.map((movie) => (
                <PosterCard
                  key={movie.id}
                  movie={movie}
                  aspect={section.aspect}
                  saved={!!bookmarked[movie.id]}
                  saveLabel={labels.saveToList}
                  onToggleSave={() => toggleBookmark(movie.id)}
                  {...popover.cardProps(movie)}
                />
              ))}
            </div>
          </section>
        ))}
      </main>

      <SiteFooter brand={brand} footer={footer} />

      {wishlistOpen && (
        <div className="fixed inset-0 z-[1200] flex justify-end" role="dialog" aria-modal="true" aria-label="Saved to watch later">
          <button
            type="button"
            className="absolute inset-0 cursor-pointer border-0 bg-[rgba(0,0,0,0.58)] backdrop-blur-[8px]"
            aria-label="Close wishlist"
            onClick={() => setWishlistOpen(false)}
          />

          <aside className="relative z-[1] h-full w-[min(420px,calc(100vw-24px))] overflow-y-auto border-l border-[rgba(255,255,255,0.12)] bg-[#0b0b0b] p-6 shadow-[-28px_0_60px_rgba(0,0,0,0.55)]">
            <div className="flex items-start justify-between gap-[18px] border-b border-[rgba(255,255,255,0.08)] pb-[18px]">
              <div>
                <h2 className="m-0 font-heading text-[clamp(1.25rem,4vw,1.55rem)] leading-[1.05] font-extrabold text-ink">Saved to watch later</h2>
              </div>

              <button
                type="button"
                className={cx(WISHLIST_ICON_BTN, "h-9 w-9 pointer-coarse:size-11 flex-none rounded-[50%] border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.06)] text-ink hover:border-[rgba(255,255,255,0.22)] hover:bg-[rgba(255,255,255,0.14)]")}
                aria-label="Close wishlist"
                onClick={() => setWishlistOpen(false)}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <line x1="5" y1="5" x2="19" y2="19" />
                  <line x1="19" y1="5" x2="5" y2="19" />
                </svg>
              </button>
            </div>

            {savedMovies.length > 0 ? (
              <ul className="mt-[18px] flex list-none flex-col gap-[10px]">
                {savedMovies.map((movie) => (
                  <li key={movie.id} className="grid grid-cols-[minmax(0,1fr)_38px] items-stretch gap-[10px]">
                    <button
                      type="button"
                      className="grid min-w-0 cursor-pointer grid-cols-[64px_minmax(0,1fr)] items-center gap-3 border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.045)] p-2 text-left text-inherit transition-[background,border-color,transform] duration-200 ease-[ease] hover:border-[rgba(255,255,255,0.18)] hover:bg-[rgba(255,255,255,0.08)] hover:[transform:translateX(-2px)]"
                      onClick={() => {
                        setWishlistOpen(false);
                        router.push(`/watch/${movie.id}`);
                      }}
                    >
                      <img src={movie.image} alt="" className="aspect-[2/3] w-16 bg-[#171717] object-cover" />
                      <span className="flex min-w-0 flex-col gap-[5px]">
                        <span className="truncate font-heading text-[0.95rem] leading-[1.1] font-extrabold text-ink">{movie.title}</span>
                        <span className="text-[0.73rem] leading-[1.3] font-semibold text-[rgba(255,255,225,0.58)]">
                          {movie.year} · {movie.type || "Movie"} · ★ {movie.rating}
                        </span>
                      </span>
                    </button>

                    <button
                      type="button"
                      className={cx(WISHLIST_ICON_BTN, "border-[rgba(245,197,24,0.32)] bg-[rgba(245,197,24,0.08)] text-[#f5c518] hover:border-[rgba(255,46,61,0.55)] hover:bg-[rgba(255,46,61,0.12)] hover:text-[#ff5964]")}
                      aria-label={`Remove ${movie.title} from saved to watch later`}
                      onClick={() => toggleBookmark(movie.id)}
                    >
                      <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="grid min-h-[220px] place-items-center content-center gap-[14px] text-center text-[rgba(255,255,225,0.58)] [&_svg]:text-[rgba(255,255,225,0.36)]">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
                <p className="m-0 text-[0.9rem] font-semibold">No movies saved to watch later yet.</p>
              </div>
            )}
          </aside>
        </div>
      )}

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
