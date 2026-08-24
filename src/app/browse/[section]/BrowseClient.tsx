"use client";

// v1 — "Control Room".
//
// The reference screenshot's older sibling: same information architecture
// (search, filter row, result count, poster grid, pagination) executed as a
// dense instrument panel rather than a strip of grey pills. Every control is
// real: filtering, sorting, scope and pagination are all derived client-side
// from the props below.

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useMemo, useRef, useState } from "react";

import { getSignupHref, isDemoSignedIn } from "../../_auth/demo-auth";
import ProfileMenu from "../../_auth/ProfileMenu";
import type { BrowseData } from "../_lib/browse-data";
import type { Movie } from "@/lib/content-types";

import SearchOverlay from "../../watch/SearchOverlay";
import SiteFooter from "../../watch/SiteFooter";
import styles from "./browse.module.css";
// The grid reuses the catalog's card and hover-popover styling verbatim, so a
// card looks and behaves the same here as on /watch.
import watchStyles from "../../watch/watch.module.css";

/** Cards per page. A 10–12 title category lands on a single page; widening the
 *  scope to the full catalog is what makes the pager earn its keep. */
const PAGE_SIZE = 12;

type SortKey = "rating" | "newest" | "oldest" | "az";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "rating", label: "Top rated" },
  { key: "newest", label: "Newest first" },
  { key: "oldest", label: "Oldest first" },
  { key: "az", label: "Title A–Z" },
];

/** The catalog stores rating as a numeric string, so tiers are derived here
 *  rather than shipped as a facet. */
const RATING_TIERS: { value: string; label: string }[] = [
  { value: "9", label: "9.0 and above" },
  { value: "8", label: "8.0 and above" },
  { value: "7", label: "7.0 and above" },
];

type Scope = "section" | "all";

function ratingOf(movie: Movie): number {
  const n = Number.parseFloat(movie.rating);
  return Number.isNaN(n) ? 0 : n;
}

function yearOf(movie: Movie): number {
  const n = Number.parseInt(movie.year, 10);
  return Number.isNaN(n) ? 0 : n;
}

/* ---------------------------------------------------------------- icons -- */

