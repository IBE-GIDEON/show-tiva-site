"use client";

// Global search, shared by the catalog, browse and detail pages.
//
// A search icon in each page's header opens this. It covers the viewport with
// a blurred backdrop — the page stays visible behind it — and a centred bar
// that filters the catalog live as you type. Picking a result goes to that
// title's page.
import { useEffect, useMemo, useRef, useState } from "react";

import Link from "next/link";

import type { Movie } from "@/lib/content-types";

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
  movies: Movie[];
  /** Placeholder text; falls back to a sensible default. */
  placeholder?: string;
}

const MAX_RESULTS = 18;

export default function SearchOverlay({
  open,
  onClose,
  movies,
  placeholder = "Search titles…",
}: SearchOverlayProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Clear the query each time the overlay opens, adjusting state during render
  // rather than in an effect (React's documented alternative to a reset effect).
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setQuery("");
  }

  // Focus the field once the overlay is open.
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 30);
    return () => clearTimeout(t);
  }, [open]);

  // Escape closes; lock body scroll so the page behind cannot scroll under it.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  const trimmed = query.trim();
  const results = useMemo(() => {
    const q = trimmed.toLowerCase();
    if (!q) return [];
    return movies
      .filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          (m.subtitle ?? "").toLowerCase().includes(q),
      )
      .slice(0, MAX_RESULTS);
  }, [trimmed, movies]);

  if (!open) return null;

  return (
    // The bar sits in the upper third, not dead centre — it reads as a search
    // field rather than a modal dialog.
    <div
      className="fixed inset-0 z-[1000] flex flex-col items-center px-[clamp(16px,5vw,40px)] pt-[clamp(12vh,16vh,22vh)] pb-10 max-[640px]:pt-[7vh] max-[640px]:pb-5"
      role="dialog"
      aria-modal="true"
      aria-label="Search"
    >
      {/* Keeps the page visible but blurred behind the search. A button, so a
          click anywhere off the panel closes it. */}
      <button
        type="button"
        className="fixed inset-0 animate-overlay-fade cursor-default bg-[rgba(0,0,0,0.45)] backdrop-blur-[16px] backdrop-saturate-90"
        aria-label="Close search"
        onClick={onClose}
      />

      <div className="relative z-[1] flex w-full max-w-[640px] animate-panel-in flex-col gap-[14px]">
        <div className="flex h-[60px] items-center gap-3 rounded-[4px] border border-[rgba(255,255,225,0.16)] bg-[rgba(20,20,20,0.82)] pr-3 pl-[18px] shadow-[0_24px_60px_rgba(0,0,0,0.6)]">
          <span className="inline-flex flex-none text-[rgba(255,255,225,0.55)]" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          {/* The native search decoration and clear button are hidden so the
              field stays clean. */}
          <input
            ref={inputRef}
            type="search"
            className="h-full min-w-0 flex-1 border-0 bg-transparent font-heading text-[1.15rem] font-medium tracking-[-0.01em] text-ink outline-none placeholder:text-[rgba(255,255,225,0.4)] [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
            placeholder={placeholder}
            value={query}
            autoComplete="off"
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="button"
            className="flex-none cursor-pointer rounded-[3px] border border-[rgba(255,255,225,0.16)] bg-transparent px-[9px] py-[5px] font-body text-[0.66rem] font-semibold tracking-[0.1em] text-[rgba(255,255,225,0.55)] uppercase transition-[color,border-color] duration-200 ease-[ease] hover:border-[rgba(255,255,225,0.34)] hover:text-ink pointer-coarse:grid pointer-coarse:size-11 pointer-coarse:place-items-center pointer-coarse:p-0"
            aria-label="Close search"
            onClick={onClose}
          >
            {/* Naming the Esc key is no help on a device that has none. */}
            <span className="pointer-coarse:hidden">Esc</span>
            <svg className="hidden pointer-coarse:block" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <line x1="5" y1="5" x2="19" y2="19" />
              <line x1="19" y1="5" x2="5" y2="19" />
            </svg>
          </button>
        </div>

        {trimmed.length > 0 && (
          <div className="max-h-[min(56vh,560px)] overflow-y-auto rounded-[4px] border border-[rgba(255,255,225,0.1)] bg-[rgba(14,14,14,0.82)] shadow-[0_24px_60px_rgba(0,0,0,0.55)]">
            {results.length > 0 ? (
              <ul className="m-0 flex list-none flex-col p-[6px]">
                {results.map((m) => (
                  <li key={m.id}>
                    <Link
                      href={`/watch/${m.id}`}
                      className="flex items-center gap-[14px] rounded-[3px] px-[10px] py-2 transition-[background] duration-150 ease-[ease] hover:bg-[rgba(255,255,225,0.06)]"
                      onClick={onClose}
                    >
                      <span className="h-[62px] w-11 flex-none overflow-hidden rounded-[2px] bg-[#131313]">
                        <img src={m.image} alt="" loading="lazy" className="block h-full w-full object-cover" />
                      </span>
                      <span className="flex min-w-0 flex-col gap-[3px]">
                        <span className="truncate font-heading text-[0.98rem] font-semibold tracking-[-0.01em] text-ink">{m.title}</span>
                        <span className="text-[0.78rem] text-[rgba(255,255,225,0.5)] tabular-nums">
                          {m.year}
                          {m.type ? ` · ${m.type}` : ""}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-[18px] py-[22px] text-center text-[0.92rem] text-[rgba(255,255,225,0.5)]">No titles match &ldquo;{trimmed}&rdquo;.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
