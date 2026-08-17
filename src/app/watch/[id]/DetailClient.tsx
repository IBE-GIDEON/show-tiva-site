"use client";

// "Premium Minimal" detail page.
//
// Confident restraint: near-black, near-white, one mid-grey, and a single
// accent that appears exactly once (the rating). No pills, no badges, no card
// borders — metadata is quiet inline text on hairline dividers. Type carries
// the hierarchy; the artwork appears once, full-bleed and unadorned.
import React, { useEffect, useRef, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import type { Movie } from "@/lib/content-types";
import type { Brand, DetailLabels, FooterContent, PopoverLabels } from "@/lib/site-types";
import styles from "./detail.module.css";
// The related grid reuses the catalog's card and hover-popover styling verbatim,
// so a card looks and behaves identically on both pages.
import watchStyles from "../watch.module.css";

interface DetailClientProps {
  movie: Movie;
  related: Movie[];
  brand: Brand;
  footer: FooterContent;
  labels: DetailLabels;
  popoverLabels: PopoverLabels;
}

export default function DetailClient({
  movie,
  related,
  brand,
  footer,
  labels,
  popoverLabels,
}: DetailClientProps) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);

  // Play expands the still into a full-height theatre and brings it to the top
  // of the viewport, so the screen is what you are looking at rather than
  // something below the fold.
  const [playing, setPlaying] = useState(false);
  const plateRef = useRef<HTMLDivElement | null>(null);

  // Scrolling belongs in an effect, not the click handler: at click time the
  // frame is still at its poster height, so it would scroll to the wrong place.
  useEffect(() => {
    if (!playing) return;
    plateRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [playing]);

  // --- related card state (mirrors WatchClient) ---
  const [bookmarked, setBookmarked] = useState<{ [key: string]: boolean }>({});
  const [hoveredMovie, setHoveredMovie] = useState<Movie | null>(null);
  const [popoverPos, setPopoverPos] = useState<{
    top: number;
    left: number;
    alignRight: boolean;
    height: number;
  } | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const toggleBookmark = (movieId: string) => {
    setBookmarked((prev) => ({ ...prev, [movieId]: !prev[movieId] }));
  };

  const handleCardMouseEnter = (m: Movie, e: React.MouseEvent) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    const rect = e.currentTarget.getBoundingClientRect();

    const popoverWidth = 330;
    const gap = 12;
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    const scrollX = window.scrollX || document.documentElement.scrollLeft;

    // Flip to the card's left when there is no room on the right.
    let left = rect.right + gap + scrollX;
    let alignRight = true;
    if (rect.right + gap + popoverWidth > window.innerWidth) {
      left = rect.left - popoverWidth - gap + scrollX;
      alignRight = false;
    }
    if (left < 0) left = 12;

    setPopoverPos({ top: rect.top + scrollY, left, alignRight, height: rect.height });
    setHoveredMovie(m);
  };

  // Small grace period so moving the pointer across the gap into the popover
  // does not dismiss it.
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

  // `||`, not `??`, throughout: the store's validator accepts "" as well as
  // null for the nullable fields, and an empty string would slip past `??` —
  // printing a blank meta cell, or a broken image for an empty src.
  const kind = movie.type || labels.typeFallback;
  const plateSrc = movie.trailerUrl || movie.backdrop;

  const genres = movie.genres.filter((genre) => genre.trim().length > 0);

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

  return (
    <div className={styles.page}>
      <header className={`${styles.shell} ${styles.header}`}>
        <button type="button" className={styles.back} onClick={() => router.back()}>
          <svg
            className={styles.backGlyph}
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
          <span>{labels.goBack}</span>
        </button>

        <Link href={brand.homeHref} className={styles.lockup}>
          <img className={styles.lockupMark} src={brand.mark} alt="" />
          <img className={styles.lockupWord} src={brand.wordmark} alt={brand.wordmarkAlt} />
        </Link>
      </header>

      <main className={styles.main}>
        {/* Compact info block above a full-bleed still: roughly 30/70 of the
            opening screen, so the artwork stays the dominant element. */}
        <section className={`${styles.shell} ${styles.masthead}`}>
          {genres.length > 0 && (
            <p className={styles.genres}>
              {genres.map((genre, index) => (
                <span key={`${genre}-${index}`} className={styles.genre}>
                  {genre}
                </span>
              ))}
            </p>
          )}

          <h1 className={styles.title}>{movie.title}</h1>
          {movie.subtitle && <p className={styles.subtitle}>{movie.subtitle}</p>}

          {meta.length > 0 && (
            <ul className={styles.metaRail}>
              {meta.map((item) => (
                <li key={item.key} className={styles.metaItem}>
                  {item.accent ? <span className={styles.rating}>{item.text}</span> : item.text}
                </li>
              ))}
            </ul>
          )}

          <p className={styles.synopsis}>{movie.description}</p>

          <div className={styles.actions}>
            <button type="button" className={styles.play} onClick={() => setPlaying(true)}>
              <svg
                className={styles.playGlyph}
                viewBox="0 0 12 14"
                aria-hidden="true"
                focusable="false"
              >
                <path d="M0 0v14l12-7z" fill="currentColor" />
              </svg>
              <span>{labels.play}</span>
            </button>

            <button
              type="button"
              className={`${styles.save} ${saved ? styles.saveOn : ""}`}
              aria-pressed={saved}
              onClick={() => setSaved((value) => !value)}
            >
              {/* Wrapped so the button's counter-skew rule can reach the label —
                  a bare text node would stay sheared with the button. */}
              <span>{saved ? labels.inWatchlist : labels.watchlist}</span>
            </button>
          </div>
        </section>

        <figure className={styles.plate}>
          <div
            ref={plateRef}
            className={`${styles.plateFrame} ${playing ? styles.plateFramePlaying : ""}`}
          >
            <img
              className={playing ? styles.player : styles.plateImg}
              src={plateSrc}
              alt={movie.title}
            />

            {playing ? (
              <>
                <button
                  type="button"
                  className={styles.playerExit}
                  onClick={() => setPlaying(false)}
                >
                  <svg
                    className={styles.playerExitGlyph}
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

                {/* The store carries no video file for a title yet — only key
                    art — so the screen shows that until a source field exists. */}
                <p className={styles.playerNote}>
                  No video source attached to this title yet.
                </p>
              </>
            ) : (
              <button
                type="button"
                className={styles.platePlay}
                aria-label={labels.trailerPlay}
                onClick={() => setPlaying(true)}
              >
                <svg
                  className={styles.platePlayGlyph}
                  viewBox="0 0 12 14"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path d="M0 0v14l12-7z" fill="currentColor" />
                </svg>
              </button>
            )}
          </div>

          <figcaption className={styles.plateCaption}>
            <div className={styles.plateBar}>
              <span className={styles.plateCaptionMain}>
                <span className={styles.plateEyebrow}>{labels.trailerHeading}</span>
                <span className={styles.plateTitle}>
                  {movie.title} — {labels.trailerTitleSuffix}
                </span>
              </span>
              <span className={styles.plateStudio}>{labels.trailerStudio}</span>
            </div>
          </figcaption>
        </figure>

        <div className={styles.shell}>
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionLabel}>{labels.relatedHeading}</h2>
              <span className={styles.sectionRule} aria-hidden="true" />
            </div>

            {related.length > 0 ? (
              <ul className={styles.relatedGrid}>
                {related.map((item) => {
                  const isSaved = !!bookmarked[item.id];
                  return (
                    <li key={item.id} className={styles.relatedItem}>
                      <div
                        className={watchStyles.posterCard}
                        onMouseEnter={(e) => handleCardMouseEnter(item, e)}
                        onMouseLeave={handleCardMouseLeave}
                        onClick={() => router.push(`/watch/${item.id}`)}
                      >
                        <div className={watchStyles.posterWrapper}>
                          <img
                            src={item.image}
                            alt={item.title}
                            loading="lazy"
                            className={watchStyles.posterImg}
                          />

                          {/* Bookmark / Save (top-left) */}
                          <button
                            className={`${watchStyles.bookmarkBtn} ${isSaved ? watchStyles.bookmarkActive : ""}`}
                            aria-label={labels.saveToList}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleBookmark(item.id);
                            }}
                          >
                            <svg viewBox="0 0 24 24" width="15" height="15" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                            </svg>
                          </button>

                          {/* Rating badge (top-right) */}
                          <div className={watchStyles.ratingBadge}>
                            <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                            <span>{item.rating}</span>
                          </div>

                          {/* Hover play button */}
                          <div className={watchStyles.posterOverlay}>
                            <div className={watchStyles.playBtnCircle}>
                              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </div>
                          </div>

                          {/* Title / year revealed on hover */}
                          <div className={watchStyles.posterHoverInfo}>
                            <h4 className={watchStyles.posterTitle}>{item.title}</h4>
                            <span className={watchStyles.metaYear}>{item.year}</span>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className={styles.empty}>Nothing else in this collection yet.</p>
            )}
          </section>
        </div>
      </main>

      <footer className={`${styles.shell} ${styles.footer}`}>
        <p className={styles.footerNote}>
          © {new Date().getFullYear()} {footer.copyright}
        </p>
      </footer>

      {/* Floating detail popover, same as the catalog's. Positioned in document
          coordinates, so it is a direct child of .page — which is the
          positioned ancestor it resolves against. */}
      {hoveredMovie && popoverPos && (
        <div
          className={`${watchStyles.detailsPopover} ${popoverPos.alignRight ? watchStyles.popoverRight : watchStyles.popoverLeft}`}
          style={{
            top: `${popoverPos.top}px`,
            left: `${popoverPos.left}px`,
            width: "330px",
            height: `${popoverPos.height}px`,
          }}
          onMouseEnter={handlePopoverMouseEnter}
          onMouseLeave={handlePopoverMouseLeave}
        >
          <div className={watchStyles.popoverBackdropWrap}>
            <img
              src={hoveredMovie.image}
              alt={hoveredMovie.title}
              className={watchStyles.popoverBackdrop}
            />
            <div className={watchStyles.popoverBackdropVignette} />

            <div className={watchStyles.popoverBackdropText}>
              <h3 className={watchStyles.popoverLogoTitle}>{hoveredMovie.title}</h3>
              <div className={watchStyles.popoverMetaRowInline}>
                <span className={watchStyles.popoverTypeBadge}>{popoverLabels.typeBadge}</span>
                <span className={watchStyles.popoverRatingInline}>★ {hoveredMovie.rating}</span>
                <span className={watchStyles.popoverYearInline}>📅 {hoveredMovie.year}</span>
                <span className={watchStyles.popoverLangInline}>{popoverLabels.languageBadge}</span>
              </div>
            </div>

            <div className={watchStyles.popoverTopRightBadge}>
              <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <span>{hoveredMovie.rating}</span>
            </div>
          </div>

          <div className={watchStyles.popoverBody}>
            <h4 className={watchStyles.popoverTitle}>{hoveredMovie.title}</h4>
            <p className={watchStyles.popoverDescription}>{hoveredMovie.description}</p>

            <div className={watchStyles.popoverActions}>
              <button
                className={watchStyles.popoverWatchBtn}
                onClick={() => router.push(`/watch/${hoveredMovie.id}`)}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                <span>{popoverLabels.watchNow}</span>
              </button>

              <button
                className={`${watchStyles.popoverPlusBtn} ${bookmarked[hoveredMovie.id] ? watchStyles.popoverPlusActive : ""}`}
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