const IconSearch = (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconChevron = (
  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const IconClose = (
  <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
    <line x1="5" y1="5" x2="19" y2="19" />
    <line x1="19" y1="5" x2="5" y2="19" />
  </svg>
);

const IconArrowLeft = (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="11 18 5 12 11 6" />
  </svg>
);

/* --------------------------------------------------------------- poster -- */


/* ------------------------------------------------------------- variant --- */

export default function Variant({ section, sections, allMovies, facets, chrome }: BrowseData) {
  const [scope, setScope] = useState<Scope>("section");
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("");
  const [year, setYear] = useState("");
  const [minRating, setMinRating] = useState("");
  const [sort, setSort] = useState<SortKey>("rating");
  const [page, setPage] = useState(1);
  const [saved, setSaved] = useState<Set<string>>(() => new Set<string>());
  const [searchOpen, setSearchOpen] = useState(false);

  // --- hover popover, identical to the catalog's ---
  const router = useRouter();
  const [hoveredMovie, setHoveredMovie] = useState<Movie | null>(null);
  const [popoverPos, setPopoverPos] = useState<{
    top: number;
    left: number;
    alignRight: boolean;
    height: number;
  } | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleCardMouseEnter = (movie: Movie, e: React.MouseEvent) => {
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
    setHoveredMovie(movie);
  };

  // Grace period so crossing the gap into the popover does not dismiss it.
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

  // Switching category only changes ?section=, so Next keeps this component
  // mounted and the old filters would carry over — landing the user in an
  // empty state under a heading they just clicked. Adjusting state during
  // render (React's documented alternative to a reset effect) clears them
  // before anything paints. The watchlist is the user's, so it survives.
  const [lastSectionId, setLastSectionId] = useState(section.id);
  if (lastSectionId !== section.id) {
    setLastSectionId(section.id);
    setScope("section");
    setQuery("");
    setGenre("");
    setYear("");
    setMinRating("");
    setSort("rating");
    setPage(1);
  }

  const pool = scope === "all" ? allMovies : section.movies;
  const trimmed = query.trim();

  const filtered = useMemo(() => {
    const q = trimmed.toLowerCase();
    const floor = minRating ? Number.parseFloat(minRating) : 0;

    const list = pool.filter((m) => {
      if (q && !m.title.toLowerCase().includes(q) && !(m.subtitle ?? "").toLowerCase().includes(q)) {
        return false;
      }
      if (genre && !m.genres.includes(genre)) return false;
      if (year && m.year !== year) return false;
      if (floor > 0 && ratingOf(m) < floor) return false;
      return true;
    });

    list.sort((a, b) => {
      switch (sort) {
        case "newest":
          return yearOf(b) - yearOf(a) || ratingOf(b) - ratingOf(a);
        case "oldest":
          return yearOf(a) - yearOf(b) || a.title.localeCompare(b.title);
        case "az":
          return a.title.localeCompare(b.title);
        default:
          return ratingOf(b) - ratingOf(a) || a.title.localeCompare(b.title);
      }
    });

    return list;
  }, [pool, trimmed, genre, year, minRating, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  // Clamped rather than reset in an effect: a filter change that shrinks the
  // result set can never strand the user on an empty page.
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);

  const pageWindow = useMemo(() => {
    const span = Math.min(5, totalPages);
    const last = Math.min(totalPages, Math.max(safePage + 2, span));
    const first = Math.max(1, last - span + 1);
    const out: number[] = [];
    for (let i = first; i <= last; i += 1) out.push(i);
    return out;
  }, [safePage, totalPages]);

  const sortLabel = SORTS.find((s) => s.key === sort)?.label ?? SORTS[0].label;
  const filtersActive = Boolean(trimmed || genre || year || minRating);
  const isDirty = filtersActive || sort !== "rating";

  const chips: { id: string; label: string; value: string; onClear: () => void }[] = [];
  if (trimmed) {
    chips.push({ id: "q", label: "Search", value: trimmed, onClear: () => { setQuery(""); setPage(1); } });
  }
  if (genre) {
    chips.push({ id: "genre", label: "Genre", value: genre, onClear: () => { setGenre(""); setPage(1); } });
  }
  if (year) {
    chips.push({ id: "year", label: "Year", value: year, onClear: () => { setYear(""); setPage(1); } });
  }
  if (minRating) {
    chips.push({
      id: "rating",
      label: "Rating",
      value: `${Number.parseFloat(minRating).toFixed(1)}+`,
      onClear: () => { setMinRating(""); setPage(1); },
    });
  }
  // Sort is an active control, so it earns a chip — but it can never remove a
  // title from the result set, so the empty state must not blame it.
  const filterChips = [...chips];
  if (sort !== "rating") {
    chips.push({ id: "sort", label: "Sort", value: sortLabel, onClear: () => { setSort("rating"); setPage(1); } });
  }

  function resetAll() {
    setQuery("");
    setGenre("");
    setYear("");
    setMinRating("");
    setSort("rating");
    setPage(1);
  }

  function changeScope(next: Scope) {
    setScope(next);
    setPage(1);
  }

  function toggleSaved(id: string) {
    if (!isDemoSignedIn()) {
      router.push(getSignupHref());
      return;
    }

    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const shownFrom = filtered.length === 0 ? 0 : start + 1;
  const shownTo = start + visible.length;

  return (
    <div className={styles.page}>
      {/* ------------------------------------------------------ top bar -- */}
      <header className={styles.topbar}>
        <div className={styles.topbarInner}>
          <Link href={chrome.brand.homeHref} className={styles.brandLink}>
            {/* Decorative: the wordmark beside it carries the accessible name. */}
            <img src={chrome.brand.mark} alt="" className={styles.brandMark} />
            <img src={chrome.brand.wordmark} alt={chrome.brand.wordmarkAlt} className={styles.brandWordmark} />
          </Link>

          <div className={styles.topbarMeta}>
            <button
              type="button"
              className={styles.topbarSearch}
              aria-label={chrome.watch.search}
              onClick={() => setSearchOpen(true)}
            >
              {IconSearch}
            </button>

            <ProfileMenu ariaLabel={chrome.watch.profile} variant="control" />
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.pageBackRow}>
          <Link href="/watch" className={styles.pageBackLink}>
            <span className={styles.backIcon}>{IconArrowLeft}</span>
            {chrome.detail.goBack}
          </Link>
        </div>

        {/* ------------------------------------------------ category banner -- */}
        {/* Just the category title now — the breadcrumb, decorative slash, tint
            wash and stats line were all removed for a simpler header. */}
        <section className={styles.banner} aria-labelledby="v1-category-title">

          <h1 id="v1-category-title" className={styles.bannerTitle}>
            {section.title}
          </h1>
        </section>

        {/* ------------------------------------------------------- rail -- */}
        <nav className={styles.rail} aria-label="Categories">
          <span className={styles.railLabel}>Categories</span>
          <ul className={styles.railList}>
            {sections.map((s) => {
              const current = s.id === section.id;
              return (
                <li key={s.id}>
                  <Link
                    href={`/browse/${s.id}`}
                    className={`${styles.railItem} ${current ? styles.railItemActive : ""}`}
                    style={{ "--rail-accent": s.accent } as React.CSSProperties}
                    aria-current={current ? "page" : undefined}
                  >
                    {s.title}
                    <span className={styles.railCount}>{s.movies.length}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* ---------------------------------------------------- console -- */}
        <section className={styles.console} aria-label="Filters">
          <div className={styles.controls}>
            <div className={`${styles.field} ${styles.fieldWide}`}>
              <label className={styles.srOnly} htmlFor="v1-search">
                {chrome.watch.search} titles
              </label>
              <div className={styles.searchWrap}>
                <span className={styles.searchIcon}>{IconSearch}</span>
                <input
                  id="v1-search"
                  type="search"
                  className={styles.searchInput}
                  placeholder="Title or subtitle…"
                  value={query}
                  autoComplete="off"
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(1);
                  }}
                />
                {query && (
                  <button
                    type="button"
                    className={styles.clearSearch}
                    aria-label="Clear search"
                    onClick={() => {
                      setQuery("");
                      setPage(1);
                    }}
                  >
                    {IconClose}
                  </button>
                )}
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="v1-genre">
                Genre
              </label>
              <div className={styles.selectWrap}>
                <select
                  id="v1-genre"
                  className={styles.select}
                  value={genre}
                  onChange={(e) => {
                    setGenre(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">All genres</option>
                  {facets.genres.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
                <span className={styles.selectChevron}>{IconChevron}</span>
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="v1-year">
                Year
              </label>
              <div className={styles.selectWrap}>
                <select
                  id="v1-year"
                  className={styles.select}
                  value={year}
                  onChange={(e) => {
                    setYear(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">Any year</option>
                  {facets.years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
                <span className={styles.selectChevron}>{IconChevron}</span>
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="v1-rating">
                Rating
              </label>
              <div className={styles.selectWrap}>
                <select
                  id="v1-rating"
                  className={styles.select}
                  value={minRating}
                  onChange={(e) => {
                    setMinRating(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">Any rating</option>
                  {RATING_TIERS.map((tier) => (
                    <option key={tier.value} value={tier.value}>
                      {tier.label}
                    </option>
                  ))}
                </select>
                <span className={styles.selectChevron}>{IconChevron}</span>
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="v1-sort">
                Sort
              </label>
              <div className={styles.selectWrap}>
                <select
                  id="v1-sort"
                  className={styles.select}
                  value={sort}
                  onChange={(e) => {
                    setSort(e.target.value as SortKey);
                    setPage(1);
                  }}
                >
                  {SORTS.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <span className={styles.selectChevron}>{IconChevron}</span>
              </div>
            </div>
          </div>

          <div className={styles.status}>
            <p className={styles.readout} aria-live="polite">
              <span className={styles.readoutNum}>{filtered.length}</span>
              <span className={styles.readoutLabel}>
                {filtered.length === 1 ? "title" : "titles"} in{" "}
                <span className={styles.readoutScope}>
                  {scope === "all" ? "the full catalog" : section.title}
                </span>
              </span>
            </p>

            <div className={styles.statusActions}>
              {/* Scope pair: outer edges vertical, facing edges cut at the
                  logo's 18.43deg so the gap reads as one continuous diagonal. */}
              <div className={styles.scopeGroup} role="group" aria-label="Search scope">
                <button
                  type="button"
                  className={`${styles.scopeBtn} ${styles.scopeLead} ${scope === "section" ? styles.scopeOn : ""}`}
                  aria-pressed={scope === "section"}
                  onClick={() => changeScope("section")}
                >
                  This category
                </button>
                <button
                  type="button"
                  className={`${styles.scopeBtn} ${styles.scopeTrail} ${scope === "all" ? styles.scopeOn : ""}`}
                  aria-pressed={scope === "all"}
                  onClick={() => changeScope("all")}
                >
                  All titles
                </button>
              </div>

            </div>
          </div>

          {chips.length > 0 && (
            <div className={styles.chipRow}>
              <span className={styles.chipRowLabel}>Active</span>
              <ul className={styles.chipList}>
                {chips.map((chip) => (
                  <li key={chip.id}>
                    <button type="button" className={styles.chip} onClick={chip.onClear}>
                      <span className={styles.chipKey}>{chip.label}</span>
                      <span className={styles.chipVal}>{chip.value}</span>
                      <span className={styles.chipClose} aria-hidden="true">
                        {IconClose}
                      </span>
                      <span className={styles.srOnly}>— remove filter</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* ------------------------------------------------------- grid --
            One box size everywhere: landscape categories no longer get a wider
            track, so a card is identical here and on the catalog. */}
        {visible.length > 0 ? (
          <ul className={styles.grid}>
            {visible.map((movie) => {
              const isSaved = saved.has(movie.id);
              return (
                <li key={movie.id} className={styles.card}>
                  <div
                    className={watchStyles.posterCard}
                    onMouseEnter={(e) => handleCardMouseEnter(movie, e)}
                    onMouseLeave={handleCardMouseLeave}
                    onClick={() => router.push(`/watch/${movie.id}`)}
                  >
                    <div className={watchStyles.posterWrapper}>
                      <img
                        src={movie.image}
                        alt={movie.title}
                        loading="lazy"
                        className={watchStyles.posterImg}
                      />

                      <button
                        className={`${watchStyles.bookmarkBtn} ${isSaved ? watchStyles.bookmarkActive : ""}`}
                        aria-label={`${chrome.watch.saveToList}: ${movie.title}`}
                        aria-pressed={isSaved}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSaved(movie.id);
                        }}
                      >
                        <svg viewBox="0 0 24 24" width="15" height="15" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                        </svg>
                      </button>

                      <div className={watchStyles.ratingBadge}>
                        <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                        <span>{movie.rating || "—"}</span>
                      </div>

                      <div className={watchStyles.posterOverlay}>
                        <div className={watchStyles.playBtnCircle}>
                          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>

                      <div className={watchStyles.posterHoverInfo}>
                        <h4 className={watchStyles.posterTitle}>{movie.title}</h4>
                        <span className={watchStyles.metaYear}>{movie.year}</span>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className={styles.empty}>
            <span className={styles.emptyMark} aria-hidden="true" />
            <h2 className={styles.emptyTitle}>Nothing matches this combination</h2>
            <p className={styles.emptyText}>
              {filterChips.length > 0 ? (
                <>
                  No titles in{" "}
                  <strong className={styles.emptyStrong}>
                    {scope === "all" ? "the full catalog" : section.title}
                  </strong>{" "}
                  satisfy {filterChips.map((c) => `${c.label.toLowerCase()} ${c.value}`).join(", ")}.
                </>
              ) : scope === "all" ? (
                <>The catalog has no titles to show yet.</>
              ) : (
                <>This category has no titles to show yet.</>
              )}
            </p>
            <div className={styles.emptyActions}>
              <button type="button" className={styles.emptyBtn} onClick={resetAll} disabled={!isDirty}>
                Clear all filters
              </button>
              {scope === "section" && (
                <button type="button" className={styles.emptyGhost} onClick={() => changeScope("all")}>
                  Search all {allMovies.length} titles instead
                </button>
              )}
            </div>
          </div>
        )}

        {/* -------------------------------------------------- pagination -- */}
        {filtered.length > 0 && (
          <div className={styles.pager}>
            <p className={styles.pagerInfo}>
              Showing <strong className={styles.pagerStrong}>{shownFrom}</strong>–
              <strong className={styles.pagerStrong}>{shownTo}</strong> of {filtered.length}
            </p>

            {totalPages > 1 ? (
              <nav className={styles.pagerNav} aria-label="Pagination">
                <button
                  type="button"
                  className={styles.pagerEdge}
                  onClick={() => setPage(1)}
                  disabled={safePage === 1}
                  aria-label="First page"
                >
                  ‹‹
                </button>
                <button
                  type="button"
                  className={styles.pagerEdge}
                  onClick={() => setPage(Math.max(1, safePage - 1))}
                  disabled={safePage === 1}
                  aria-label="Previous page"
                >
                  ‹
                </button>

                {pageWindow[0] > 1 && <span className={styles.pagerGap}>…</span>}

                {pageWindow.map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`${styles.pagerNum} ${n === safePage ? styles.pagerNumOn : ""}`}
                    aria-current={n === safePage ? "page" : undefined}
                    onClick={() => setPage(n)}
                  >
                    {n}
                  </button>
                ))}

                {pageWindow[pageWindow.length - 1] < totalPages && <span className={styles.pagerGap}>…</span>}

                <button
                  type="button"
                  className={styles.pagerEdge}
                  onClick={() => setPage(Math.min(totalPages, safePage + 1))}
                  disabled={safePage === totalPages}
                  aria-label="Next page"
                >
                  ›
                </button>
                <button
                  type="button"
                  className={styles.pagerEdge}
                  onClick={() => setPage(totalPages)}
                  disabled={safePage === totalPages}
                  aria-label="Last page"
                >
                  ››
                </button>
              </nav>
            ) : (
              <p className={styles.pagerSolo}>
                One page.{" "}
                {scope === "section" && (
                  <button type="button" className={styles.pagerSoloBtn} onClick={() => changeScope("all")}>
                    Browse all {allMovies.length} titles
                  </button>
                )}
              </p>
            )}
          </div>
        )}
      </main>

      {/* The site footer, shared with the catalog and the detail page. */}
      <SiteFooter brand={chrome.brand} footer={chrome.footer} />

      <SearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        movies={allMovies}
        placeholder={`${chrome.watch.search} titles…`}
      />

      {/* Floating detail popover, same as the catalog's. Positioned in document
          coordinates, so it is a direct child of .page — the positioned
          ancestor it resolves against. */}
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
                <span className={watchStyles.popoverTypeBadge}>{chrome.popover.typeBadge}</span>
                <span className={watchStyles.popoverRatingInline}>★ {hoveredMovie.rating}</span>
                <span className={watchStyles.popoverYearInline}>📅 {hoveredMovie.year}</span>
                <span className={watchStyles.popoverLangInline}>{chrome.popover.languageBadge}</span>
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
                <span>{chrome.popover.watchNow}</span>
              </button>

              <button
                className={`${watchStyles.popoverPlusBtn} ${saved.has(hoveredMovie.id) ? watchStyles.popoverPlusActive : ""}`}
                onClick={() => toggleSaved(hoveredMovie.id)}
                aria-label={chrome.popover.addToWatchlist}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  {saved.has(hoveredMovie.id) ? (
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
