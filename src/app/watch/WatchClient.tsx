"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import type { Movie, Section } from "@/lib/content-types";
import type { Brand, FooterContent, PopoverLabels, WatchLabels } from "@/lib/site-types";
import SiteFooter from "./SiteFooter";
import styles from "./watch.module.css";

interface WatchClientProps {
  heroSlides: Movie[];
  sections: Section[];
  brand: Brand;
  footer: FooterContent;
  labels: WatchLabels;
  popoverLabels: PopoverLabels;
}

export default function WatchClient({
  heroSlides,
  sections,
  brand,
  footer,
  labels,
  popoverLabels,
}: WatchClientProps) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [bookmarked, setBookmarked] = useState<{ [key: string]: boolean }>({});
  const [themeDark] = useState(true);

  const [hoveredMovie, setHoveredMovie] = useState<Movie | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number; alignRight: boolean; height: number } | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  const handleCardMouseEnter = (movie: Movie, e: React.MouseEvent) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    const rect = e.currentTarget.getBoundingClientRect();
    
    const popoverWidth = 330;
    const gap = 12; // Restore original space between card and popover
    
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    const scrollX = window.scrollX || document.documentElement.scrollLeft;
    
    let left = rect.right + gap + scrollX;
    let alignRight = true;
    
    if (rect.right + gap + popoverWidth > window.innerWidth) {
      left = rect.left - popoverWidth - gap + scrollX;
      alignRight = false;
    }
    
    if (left < 0) left = 12;
    const top = rect.top + scrollY;

    setPopoverPos({ 
      top, 
      left, 
      alignRight, 
      height: rect.height 
    });
    setHoveredMovie(movie);
  };

  const handleCardMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredMovie(null);
      setPopoverPos(null);
    }, 200);
  };

  const handlePopoverMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
  };

  const handlePopoverMouseLeave = () => {
    setHoveredMovie(null);
    setPopoverPos(null);
  };

  /**
   * Move the outgoing slide off to the left while the incoming one settles in
   * from the right. Which slide is leaving can't be derived from activeSlide
   * alone, so it gets its own state, cleared once the exit has finished.
   *
   * Must match the transform duration in .slideContainer, otherwise the class
   * is dropped mid-flight and the slide snaps back across the screen.
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heroSlides.length]);

  // The exit timer outlives the slide change, so it has to be cancelled if the
  // page unmounts mid-transition.
  useEffect(() => () => {
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
  }, []);

  const toggleBookmark = (movieId: string) => {
    setBookmarked((prev) => ({ ...prev, [movieId]: !prev[movieId] }));
  };

  const scrollRow = (e: React.MouseEvent<HTMLButtonElement>, direction: number) => {
    const section = (e.currentTarget as HTMLElement).closest("section");
    const row = section?.querySelector<HTMLElement>(`.${styles.posterRow}`);
    if (row) row.scrollBy({ left: direction * row.clientWidth * 0.85, behavior: "smooth" });
  };

  return (
    <div className={`${styles.watchContainer} ${themeDark ? styles.darkTheme : styles.lightTheme}`}>
      <header className={styles.watchHeader}>
        {/* Constrained to the same 1480px/48px box as .watchMain, so the logo
            starts on the poster rows' left edge. The bar itself stays
            full-bleed so its gradient still spans the viewport. */}
        <div className={styles.watchHeaderInner}>
          {/* Brand Logo */}
          <Link href={brand.homeHref} className={styles.brandLogo}>
            {/* Decorative: the wordmark beside it carries the accessible name. */}
            <img src={brand.mark} alt="" className={styles.brandMarkImg} />
            <img src={brand.wordmark} alt={brand.wordmarkAlt} className={styles.brandLogoImg} />
          </Link>

          {/* Right nav utility icons */}
          <div className={styles.navActions}>
            <button className={styles.iconBtn} aria-label={labels.search}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>

            <button className={styles.iconBtn} aria-label={labels.notifications}>
              <span className={styles.notificationBadge} />
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </button>

            <button className={styles.iconBtn} aria-label={labels.profile}>
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Full-bleed hero: copy on the left over a top-anchored still */}
      <section className={styles.heroBanner}>
        {heroSlides.map((slide, index) => {
          const isActive = index === activeSlide;
          const isLeaving = index === leavingSlide;
          const isSaved = !!bookmarked[slide.id];
          return (
            <div
              key={slide.id}
              className={`${styles.slideContainer} ${isActive ? styles.activeSlide : ""} ${
                isLeaving ? styles.leavingSlide : ""
              }`}
            >
              <img src={slide.image} alt={slide.title} className={styles.heroImageLayer} />
              <div className={styles.heroGradientOverlay} />

              {/* Same 1480/48 box as .watchHeaderInner and .watchMain, so the
                  hero copy starts on the logo's and the poster rows' left edge. */}
              <div className={styles.heroInner}>
                <div className={styles.heroContent}>
                  <span className={styles.durationTag}>{labels.heroDurationPrefix} {slide.duration}</span>
                  <h1 className={styles.heroTitle}>{slide.title}</h1>
                  <p className={styles.heroDesc}>{slide.description}</p>

                  <div className={styles.heroBtnGroup}>
                    <button
                      className={styles.watchNowBtn}
                      onClick={() => router.push(`/watch/${slide.id}`)}
                    >
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      <span>{labels.heroWatchNow}</span>
                    </button>

                    <button
                      className={`${styles.addListBtn} ${isSaved ? styles.addListActive : ""}`}
                      onClick={() => toggleBookmark(slide.id)}
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        {isSaved ? (
                          <polyline points="20 6 9 17 4 12" />
                        ) : (
                          <>
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                          </>
                        )}
                      </svg>
                      <span>{isSaved ? labels.heroAdded : labels.heroAddList}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Carousel pagination dashes */}
        <div className={styles.carouselDashContainer}>
          {heroSlides.map((_, index) => (
            <button
              key={`dash-${index}`}
              onClick={() => triggerSlideChange(index)}
              className={`${styles.dashBar} ${index === activeSlide ? styles.activeDashBar : ""}`}
              aria-label={`${labels.heroSlideDot} ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Main Browse Catalog Below Hero */}
      <main className={styles.watchMain}>
        {sections.map((section) => {
          const accent = section.accent;

          return (
            <section key={section.id} id={section.id} className={styles.movieSection}>
              {/* Section Header */}
              <div className={styles.sectionHeaderRow}>
                <div className={styles.sectionTitleWrap}>
                  <h2 className={styles.sectionTitle} style={{ color: accent }}>
                    {section.title}
                  </h2>
                  <span className={styles.headerDivider} />
                  <Link href={`/browse/${section.id}`} className={styles.viewAllLink}>
                    {labels.viewAll}
                  </Link>
                </div>

                <div className={styles.carouselArrows}>
                  <button
                    className={styles.arrowBtn}
                    aria-label={labels.scrollLeft}
                    onClick={(e) => scrollRow(e, -1)}
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>
                  <button
                    className={styles.arrowBtn}
                    aria-label={labels.scrollRight}
                    onClick={(e) => scrollRow(e, 1)}
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Poster Row */}
              <div className={styles.posterRow}>
                {section.movies.map((movie) => {
                  const isLandscape = section.aspect === "landscape";
                  const isSaved = !!bookmarked[movie.id];
                  return (
                    <div
                      key={movie.id}
                      className={isLandscape ? styles.posterCardLandscape : styles.posterCard}
                      onMouseEnter={(e) => handleCardMouseEnter(movie, e)}
                      onMouseLeave={handleCardMouseLeave}
                      onClick={() => router.push(`/watch/${movie.id}`)}
                    >
                      <div className={isLandscape ? styles.posterWrapperLandscape : styles.posterWrapper}>
                        <img
                          src={movie.image}
                          alt={movie.title}
                          loading="lazy"
                          className={styles.posterImg}
                        />

                        {/* Bookmark / Save (top-left) */}
                        <button
                          className={`${styles.bookmarkBtn} ${isSaved ? styles.bookmarkActive : ""}`}
                          aria-label={labels.saveToList}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleBookmark(movie.id);
                          }}
                        >
                          <svg viewBox="0 0 24 24" width="15" height="15" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                          </svg>
                        </button>

                        {/* Rating badge (top-right) */}
                        <div className={styles.ratingBadge}>
                          <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                          <span>{movie.rating}</span>
                        </div>

                        {/* Hover play button */}
                        <div className={styles.posterOverlay}>
                          <div className={styles.playBtnCircle}>
                            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </div>

                        {/* Title / year revealed on hover */}
                        <div className={styles.posterHoverInfo}>
                          <h4 className={styles.posterTitle}>{movie.title}</h4>
                          <span className={styles.metaYear}>{movie.year}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </main>

      <SiteFooter brand={brand} footer={footer} />

      {/* Dynamic Cinematic Detail Popover Card (Portal-style floating popup next to hovered card) */}
      {hoveredMovie && popoverPos && (
        <div
          className={`${styles.detailsPopover} ${popoverPos.alignRight ? styles.popoverRight : styles.popoverLeft}`}
          style={{
            top: `${popoverPos.top}px`,
            left: `${popoverPos.left}px`,
            width: '330px',
            height: `${popoverPos.height}px`,
          }}
          onMouseEnter={handlePopoverMouseEnter}
          onMouseLeave={handlePopoverMouseLeave}
        >
          {/* Backdrop Header Image */}
          <div className={styles.popoverBackdropWrap}>
            <img 
              src={hoveredMovie.image} 
              alt={hoveredMovie.title} 
              className={styles.popoverBackdrop} 
            />
            <div className={styles.popoverBackdropVignette} />
            
            {/* Logo/Subtitle inside Backdrop */}
            <div className={styles.popoverBackdropText}>
              <h3 className={styles.popoverLogoTitle}>{hoveredMovie.title}</h3>
              <div className={styles.popoverMetaRowInline}>
                <span className={styles.popoverTypeBadge}>{popoverLabels.typeBadge}</span>
                <span className={styles.popoverRatingInline}>★ {hoveredMovie.rating}</span>
                <span className={styles.popoverYearInline}>📅 {hoveredMovie.year}</span>
                <span className={styles.popoverLangInline}>{popoverLabels.languageBadge}</span>
              </div>
            </div>

            {/* Top-Right Badge */}
            <div className={styles.popoverTopRightBadge}>
              <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <span>{hoveredMovie.rating}</span>
            </div>
          </div>

          {/* Details Body */}
          <div className={styles.popoverBody}>
            <h4 className={styles.popoverTitle}>{hoveredMovie.title}</h4>
            <p className={styles.popoverDescription}>
              {hoveredMovie.description}
            </p>

            {/* Button Actions */}
            <div className={styles.popoverActions}>
              <button
                className={styles.popoverWatchBtn}
                onClick={() => router.push(`/watch/${hoveredMovie.id}`)}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                <span>{popoverLabels.watchNow}</span>
              </button>
              
              <button 
                className={`${styles.popoverPlusBtn} ${bookmarked[hoveredMovie.id] ? styles.popoverPlusActive : ""}`}
                onClick={() => toggleBookmark(hoveredMovie.id)}
                aria-label={popoverLabels.addToWatchlist}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  {bookmarked[hoveredMovie.id] ? (
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
      )}
    </div>
  );
}
