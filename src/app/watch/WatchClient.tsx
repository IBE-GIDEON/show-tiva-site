"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import type { Movie, Section } from "@/lib/content-types";
import styles from "./watch.module.css";

interface WatchClientProps {
  heroSlides: Movie[];
  sections: Section[];
}

export default function WatchClient({ heroSlides, sections }: WatchClientProps) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [prevSlide, setPrevSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [bookmarked, setBookmarked] = useState<{ [key: string]: boolean }>({});
  const [themeDark, setThemeDark] = useState(true);

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

  const triggerSlideChange = (newIndex: number) => {
    if (newIndex === activeSlide) return;
    setPrevSlide(activeSlide);
    setActiveSlide(newIndex);
    setIsTransitioning(true);

    setTimeout(() => {
      setIsTransitioning(false);
    }, 1200); // matches CSS transition duration
  };

  // Auto-advance hero slides every 7 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      triggerSlideChange((activeSlide + 1) % heroSlides.length);
    }, 7000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSlide, heroSlides.length]);

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
        {/* Brand Logo */}
        <Link href="/" className={styles.brandLogo}>
          <img src="/logo-wordmark.png" alt="SHOWTIVA" className={styles.brandLogoImg} />
        </Link>

        {/* Right nav utility icons */}
        <div className={styles.navActions}>
          <button className={styles.iconBtn} aria-label="Search">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>

          <button className={styles.iconBtn} aria-label="Notifications">
            <span className={styles.notificationBadge} />
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </button>

          <button className={styles.iconBtn} aria-label="Profile">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </button>
        </div>
      </header>

      {/* Split Hero (full screen): dark text left, image right */}
      <section className={styles.heroBanner}>
        {heroSlides.map((slide, index) => {
          const isActive = index === activeSlide;
          const isSaved = !!bookmarked[slide.id];
          return (
            <div
              key={slide.id}
              className={`${styles.slideContainer} ${isActive ? styles.activeSlide : ""}`}
            >
              <img src={slide.image} alt={slide.title} className={styles.heroImageLayer} />
              <div className={styles.heroGradientOverlay} />

              <div className={styles.heroContent}>
                <span className={styles.durationTag}>Duration {slide.duration}</span>
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
                    <span>Watch Now</span>
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
                    <span>{isSaved ? "Added" : "Add List"}</span>
                  </button>
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
              aria-label={`Go to slide ${index + 1}`}
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
                  <button className={styles.viewAllLink}>View All</button>
                </div>

                <div className={styles.carouselArrows}>
                  <button
                    className={styles.arrowBtn}
                    aria-label="Scroll left"
                    onClick={(e) => scrollRow(e, -1)}
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>
                  <button
                    className={styles.arrowBtn}
                    aria-label="Scroll right"
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
                          aria-label="Save to list"
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

      {/* Premium Cinematic Footer with Blurred Movie Backdrop */}
      <footer className={styles.watchFooter}>
        <div className={styles.footerBgWrap}>
          <img 
            src="https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=1200&auto=format&fit=crop" 
            alt="Footer Background" 
            className={styles.footerBgImage} 
          />
          <div className={styles.footerVignette} />
        </div>

        <div className={styles.footerContent}>
          <div className={styles.footerTop}>
            {/* Branding Column */}
            <div className={styles.footerBrandCol}>
              <div className={styles.footerLogo}>
                <img src="/logo-wordmark.png" alt="SHOWTIVA" className={styles.footerLogoImg} />
              </div>
              <p className={styles.footerTagline}>
                Experience premium stories, hand-drawn 2D animation, and magical worlds curated by creators worldwide.
              </p>
            </div>

            {/* Quick Link Columns */}
            <div className={styles.footerLinksGrid}>
              <div className={styles.footerLinksCol}>
                <h5 className={styles.footerColTitle}>Explore</h5>
                <ul className={styles.footerLinksList}>
                  <li><a href="#trending-now">Trending Now</a></li>
                  <li><a href="#movies">Popular Movies</a></li>
                  <li><a href="#wholesome-series">Wholesome Series</a></li>
                  <li><a href="#new-release">New Releases</a></li>
                </ul>
              </div>

              <div className={styles.footerLinksCol}>
                <h5 className={styles.footerColTitle}>Company</h5>
                <ul className={styles.footerLinksList}>
                  <li><a href="#">About Us</a></li>
                  <li><a href="#">Careers</a></li>
                  <li><a href="#">Press Kit</a></li>
                  <li><a href="#">Contact</a></li>
                </ul>
              </div>

              <div className={styles.footerLinksCol}>
                <h5 className={styles.footerColTitle}>Legal</h5>
                <ul className={styles.footerLinksList}>
                  <li><a href="#">Terms of Use</a></li>
                  <li><a href="#">Privacy Policy</a></li>
                  <li><a href="#">Cookie Preferences</a></li>
                  <li><a href="#">Ad Choices</a></li>
                </ul>
              </div>
            </div>
          </div>

          <div className={styles.footerBottom}>
            <p className={styles.footerCopyright}>
              &copy; {new Date().getFullYear()} SHOWTIVA. All rights reserved. Crafted for film lovers.
            </p>
            <div className={styles.footerSocials}>
              <a href="#" className={styles.socialIconLink} aria-label="Twitter">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
                </svg>
              </a>
              <a href="#" className={styles.socialIconLink} aria-label="Instagram">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
              <a href="#" className={styles.socialIconLink} aria-label="YouTube">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
                  <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>

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
                <span className={styles.popoverTypeBadge}>Tv</span>
                <span className={styles.popoverRatingInline}>★ {hoveredMovie.rating}</span>
                <span className={styles.popoverYearInline}>📅 {hoveredMovie.year}</span>
                <span className={styles.popoverLangInline}>EN</span>
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
                <span>Watch Now</span>
              </button>
              
              <button 
                className={`${styles.popoverPlusBtn} ${bookmarked[hoveredMovie.id] ? styles.popoverPlusActive : ""}`}
                onClick={() => toggleBookmark(hoveredMovie.id)}
                aria-label="Add to Watchlist"
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
