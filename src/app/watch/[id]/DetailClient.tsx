"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import type { CastMember, Movie } from "@/lib/content-types";
import type { Brand, DetailLabels, FooterContent, PopoverLabels } from "@/lib/site-types";
import SiteFooter from "../SiteFooter";
import styles from "./detail.module.css";
import watchStyles from "../watch.module.css";

interface DetailClientProps {
  movie: Movie;
  related: Movie[];
  /** Already resolved against the store's defaultCast by the server. */
  cast: CastMember[];
  brand: Brand;
  footer: FooterContent;
  labels: DetailLabels;
  popoverLabels: PopoverLabels;
}

export default function DetailClient({
  movie,
  related,
  cast,
  brand,
  footer,
  labels,
  popoverLabels,
}: DetailClientProps) {
  const router = useRouter();

  const description = movie.description;
  const genres = movie.genres;

  const [inWatchlist, setInWatchlist] = useState(false);
  const [saved, setSaved] = useState<{ [key: string]: boolean }>({});

  // Hover pop-out card (mirrors the watch catalog behaviour)
  const [hoveredMovie, setHoveredMovie] = useState<Movie | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number; alignRight: boolean; height: number } | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const toggleSaved = (id: string) => setSaved((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleCardMouseEnter = (m: Movie, e: React.MouseEvent) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    const rect = e.currentTarget.getBoundingClientRect();
    const popoverWidth = 330;
    const gap = 12;
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
    setPopoverPos({ top, left, alignRight, height: rect.height });
    setHoveredMovie(m);
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

  return (
    <div className={styles.detailPage}>
      {/* Top nav */}
      <header className={styles.detailNav}>
        <div className={styles.navLeft}>
          <button className={styles.backBtn} aria-label={labels.goBack} onClick={() => router.back()}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <Link href={brand.homeHref} className={styles.brandLogo}>
            {/* Decorative: the wordmark beside it carries the accessible name. */}
            <img src={brand.mark} alt="" className={styles.brandMarkImg} />
            <img src={brand.wordmark} alt={brand.wordmarkAlt} className={styles.brandLogoImg} />
          </Link>
        </div>
        <div className={styles.navRight}>
          <button className={styles.navIcon} aria-label={labels.search}>
            <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
          <button className={styles.navIcon} aria-label={labels.profile}>
            <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </button>
        </div>
      </header>

      {/* Cinematic backdrop */}
      <section className={styles.backdrop}>
        <img src={movie.backdrop} alt={movie.title} className={styles.backdropImg} />
        <div className={styles.backdropScrim} />
      </section>

      {/* Info block */}
      <section className={styles.infoBlock}>
        <div className={styles.posterCol}>
          <div className={styles.posterCard}>
            <img src={movie.image} alt={movie.title} className={styles.posterImg} />
          </div>
        </div>

        <div className={styles.detailsCol}>
          <h1 className={styles.detailTitle}>{movie.title}</h1>

          <div className={styles.detailMetaRow}>
            <span>{movie.type || labels.typeFallback}</span>
            <span className={styles.metaDot}>•</span>
            <span className={styles.metaRating}>
              <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              {movie.rating}
            </span>
            <span className={styles.metaDot}>•</span>
            <span>{movie.year}</span>
            <span className={styles.metaDot}>•</span>
            <span className={styles.qualityTag}>{labels.qualityBadge}</span>
          </div>

          <div className={styles.genreTags}>
            {genres.map((g) => (
              <span key={g} className={styles.genrePill}>
                {g}
              </span>
            ))}
          </div>

          <p className={styles.detailDesc}>{description}</p>

          <div className={styles.actionRow}>
            <button className={styles.playBtn}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
              <span>{labels.play}</span>
            </button>

            <button
              className={`${styles.watchlistBtn} ${inWatchlist ? styles.watchlistActive : ""}`}
              onClick={() => setInWatchlist((v) => !v)}
            >
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                {inWatchlist ? (
                  <polyline points="20 6 9 17 4 12" />
                ) : (
                  <>
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </>
                )}
              </svg>
              <span>{inWatchlist ? labels.inWatchlist : labels.watchlist}</span>
            </button>

            <button className={styles.iconBtn} aria-label={labels.download}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Cast */}
      <section className={styles.sectionBlock}>
        <h2 className={styles.sectionHeading}>{labels.castHeading}</h2>
        <div className={styles.castGrid}>
          {cast.map((person) => (
            <div key={person.name} className={styles.castCard}>
              <div className={styles.castAvatar}>
                {person.image ? (
                  <img src={person.image} alt={person.name} />
                ) : (
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                )}
              </div>
              <div className={styles.castInfo}>
                <span className={styles.castName}>{person.name}</span>
                <span className={styles.castRole}>{person.role}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trailer */}
      <section className={styles.sectionBlock}>
        <h2 className={styles.sectionHeading}>{labels.trailerHeading}</h2>
        <div className={styles.trailerCard}>
          {/*
            Rendered as an <img>, so trailerUrl must be an IMAGE url (a poster
            frame), not a video link. Falls back to the poster art, matching
            what this section showed before it became data-driven.
            `||`, not `??`: the store accepts "" as well as null for this
            field, and an empty src renders a broken image rather than falling
            back.
          */}
          <img
            src={movie.trailerUrl || movie.image}
            alt={`${movie.title} trailer`}
            className={styles.trailerThumb}
          />
          <div className={styles.trailerScrim} />
          <div className={styles.trailerLabel}>
            <span className={styles.trailerTitle}>{movie.title} — {labels.trailerTitleSuffix}</span>
            <span className={styles.trailerSub}>{labels.trailerStudio}</span>
          </div>
          <button className={styles.trailerPlayBtn} aria-label={labels.trailerPlay}>
            <svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        </div>
      </section>

      {/* You may also like */}
      <section className={`${styles.sectionBlock} ${styles.lastSection}`}>
        <h2 className={styles.sectionHeading}>{labels.relatedHeading}</h2>
        <div className={styles.similarGrid}>
          {related.map((rel) => {
            const isSaved = !!saved[rel.id];
            return (
              <div
                key={rel.id}
                className={styles.simCard}
                onClick={() => router.push(`/watch/${rel.id}`)}
                onMouseEnter={(e) => handleCardMouseEnter(rel, e)}
                onMouseLeave={handleCardMouseLeave}
              >
                <div className={styles.simWrapper}>
                  <img src={rel.image} alt={rel.title} loading="lazy" className={styles.simImg} />

                  <button
                    className={`${styles.simBookmark} ${isSaved ? styles.simBookmarkActive : ""}`}
                    aria-label={labels.saveToList}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSaved(rel.id);
                    }}
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                  </button>

                  <div className={styles.simRating}>
                    <svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    <span>{rel.rating}</span>
                  </div>

                  <div className={styles.simOverlay}>
                    <div className={styles.simPlay}>
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>

                  <div className={styles.simInfo}>
                    <span className={styles.simTitle}>{rel.title}</span>
                    <span className={styles.simYear}>{rel.year}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <SiteFooter brand={brand} footer={footer} />

      {/* Hover pop-out detail card (same as watch catalog) */}
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
            <img src={hoveredMovie.image} alt={hoveredMovie.title} className={watchStyles.popoverBackdrop} />
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
                className={`${watchStyles.popoverPlusBtn} ${saved[hoveredMovie.id] ? watchStyles.popoverPlusActive : ""}`}
                onClick={() => toggleSaved(hoveredMovie.id)}
                aria-label={popoverLabels.addToWatchlist}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  {saved[hoveredMovie.id] ? (
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
