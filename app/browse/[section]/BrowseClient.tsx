"use client";

// "Control Room".
//
// A dense dark instrument panel: hairline-divided filter cells, a live result
// readout, dismissible chips, a tight poster grid. Every control is real:
// filtering, sorting, scope and pagination are all derived client-side from
// the props below.
//
// Deliberately near-monochrome. The category accent is spent only on the
// active rail item, so a row still reads as colour-tagged without the page
// turning into a light show. Every other surface is ivory at low alpha, held
// above 4.5:1 against every surface it sits on.

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useMemo, useState } from "react";

import { cx } from "@/lib/cx";
import { getSignupHref, isDemoSignedIn } from "../../_auth/demo-auth";
import ProfileMenu from "../../_auth/ProfileMenu";
import type { BrowseData } from "../_lib/browse-data";
import type { Movie } from "@/lib/content-types";

import PosterCard from "../../watch/PosterCard";
import SearchOverlay from "../../watch/SearchOverlay";
import SiteFooter from "../../watch/SiteFooter";
import TitlePopover, { useTitlePopover } from "../../watch/TitlePopover";

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

/* ------------------------------------------------------------- styling -- */

const INK_2 = "text-[rgba(255,255,225,0.72)]";
const INK_3 = "text-[rgba(255,255,225,0.55)]";
const LINE = "border-[rgba(255,255,225,0.09)]";
const MONO = "font-(family-name:--mono)";

/* Micro-labels: monospace, tracked out, uppercase. */
const MICRO = `${MONO} uppercase ${INK_3}`;

/* A hairline-divided filter cell. `group/field` lets the chevron light up
   with the cell's focus ring. */
const FIELD = `group/field relative min-w-0 border ${LINE} bg-[#101010] px-[14px] pt-[9px] pb-[10px] transition-[background] duration-200 ease-[ease] focus-within:border-[rgba(255,255,225,0.24)] focus-within:bg-[#171717] focus-within:shadow-[inset_0_-2px_0_rgba(255,255,225,0.72)]`;
const FIELD_LABEL = `mb-1 block ${MICRO} text-[0.55rem] tracking-[0.16em]`;
const SELECT_WRAP = "relative flex h-6 items-center";
const SELECT =
  "h-6 w-full cursor-pointer appearance-none border-0 bg-transparent pr-5 text-[0.92rem] text-ellipsis text-ink [color-scheme:dark] focus:outline-none [&>option]:bg-[#101010] [&>option]:text-ink";
const CHEVRON = `pointer-events-none absolute right-0 inline-flex ${INK_3} transition-[color] duration-200 ease-[ease] group-focus-within/field:text-ink`;

/* Scope pair: outer edges vertical, facing edges cut at the logo's angle so
   the gap between them reads as a single continuous diagonal. See the slant
   utilities in globals.css. */
const SCOPE_BTN =
  "h-(--btn-h) cursor-pointer border-0 font-heading text-[0.62rem] font-bold tracking-[0.11em] whitespace-nowrap uppercase transition-[background,color] duration-200 ease-[ease] max-[480px]:min-w-0 max-[480px]:flex-[1_1_0]";
const SCOPE_OFF = `bg-[rgba(255,255,225,0.06)] ${INK_2} hover:bg-[rgba(255,255,225,0.12)] hover:text-ink`;
const SCOPE_ON = "bg-ink text-black hover:bg-ink hover:text-black";

const EMPTY_BTN =
  "h-10 cursor-pointer border px-5 font-heading text-[0.7rem] font-bold tracking-[0.11em] uppercase transition-[background,color,border-color] duration-200 ease-[ease]";

/* Pager cells stay above the 24px minimum target size at the narrow end. */
const PAGER_CELL =
  "h-[34px] min-w-[34px] cursor-pointer rounded-[2px] border px-[6px] font-heading text-[0.8rem] font-semibold tabular-nums transition-[color,border-color,background] duration-200 ease-[ease] max-[480px]:h-[30px] max-[480px]:min-w-7 max-[480px]:px-1 max-[380px]:min-w-[26px] max-[380px]:px-[3px]";
const PAGER_QUIET = `${LINE} bg-transparent ${INK_2}`;

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

/* ----------------------------------------------------------- component -- */

