"use client";

// "Premium Minimal" detail page.
//
// Confident restraint: near-black, near-white, one mid-grey, and a single
// accent that appears exactly once (the rating). No pills, no badges, no card
// borders — metadata is quiet inline text on hairline dividers. Type carries
// the hierarchy; the artwork appears once, full-bleed and unadorned.
import { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import type { CastMember, Movie } from "@/lib/content-types";
import type { Brand, DetailLabels, FooterContent } from "@/lib/site-types";
import styles from "./detail.module.css";

interface DetailClientProps {
  movie: Movie;
  related: Movie[];
  /** Already resolved against the store's defaultCast by the server. */
  cast: CastMember[];
  brand: Brand;
  footer: FooterContent;
  labels: DetailLabels;
}

/** Two-letter monogram for cast members with no portrait. */
function monogram(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "—";
  const first = parts[0].charAt(0);
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : "";
  return (first + last).toUpperCase();
}

export default function DetailClient({
  movie,
  related,
  cast,
  brand,
  footer,
  labels,
}: DetailClientProps) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);

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
            <button type="button" className={styles.play}>
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
          <div className={styles.plateFrame}>
            <img className={styles.plateImg} src={plateSrc} alt={movie.title} />
            <button type="button" className={styles.platePlay} aria-label={labels.trailerPlay}>
              <svg
                className={styles.platePlayGlyph}
                viewBox="0 0 12 14"
                aria-hidden="true"
                focusable="false"
              >
                <path d="M0 0v14l12-7z" fill="currentColor" />
              </svg>
            </button>
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
              <h2 className={styles.sectionLabel}>{labels.castHeading}</h2>
              <span className={styles.sectionRule} aria-hidden="true" />
            </div>

            {cast.length > 0 ? (
              <ul className={styles.castGrid}>
                {cast.map((person, index) => (
                  <li key={`${person.name}-${index}`} className={styles.castItem}>
                    <span className={styles.castPortrait}>
                      {person.image ? (
                        <img className={styles.castImg} src={person.image} alt="" loading="lazy" />
                      ) : (
                        <span className={styles.castMonogram} aria-hidden="true">
                          {monogram(person.name)}
                        </span>
                      )}
                    </span>
                    <span className={styles.castName}>{person.name}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.empty}>Casting not yet announced.</p>
            )}
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionLabel}>{labels.relatedHeading}</h2>
              <span className={styles.sectionRule} aria-hidden="true" />
            </div>

            {related.length > 0 ? (
              <ul className={styles.relatedGrid}>
                {related.map((item) => (
                  <li key={item.id} className={styles.relatedItem}>
                    <Link href={`/watch/${item.id}`} className={styles.relatedLink}>
                      <span className={styles.relatedFrame}>
                        <img
                          className={styles.relatedImg}
                          src={item.image}
                          alt=""
                          loading="lazy"
                        />
                      </span>
                      <span className={styles.relatedTitle}>{item.title}</span>
                    </Link>
                  </li>
                ))}
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
    </div>
  );
}
