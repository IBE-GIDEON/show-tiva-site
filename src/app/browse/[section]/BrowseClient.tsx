"use client";

// v1 — "Control Room".
//
// The reference screenshot's older sibling: same information architecture
// (search, filter row, result count, poster grid, pagination) executed as a
// dense instrument panel rather than a strip of grey pills. Every control is
// real: filtering, sorting, scope and pagination are all derived client-side
// from the props below.

import Link from "next/link";
import { Fragment, useMemo, useState } from "react";

import type { BrowseData } from "../_lib/browse-data";
import type { Movie } from "@/lib/content-types";

import styles from "./browse.module.css";

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

/**
 * Splits a hex accent into "r, g, b" so the stylesheet can build tints with
 * rgba() — cheaper and better supported than color-mix, and it keeps every
 * accent-derived surface tied to the one value the category owns.
 */
function accentChannels(hex: string): string {
  const raw = hex.trim().replace("#", "");
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;
  const n = Number.parseInt(full, 16);
  if (full.length !== 6 || Number.isNaN(n)) return "252, 51, 67";
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

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

const IconStar = (
  <svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor" aria-hidden="true">
    <path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3-5.8 3 1.1-6.5L2.6 9.4l6.5-.9z" />
  </svg>
);

const IconArrowLeft = (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="11 18 5 12 11 6" />
  </svg>
);

const SOCIAL_ICONS: Record<string, React.ReactNode> = {
  twitter: (
    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
  ),
  instagram: (
    <>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </>
  ),
  youtube: (
    <>
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
      <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" />
    </>
  ),
};

/** Icons are never rendered from stored strings — an unknown platform falls
 *  back to a generic link glyph, matching SiteFooter's policy. */
const GENERIC_SOCIAL = (
  <>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </>
);

/* --------------------------------------------------------------- poster -- */

/**
 * Artwork is remote (Unsplash), so each frame holds a skeleton until the image
 * decodes. Cards are keyed by movie id, so paging remounts these and the
 * skeleton state resets with the new artwork.
 */
function Poster({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <>
      {!loaded && <span className={styles.posterSkeleton} aria-hidden="true" />}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={`${styles.posterImg} ${loaded ? styles.posterImgReady : ""}`}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
      />
    </>
  );
}

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

  const accentRgb = useMemo(() => accentChannels(section.accent), [section.accent]);
  const landscape = section.aspect === "landscape";
  const pool = scope === "all" ? allMovies : section.movies;
  const trimmed = query.trim();

  /** Summary of the category itself — independent of the live filters, so the
   *  banner keeps reading as a description of where you are. */
  const summary = useMemo(() => {
    const movies = section.movies;
    if (movies.length === 0) return { avg: "—", from: "", to: "" };
    const avg = movies.reduce((sum, m) => sum + ratingOf(m), 0) / movies.length;
    const years = movies.map(yearOf).filter((y) => y > 0);
    return {
      avg: avg.toFixed(1),
      from: years.length ? String(Math.min(...years)) : "",
      to: years.length ? String(Math.max(...years)) : "",
    };
  }, [section.movies]);

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
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const shellStyle = {
    "--accent": section.accent,
    "--accent-rgb": accentRgb,
  } as React.CSSProperties;

  const shownFrom = filtered.length === 0 ? 0 : start + 1;
  const shownTo = start + visible.length;

  return (
    <div className={styles.page} style={shellStyle}>
      {/* ------------------------------------------------------ top bar -- */}
      <header className={styles.topbar}>
        <div className={styles.topbarInner}>
          <Link href={chrome.brand.homeHref} className={styles.brandLink}>
            {/* Decorative: the wordmark beside it carries the accessible name. */}
            <img src={chrome.brand.mark} alt="" className={styles.brandMark} />
            <img src={chrome.brand.wordmark} alt={chrome.brand.wordmarkAlt} className={styles.brandWordmark} />
          </Link>

          <div className={styles.topbarMeta}>
            <span className={styles.topbarTag}>Browse</span>
            <span className={styles.topbarReadout}>
              <span className={styles.topbarReadoutLabel}>Watchlist</span>
              <span className={styles.topbarReadoutNum}>{String(saved.size).padStart(2, "0")}</span>
            </span>
            <Link href="/watch" className={styles.backLink}>
              <span className={styles.backIcon}>{IconArrowLeft}</span>
              {chrome.detail.goBack}
            </Link>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        {/* ------------------------------------------------ category banner -- */}
        <section className={styles.banner} aria-labelledby="v1-category-title">
          <span className={styles.bannerRule} aria-hidden="true" />
          <div className={styles.bannerBody}>
            <nav className={styles.bannerCrumb} aria-label="Breadcrumb">
              <Link href="/watch" className={styles.bannerCrumbLink}>
                Catalog
              </Link>
              <span className={styles.bannerCrumbSep} aria-hidden="true">
                /
              </span>
              <span className={styles.bannerCrumbNow}>{section.title}</span>
            </nav>

            <h1 id="v1-category-title" className={styles.bannerTitle}>
              {section.title}
            </h1>

            <p className={styles.bannerMeta}>
              <span className={styles.bannerMetaItem}>{section.movies.length} titles</span>
              {summary.from && (
                <>
                  <span className={styles.bannerDot} aria-hidden="true" />
                  <span className={styles.bannerMetaItem}>
                    {summary.from}
                    {summary.to !== summary.from ? `–${summary.to}` : ""}
                  </span>
                </>
              )}
              <span className={styles.bannerDot} aria-hidden="true" />
              <span className={styles.bannerMetaItem}>Avg rating {summary.avg}</span>
              <span className={styles.bannerDot} aria-hidden="true" />
              <span className={styles.bannerMetaItem}>{allMovies.length} in the catalog</span>
            </p>
          </div>
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
                    aria-current={current ? "page" : undefined}
                  >
                    <span className={styles.railDot} style={{ background: s.accent }} aria-hidden="true" />
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
              <label className={styles.fieldLabel} htmlFor="v1-search">
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

              <button type="button" className={styles.resetBtn} onClick={resetAll} disabled={!isDirty}>
                Reset
              </button>
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

        {/* ------------------------------------------------------- grid -- */}
        {visible.length > 0 ? (
          <ul className={`${styles.grid} ${landscape ? styles.gridWide : ""}`}>
            {visible.map((movie) => {
              const isSaved = saved.has(movie.id);
              // Built by filtering, so a missing field never leaves a dangling
              // separator dot. `type` is nullable in the store.
              const meta = [movie.year, movie.duration, movie.type || chrome.detail.typeFallback].filter(Boolean);
              return (
                <li key={movie.id} className={styles.card}>
                  <div className={styles.frame}>
                    <Link href={`/watch/${movie.id}`} className={styles.posterLink}>
                      <Poster src={movie.image} alt={movie.title} />
                      <span className={styles.posterScrim} aria-hidden="true" />
                    </Link>

                    <span className={styles.ratingBadge}>
                      <span className={styles.ratingStar}>{IconStar}</span>
                      <span className={styles.ratingValue}>{movie.rating || "—"}</span>
                    </span>

                    <button
                      type="button"
                      className={`${styles.bookmarkBtn} ${isSaved ? styles.bookmarkOn : ""}`}
                      aria-pressed={isSaved}
                      aria-label={`${chrome.watch.saveToList}: ${movie.title}`}
                      onClick={() => toggleSaved(movie.id)}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        width="14"
                        height="14"
                        fill={isSaved ? "currentColor" : "none"}
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                      </svg>
                    </button>
                  </div>

                  <div className={styles.cardBody}>
                    <Link href={`/watch/${movie.id}`} className={styles.cardTitle}>
                      {movie.title}
                    </Link>
                    <p className={styles.cardMeta}>
                      {meta.map((bit, i) => (
                        <Fragment key={`${i}-${bit}`}>
                          {i > 0 && <span className={styles.cardDot} aria-hidden="true" />}
                          <span>{bit}</span>
                        </Fragment>
                      ))}
                    </p>
                    {movie.genres.length > 0 && (
                      <p className={styles.cardGenres}>{movie.genres.slice(0, 2).join(" · ")}</p>
                    )}
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

      {/* -------------------------------------------------------- footer -- */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerTop}>
            <div className={styles.footerBrand}>
              <div className={styles.footerLogo}>
                <img src={chrome.brand.mark} alt="" className={styles.footerMark} />
                <img src={chrome.brand.wordmark} alt={chrome.brand.wordmarkAlt} className={styles.footerWordmark} />
              </div>
              <p className={styles.footerTagline}>{chrome.footer.tagline}</p>
            </div>

            <div className={styles.footerCols}>
              {chrome.footer.columns.map((column) => (
                <div key={column.title} className={styles.footerCol}>
                  <h2 className={styles.footerColTitle}>{column.title}</h2>
                  <ul className={styles.footerList}>
                    {column.links.map((link) => (
                      <li key={`${link.label}-${link.href}`}>
                        <a href={link.href} className={styles.footerLink}>
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.footerBottom}>
            <p className={styles.footerCopy}>
              &copy; {new Date().getFullYear()} {chrome.footer.copyright}
            </p>
            <div className={styles.footerSocials}>
              {chrome.footer.socials.map((social) => (
                <a key={social.platform} href={social.href} className={styles.footerSocial} aria-label={social.label}>
                  <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    {SOCIAL_ICONS[social.platform] ?? GENERIC_SOCIAL}
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