export default function BrowseClient({ section, sections, allMovies, facets, chrome }: BrowseData) {
  const [scope, setScope] = useState<Scope>("section");
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("");
  const [year, setYear] = useState("");
  const [minRating, setMinRating] = useState("");
  const [sort, setSort] = useState<SortKey>("rating");
  const [page, setPage] = useState(1);
  const [saved, setSaved] = useState<Set<string>>(() => new Set<string>());
  const [searchOpen, setSearchOpen] = useState(false);
  // Phone only: Genre/Year/Rating/Sort collapse behind a disclosure. Above
  // 640px the cells are always laid out and this is ignored.
  const [filtersOpen, setFiltersOpen] = useState(false);

  const router = useRouter();
  const popover = useTitlePopover();

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
  // What the collapsed disclosure is hiding, so the toggle can say so.
  // Search is excluded: it stays visible above the toggle.
  const hiddenFilterCount =
    [genre, year, minRating].filter(Boolean).length + (sort !== "rating" ? 1 : 0);
  // Cells are laid out normally on desktop; on a phone they follow the toggle.
  const filterCell = filtersOpen ? FIELD : `${FIELD} max-[640px]:hidden`;

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
    // Relative on purpose: the hover popover is positioned in document
    // coordinates and resolves against this element. The gutter narrows in
    // two steps on small screens.
    <div className="relative flex min-h-screen flex-col bg-black font-body text-ink [--gutter:48px] [--maxw:1480px] [--mono:ui-monospace,SFMono-Regular,'SF_Mono',Menlo,Consolas,monospace] max-[900px]:[--gutter:28px] max-[480px]:[--gutter:18px]">
      {/* ------------------------------------------------------ top bar -- */}
      <header className={cx("sticky top-0 z-40 border-b bg-[rgba(0,0,0,0.92)] backdrop-blur-[14px]", LINE)}>
        <div className="mx-auto flex h-[66px] max-w-(--maxw) items-center justify-between gap-5 px-(--gutter) max-[480px]:gap-3">
          {/* max-w-none on the images: preflight would let them shrink to fit
              a tight header instead of overflowing like the original. */}
          <Link href={chrome.brand.homeHref} className="inline-flex min-w-0 items-center gap-[9px] [&_img]:max-w-none">
            {/* Decorative: the wordmark beside it carries the accessible name. */}
            <img src={chrome.brand.mark} alt="" className="block h-[26px] w-auto max-[480px]:h-[22px]" />
            <img src={chrome.brand.wordmark} alt={chrome.brand.wordmarkAlt} className="block h-[17px] w-auto max-[480px]:h-[14px]" />
          </Link>

          <div className="mr-[max(0px,calc(100%-1190px))] flex min-w-0 items-center gap-4 max-[480px]:gap-3">
            <button
              type="button"
              className={cx("inline-flex size-[34px] cursor-pointer items-center justify-center rounded-[999px] border-0 bg-transparent p-0 no-underline transition-[color] duration-200 ease-[ease] hover:text-ink", INK_2)}
              aria-label={chrome.watch.search}
              onClick={() => setSearchOpen(true)}
            >
              {IconSearch}
            </button>

            <ProfileMenu ariaLabel={chrome.watch.profile} variant="control" />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-(--maxw) flex-1 px-(--gutter) pb-[132px]">
        <div className="w-[min(100%,1190px)] pt-[22px]">
          <Link
            href="/watch"
            className={cx("group/back inline-flex h-[34px] items-center gap-2 text-[0.76rem] font-semibold tracking-[0.02em] whitespace-nowrap transition-[color] duration-200 ease-[ease] hover:text-ink max-[480px]:gap-[6px]", INK_2)}
          >
            <span className="inline-flex transition-[transform] duration-200 ease-[ease] group-hover/back:[transform:translateX(-3px)] motion-reduce:transition-none">{IconArrowLeft}</span>
            {chrome.detail.goBack}
          </Link>
        </div>

        {/* ------------------------------------------------ category banner -- */}
        {/* Just the category title on a hairline divider. A long single-word
            category can be wider than a 320px column; break it rather than
            push the page into horizontal scroll. */}
        <section className={cx("border-b pt-4 pb-[26px] max-[640px]:pt-8", LINE)} aria-labelledby="v1-category-title">
          <h1 id="v1-category-title" className="m-0 font-heading text-[clamp(1.25rem,2.6vw,1.85rem)] leading-[1.05] font-extrabold tracking-[-0.01em] break-words text-ink normal-case">
            {section.title}
          </h1>
        </section>

        {/* ------------------------------------------------------- rail -- */}
        <nav className="flex items-center gap-[18px] pt-5 max-[760px]:flex-col max-[760px]:items-start max-[760px]:gap-[10px] max-[640px]:pt-4" aria-label="Categories">
          <span className={cx("flex-none text-[0.6rem] tracking-[0.18em] max-[640px]:hidden", MICRO)}>Categories</span>
          {/* Wrapping put four rows of chips above the console on a phone.
              Below 640px it is a single swipeable row instead — the bleed
              into the gutter is what signals there is more to the right. */}
          <ul className="flex min-w-0 list-none flex-wrap gap-x-[18px] gap-y-[6px] max-[640px]:-mx-(--gutter) max-[640px]:w-[calc(100%+2*var(--gutter))] max-[640px]:flex-nowrap max-[640px]:gap-x-4 max-[640px]:overflow-x-auto max-[640px]:px-(--gutter) max-[640px]:[scrollbar-width:none] max-[640px]:[&::-webkit-scrollbar]:hidden">
            {sections.map((s) => {
              const current = s.id === section.id;
              return (
                <li key={s.id}>
                  {/* The underline takes the category's accent; the count too
                      when active. */}
                  <Link
                    href={`/browse/${s.id}`}
                    className={cx(
                      "relative inline-flex min-h-8 items-center gap-[7px] border-0 px-px pt-0 pb-2 text-[0.74rem] whitespace-nowrap transition-[color] duration-200 ease-[ease] hover:text-ink after:absolute after:right-0 after:bottom-[2px] after:left-0 after:h-[2px] after:origin-center after:rounded-[999px] after:bg-(color:--rail-accent) after:transition-[opacity,transform] after:duration-200 after:ease-[ease] after:content-['']",
                      current
                        ? "font-extrabold text-ink after:opacity-100 after:[transform:scaleX(1)]"
                        : `font-semibold ${INK_2} after:opacity-0 after:[transform:scaleX(0.4)]`,
                    )}
                    style={{ "--rail-accent": s.accent } as React.CSSProperties}
                    aria-current={current ? "page" : undefined}
                  >
                    {s.title}
                    <span className={cx(MONO, "text-[0.6rem] tabular-nums", current ? "text-(color:--rail-accent)" : INK_3)}>{s.movies.length}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* ---------------------------------------------------- console -- */}
        <section className="mt-[26px] flex w-[min(100%,1190px)] flex-col gap-[10px]" aria-label="Filters">
          <div className="grid grid-cols-[1.7fr_1fr_1fr_1fr_1fr] gap-[10px] max-[1180px]:grid-cols-3 max-[640px]:grid-cols-2 max-[480px]:grid-cols-1">
            <div className={cx(FIELD, "max-[1180px]:col-span-full")}>
              <label className="sr-only" htmlFor="v1-search">
                {chrome.watch.search} titles
              </label>
              {/* The native clear affordance is replaced by the button below,
                  which matches the rest of the console instead of the
                  browser's chrome. */}
              <div className="flex h-6 items-center gap-[9px]">
                <span className={cx("inline-flex flex-none", INK_3)}>{IconSearch}</span>
                <input
                  id="v1-search"
                  type="search"
                  className="h-6 min-w-0 flex-1 border-0 bg-transparent text-[0.92rem] tracking-[-0.005em] text-ink placeholder:text-[rgba(255,255,225,0.5)] focus:outline-none [&::-webkit-search-cancel-button]:hidden"
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
                    className={cx("grid size-5 flex-none cursor-pointer place-items-center border-0 bg-[rgba(255,255,225,0.08)] transition-[background,color] duration-200 ease-[ease] hover:bg-[#fc3343] hover:text-ink", INK_2)}
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

            {/* Phone only. Four stacked cells put ~330px of chrome between the
                category title and the first poster, so Genre, Year, Rating and
                Sort fold away behind this. Search stays out in the open, being
                the control people reach for first. */}
            <button
              type="button"
              className={cx(
                "col-span-full hidden h-[42px] cursor-pointer items-center justify-between border bg-[#101010] px-[14px] text-[0.62rem] font-bold tracking-[0.16em] uppercase transition-[background] duration-200 ease-[ease] hover:bg-[#171717] max-[640px]:flex",
                LINE,
                MICRO,
              )}
              aria-expanded={filtersOpen}
              onClick={() => setFiltersOpen((open) => !open)}
            >
              <span className="inline-flex items-center gap-2">
                Filters
                {/* Says what is folded away, so a narrowed result set is never
                    a mystery. */}
                {hiddenFilterCount > 0 && (
                  <span className="grid h-[17px] min-w-[17px] place-items-center rounded-[999px] bg-[#fc3343] px-[5px] text-[0.6rem] leading-none font-bold text-ink tabular-nums">
                    {hiddenFilterCount}
                  </span>
                )}
              </span>
              <span
                className={cx(
                  "inline-flex transition-[transform] duration-200 ease-[ease] motion-reduce:transition-none",
                  filtersOpen && "[transform:rotate(180deg)]",
                )}
              >
                {IconChevron}
              </span>
            </button>

            <div className={filterCell}>
              <label className={FIELD_LABEL} htmlFor="v1-genre">
                Genre
              </label>
              <div className={SELECT_WRAP}>
                <select
                  id="v1-genre"
                  className={SELECT}
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
                <span className={CHEVRON}>{IconChevron}</span>
              </div>
            </div>

            <div className={filterCell}>
              <label className={FIELD_LABEL} htmlFor="v1-year">
                Year
              </label>
              <div className={SELECT_WRAP}>
                <select
                  id="v1-year"
                  className={SELECT}
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
                <span className={CHEVRON}>{IconChevron}</span>
              </div>
            </div>

            <div className={filterCell}>
              <label className={FIELD_LABEL} htmlFor="v1-rating">
                Rating
              </label>
              <div className={SELECT_WRAP}>
                <select
                  id="v1-rating"
                  className={SELECT}
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
                <span className={CHEVRON}>{IconChevron}</span>
              </div>
            </div>

            <div className={filterCell}>
              <label className={FIELD_LABEL} htmlFor="v1-sort">
                Sort
              </label>
              <div className={SELECT_WRAP}>
                <select
                  id="v1-sort"
                  className={SELECT}
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
                <span className={CHEVRON}>{IconChevron}</span>
              </div>
            </div>
          </div>

          <div className={cx("flex flex-wrap items-center justify-between gap-[18px] border bg-[#171717] px-[14px] py-2 max-[760px]:flex-col max-[760px]:items-stretch", LINE)}>
            <p className="flex min-w-0 items-baseline gap-[9px]" aria-live="polite">
              <span className="font-heading text-[1.22rem] leading-none font-extrabold tracking-[-0.02em] text-ink tabular-nums">{filtered.length}</span>
              <span className={cx("text-[0.76rem]", INK_2)}>
                {filtered.length === 1 ? "title" : "titles"} in{" "}
                <span className="font-semibold text-ink">
                  {scope === "all" ? "the full catalog" : section.title}
                </span>
              </span>
            </p>

            <div className="flex items-center gap-[14px] max-[760px]:flex-wrap max-[760px]:justify-between max-[480px]:gap-2">
              <div className="flex gap-[5px] [--btn-h:30px] [--slant:calc(var(--btn-h)/3)] max-[480px]:min-w-0 max-[480px]:flex-[1_1_auto]" role="group" aria-label="Search scope">
                {/* Padded by the slant on the cut side so the label stays
                    optically centred. */}
                <button
                  type="button"
                  className={cx(SCOPE_BTN, "pr-[calc(12px+var(--slant))] pl-3 slant-lead max-[480px]:pr-[calc(10px+var(--slant))] max-[480px]:pl-[10px]", scope === "section" ? SCOPE_ON : SCOPE_OFF)}
                  aria-pressed={scope === "section"}
                  onClick={() => changeScope("section")}
                >
                  This category
                </button>
                <button
                  type="button"
                  className={cx(SCOPE_BTN, "pr-3 pl-[calc(12px+var(--slant))] slant-trail max-[480px]:pr-[10px] max-[480px]:pl-[calc(10px+var(--slant))]", scope === "all" ? SCOPE_ON : SCOPE_OFF)}
                  aria-pressed={scope === "all"}
                  onClick={() => changeScope("all")}
                >
                  All titles
                </button>
              </div>

            </div>
          </div>

          {chips.length > 0 && (
            <div className={cx("flex flex-wrap items-center gap-3 border bg-[#101010] px-4 py-[11px]", LINE)}>
              <span className={cx("text-[0.58rem] tracking-[0.16em]", MICRO)}>Active</span>
              <ul className="flex min-w-0 list-none flex-wrap gap-[7px]">
                {chips.map((chip) => (
                  <li key={chip.id}>
                    <button
                      type="button"
                      className="group/chip inline-flex h-[27px] max-w-full cursor-pointer items-center gap-[7px] border border-[rgba(255,255,225,0.2)] bg-[rgba(255,255,225,0.05)] px-[9px] text-[0.74rem] text-ink transition-[border-color,background] duration-200 ease-[ease] hover:border-[rgba(255,255,225,0.34)] hover:bg-[rgba(255,255,225,0.1)]"
                      onClick={chip.onClear}
                    >
                      <span className={cx("text-[0.56rem] tracking-[0.14em]", MICRO)}>{chip.label}</span>
                      <span className="max-w-[18ch] truncate font-semibold">{chip.value}</span>
                      <span className={cx("inline-flex transition-[color] duration-200 ease-[ease] group-hover/chip:text-[#fc3343]", INK_3)} aria-hidden="true">
                        {IconClose}
                      </span>
                      <span className="sr-only">— remove filter</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* ------------------------------------------------------- grid --
            Fixed 190px tracks, not minmax(...,1fr): a fr track stretches the
            card to fill the row, which made these boxes noticeably larger than
            the catalog's. 190px and the 10px column gap are the card's own
            values, so a box is the same size on every page. Left-aligned so
            the first column lands on the page gutter. Below 640px a fixed
            track would leave a lone column with a big hole beside it, so there
            the cards do fill the row — two up on a phone. */}
        {visible.length > 0 ? (
          <ul className="mt-[30px] grid list-none grid-cols-[repeat(auto-fill,190px)] gap-x-[10px] gap-y-[26px] [justify-content:start] max-[640px]:grid-cols-[repeat(auto-fill,minmax(144px,1fr))] max-[640px]:gap-x-3 max-[640px]:gap-y-[22px]">
            {visible.map((movie) => (
              <li
                key={movie.id}
                className="flex min-w-0 flex-col gap-[10px] transition-[transform] duration-280 ease-[cubic-bezier(0.22,1,0.36,1)] hover:[transform:translateY(-4px)] motion-reduce:transition-none motion-reduce:hover:[transform:none]"
              >
                <PosterCard
                  movie={movie}
                  saved={saved.has(movie.id)}
                  saveLabel={`${chrome.watch.saveToList}: ${movie.title}`}
                  onToggleSave={() => toggleSaved(movie.id)}
                  {...popover.cardProps(movie)}
                />
              </li>
            ))}
          </ul>
        ) : (
          <div className={cx("mt-[30px] border border-dashed bg-[image:linear-gradient(180deg,rgba(255,255,225,0.02),transparent_60%)] px-8 py-[70px] text-center max-[640px]:px-5 max-[640px]:py-[52px]", LINE)}>
            {/* Same 1:3 slash as the logo, scaled down — the page's one motif. */}
            <span
              className="mx-auto mb-[22px] block h-(--rule-h) w-[calc(var(--rule-run)+7px)] bg-[rgba(255,255,225,0.34)] [--rule-h:44px] [--rule-run:calc(var(--rule-h)/3)] [clip-path:polygon(var(--rule-run)_0,100%_0,7px_100%,0_100%)]"
              aria-hidden="true"
            />
            <h2 className="font-heading text-[1.25rem] font-bold tracking-[-0.015em] text-ink">Nothing matches this combination</h2>
            <p className={cx("mx-auto mt-3 max-w-[48ch] text-[0.86rem] leading-[1.65]", INK_2)}>
              {filterChips.length > 0 ? (
                <>
                  No titles in{" "}
                  <strong className="font-semibold text-ink">
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
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                className={cx(
                  EMPTY_BTN,
                  "border-[rgba(252,51,67,0.35)] bg-[rgba(252,51,67,0.1)] text-[#ff8d96] hover:enabled:border-[#fc3343] hover:enabled:bg-[#fc3343] hover:enabled:text-ink disabled:cursor-default disabled:border-[rgba(255,255,225,0.09)] disabled:bg-transparent disabled:text-[rgba(255,255,225,0.55)]",
                )}
                onClick={resetAll}
                disabled={!isDirty}
              >
                Clear all filters
              </button>
              {scope === "section" && (
                <button
                  type="button"
                  className={cx(EMPTY_BTN, LINE, "bg-transparent hover:border-[rgba(255,255,225,0.34)] hover:text-ink", INK_2)}
                  onClick={() => changeScope("all")}
                >
                  Search all {allMovies.length} titles instead
                </button>
              )}
            </div>
          </div>
        )}

        {/* -------------------------------------------------- pagination -- */}
        {filtered.length > 0 && (
          <div className={cx("mt-[38px] flex w-[min(100%,1190px)] flex-wrap items-center justify-between gap-4 border-t pt-5 max-[480px]:justify-center", LINE)}>
            <p className={cx("text-[0.78rem] tabular-nums", INK_3)}>
              Showing <strong className="font-bold text-ink">{shownFrom}</strong>–
              <strong className="font-bold text-ink">{shownTo}</strong> of {filtered.length}
            </p>

            {totalPages > 1 ? (
              /* Tighter cells at the narrow end so the widest pager — both
                 ellipses showing — fits a 284px column without orphaning the
                 last-page control. */
              <nav className="flex items-center gap-[5px] max-[480px]:flex-wrap max-[480px]:justify-center max-[480px]:gap-[3px] max-[380px]:gap-[2px]" aria-label="Pagination">
                <button
                  type="button"
                  className={cx(PAGER_CELL, PAGER_QUIET, "hover:enabled:border-[rgba(255,255,225,0.2)] hover:enabled:text-ink disabled:cursor-default disabled:opacity-30")}
                  onClick={() => setPage(1)}
                  disabled={safePage === 1}
                  aria-label="First page"
                >
                  ‹‹
                </button>
                <button
                  type="button"
                  className={cx(PAGER_CELL, PAGER_QUIET, "hover:enabled:border-[rgba(255,255,225,0.2)] hover:enabled:text-ink disabled:cursor-default disabled:opacity-30")}
                  onClick={() => setPage(Math.max(1, safePage - 1))}
                  disabled={safePage === 1}
                  aria-label="Previous page"
                >
                  ‹
                </button>

                {pageWindow[0] > 1 && <span className={cx("px-[2px] select-none max-[380px]:px-0", INK_3)}>…</span>}

                {pageWindow.map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={cx(
                      PAGER_CELL,
                      n === safePage
                        ? "border-ink bg-ink font-extrabold text-black"
                        : cx(PAGER_QUIET, "hover:border-[rgba(255,255,225,0.2)] hover:text-ink"),
                    )}
                    aria-current={n === safePage ? "page" : undefined}
                    onClick={() => setPage(n)}
                  >
                    {n}
                  </button>
                ))}

                {pageWindow[pageWindow.length - 1] < totalPages && <span className={cx("px-[2px] select-none max-[380px]:px-0", INK_3)}>…</span>}

                <button
                  type="button"
                  className={cx(PAGER_CELL, PAGER_QUIET, "hover:enabled:border-[rgba(255,255,225,0.2)] hover:enabled:text-ink disabled:cursor-default disabled:opacity-30")}
                  onClick={() => setPage(Math.min(totalPages, safePage + 1))}
                  disabled={safePage === totalPages}
                  aria-label="Next page"
                >
                  ›
                </button>
                <button
                  type="button"
                  className={cx(PAGER_CELL, PAGER_QUIET, "hover:enabled:border-[rgba(255,255,225,0.2)] hover:enabled:text-ink disabled:cursor-default disabled:opacity-30")}
                  onClick={() => setPage(totalPages)}
                  disabled={safePage === totalPages}
                  aria-label="Last page"
                >
                  ››
                </button>
              </nav>
            ) : (
              <p className={cx("text-[0.78rem]", INK_3)}>
                One page.{" "}
                {scope === "section" && (
                  <button
                    type="button"
                    className="cursor-pointer border-0 bg-transparent p-0 text-ink underline decoration-1 underline-offset-[3px] hover:text-ink"
                    onClick={() => changeScope("all")}
                  >
                    Browse all {allMovies.length} titles
                  </button>
                )}
              </p>
            )}
          </div>
        )}
      </main>

      <SiteFooter brand={chrome.brand} footer={chrome.footer} />

      <SearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        movies={allMovies}
        placeholder={`${chrome.watch.search} titles…`}
      />

      {popover.movie && popover.position && (
        <TitlePopover
          movie={popover.movie}
          position={popover.position}
          labels={chrome.popover}
          saved={saved.has(popover.movie.id)}
          onToggleSave={() => toggleSaved(popover.movie!.id)}
          onWatch={() => router.push(`/watch/${popover.movie!.id}`)}
          {...popover.popoverProps}
        />
      )}
    </div>
  );
}
