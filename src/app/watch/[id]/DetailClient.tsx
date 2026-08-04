"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import type { CastMember, Movie } from "@/lib/content-types";
import styles from "./detail.module.css";
import watchStyles from "../watch.module.css";

interface DetailClientProps {
  movie: Movie;
  related: Movie[];
  /** Already resolved against the store's defaultCast by the server. */
  cast: CastMember[];
}

export default function DetailClient({ movie, related, cast }: DetailClientProps) {
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
          <button className={styles.backBtn} aria-label="Go back" onClick={() => router.back()}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <Link href="/" className={styles.brandLogo}>
            <img src="/logo-wordmark.png" alt="SHOWTIVA" className={styles.brandLogoImg} />
          </Link>
        </div>
        <div className={styles.navRight}>
          <button className={styles.navIcon} aria-label="Search">
            <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
          <button className={styles.navIcon} aria-label="Profile">
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
            <span>{movie.type || "Movie"}</span>
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
            <span className={styles.qualityTag}>4K</span>
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
              <span>Play</span>
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
              <span>{inWatchlist ? "In Watchlist" : "Watchlist"}</span>
            </button>

            <button className={styles.iconBtn} aria-label="Download">
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
        <h2 className={styles.sectionHeading}>Cast</h2>
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
        <h2 className={styles.sectionHeading}>Trailer</h2>
        <div className={styles.trailerCard}>
          {/*
            Rendered as an <img>, so trailerUrl must be an IMAGE url (a poster
            frame), not a video link. Falls back to the poster art, matching
            what this section showed before it became data-driven.
          */}
          <img
            src={movie.trailerUrl ?? movie.image}
            alt={`${movie.title} trailer`}
            className={styles.trailerThumb}
          />
          <div className={styles.trailerScrim} />
          <div className={styles.trailerLabel}>
            <span className={styles.trailerTitle}>{movie.title} — Official Trailer</span>
            <span className={styles.trailerSub}>SHOWTIVA Originals</span>
          </div>
          <button className={styles.trailerPlayBtn} aria-label="Play trailer">
            <svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        </div>
      </section>

      {/* You may also like */}
      <section className={`${styles.sectionBlock} ${styles.lastSection}`}>
        <h2 className={styles.sectionHeading}>You may also like</h2>
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
                    aria-label="Save to list"
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

      {/* Premium Cinematic Footer (same as the watch page) */}
      <footer className={watchStyles.watchFooter}>
        <div className={watchStyles.footerBgWrap}>
          <img
            src="https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=1200&auto=format&fit=crop"
            alt="Footer Background"
            className={watchStyles.footerBgImage}
          />
          <div className={watchStyles.footerVignette} />
        </div>

        <div className={watchStyles.footerContent}>
          <div className={watchStyles.footerTop}>
            <div className={watchStyles.footerBrandCol}>
              <div className={watchStyles.footerLogo}>
                <img src="/logo-wordmark.png" alt="SHOWTIVA" className={watchStyles.footerLogoImg} />
              </div>
              <p className={watchStyles.footerTagline}>
                Experience premium stories, hand-drawn 2D animation, and magical worlds curated by creators worldwide.
              </p>
            </div>

            <div className={watchStyles.footerLinksGrid}>
              <div className={watchStyles.footerLinksCol}>
                <h5 className={watchStyles.footerColTitle}>Explore</h5>
                <ul className={watchStyles.footerLinksList}>
                  <li><Link href="/watch#trending-now">Trending Now</Link></li>
                  <li><Link href="/watch#movies">Popular Movies</Link></li>
                  <li><Link href="/watch#wholesome-series">Wholesome Series</Link></li>
                  <li><Link href="/watch#new-release">New Releases</Link></li>
                </ul>
              </div>

              <div className={watchStyles.footerLinksCol}>
                <h5 className={watchStyles.footerColTitle}>Company</h5>
                <ul className={watchStyles.footerLinksList}>
                  <li><a href="#">About Us</a></li>
                  <li><a href="#">Careers</a></li>
                  <li><a href="#">Press Kit</a></li>
                  <li><a href="#">Contact</a></li>
                </ul>
              </div>

              <div className={watchStyles.footerLinksCol}>
                <h5 className={watchStyles.footerColTitle}>Legal</h5>
                <ul className={watchStyles.footerLinksList}>
                  <li><a href="#">Terms of Use</a></li>
                  <li><a href="#">Privacy Policy</a></li>
                  <li><a href="#">Cookie Preferences</a></li>
                  <li><a href="#">Ad Choices</a></li>
                </ul>
              </div>
            </div>
          </div>

          <div className={watchStyles.footerBottom}>
            <p className={watchStyles.footerCopyright}>
              &copy; {new Date().getFullYear()} SHOWTIVA. All rights reserved. Crafted for film lovers.
            </p>
            <div className={watchStyles.footerSocials}>
              <a href="#" className={watchStyles.socialIconLink} aria-label="Twitter">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
                </svg>
              </a>
              <a href="#" className={watchStyles.socialIconLink} aria-label="Instagram">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
              <a href="#" className={watchStyles.socialIconLink} aria-label="YouTube">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
                  <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>

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
                <span className={watchStyles.popoverTypeBadge}>Tv</span>
                <span className={watchStyles.popoverRatingInline}>★ {hoveredMovie.rating}</span>
                <span className={watchStyles.popoverYearInline}>📅 {hoveredMovie.year}</span>
                <span className={watchStyles.popoverLangInline}>EN</span>
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
                <span>Watch Now</span>
              </button>
              <button
                className={`${watchStyles.popoverPlusBtn} ${saved[hoveredMovie.id] ? watchStyles.popoverPlusActive : ""}`}
                onClick={() => toggleSaved(hoveredMovie.id)}
                aria-label="Add to Watchlist"
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
