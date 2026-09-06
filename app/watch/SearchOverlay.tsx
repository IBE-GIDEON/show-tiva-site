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
import styles from "./search-overlay.module.css";

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
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Search">
      {/* The blurred backdrop keeps the page visible behind it; a click closes. */}
      <button type="button" className={styles.backdrop} aria-label="Close search" onClick={onClose} />

      <div className={styles.panel}>
        <div className={styles.bar}>
          <span className={styles.barIcon} aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            ref={inputRef}
            type="search"
            className={styles.input}
            placeholder={placeholder}
            value={query}
            autoComplete="off"
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="button" className={styles.escBtn} onClick={onClose}>
            Esc
          </button>
        </div>

        {trimmed.length > 0 && (
          <div className={styles.body}>
            {results.length > 0 ? (
              <ul className={styles.results}>
                {results.map((m) => (
                  <li key={m.id}>
                    <Link href={`/watch/${m.id}`} className={styles.result} onClick={onClose}>
                      <span className={styles.thumb}>
                        <img src={m.image} alt="" loading="lazy" />
                      </span>
                      <span className={styles.resultText}>
                        <span className={styles.resultTitle}>{m.title}</span>
                        <span className={styles.resultMeta}>
                          {m.year}
                          {m.type ? ` · ${m.type}` : ""}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.empty}>No titles match &ldquo;{trimmed}&rdquo;.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
