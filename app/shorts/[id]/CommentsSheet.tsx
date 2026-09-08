"use client";

// The comment sheet for a short.
//
// It rises from the foot of the screen over the reel rather than replacing
// it, so the short keeps playing behind — the whole point of comments on a
// feed like this is that you do not leave the thing you are commenting on.
//
// There is no comment store yet, so the thread is seeded from the short's id:
// deterministic, so a given short shows the same thread every visit instead of
// reshuffling on each render. Anything typed is kept for the session and sits
// at the top, which is what posting feels like. Replacing `seedThread` with a
// real fetch is the whole of the work when a backend exists.

import { useEffect, useMemo, useRef, useState } from "react";

import { cx } from "@/lib/cx";

export interface Comment {
  id: string;
  author: string;
  initials: string;
  body: string;
  ago: string;
  likes: number;
  mine?: boolean;
}

const AUTHORS = [
  ["Ada Mensah", "AM"],
  ["Tunde Bello", "TB"],
  ["Priya Raman", "PR"],
  ["Kwame Osei", "KO"],
  ["Lena Fischer", "LF"],
  ["Diego Salas", "DS"],
  ["Mei Lin", "ML"],
  ["Sam Okoro", "SO"],
];

const BODIES = [
  "the animation on this is unreal, watched it three times",
  "whoever scored this deserves an award",
  "my kids asked for this on repeat all weekend 😅",
  "ok but the lighting in the second half though",
  "found this at 2am and have no regrets",
  "this is the kind of thing I signed up for",
  "the pacing is so clean, nothing wasted",
  "sending this to my sister right now",
  "genuinely didn't expect that ending",
  "the colours. that's it. that's the comment",
];

const AGO = ["2m", "18m", "1h", "4h", "9h", "1d", "2d", "6d", "1w", "3w"];

function hash(value: string, salt: number): number {
  let out = salt;
  for (let i = 0; i < value.length; i += 1) out = (out * 31 + value.charCodeAt(i)) >>> 0;
  return out;
}

function seedThread(movieId: string): Comment[] {
  const total = 6 + (hash(movieId, 5) % 7);

  return Array.from({ length: total }, (_, i) => {
    // The salt carries the index, not the string. Appending i would only
    // change the last character, which shifts the hash by one and lines every
    // row up on near-identical numbers.
    const who = hash(movieId, 17 + i * 977);
    const [author, initials] = AUTHORS[who % AUTHORS.length];
    return {
      id: `${movieId}-c${i}`,
      author,
      initials,
      body: BODIES[hash(movieId, 613 + i * 271) % BODIES.length],
      ago: AGO[Math.min(AGO.length - 1, i + (who % 3))],
      likes: hash(movieId, 53 + i * 419) % 2400,
    };
  });
}

function compact(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10_000 ? 0 : 1).replace(/\.0$/, "")}K`;
  return String(value);
}

interface CommentsSheetProps {
  movieId: string;
  movieTitle: string;
  count: number;
  onClose: () => void;
}

export default function CommentsSheet({ movieId, movieTitle, count, onClose }: CommentsSheetProps) {
  const seeded = useMemo(() => seedThread(movieId), [movieId]);
  const [posted, setPosted] = useState<Comment[]>([]);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const thread = [...posted, ...seeded];

  const post = () => {
    const body = draft.trim();
    if (!body) return;

    setPosted((prev) => [
      { id: `${movieId}-mine-${prev.length}`, author: "You", initials: "YO", body, ago: "now", likes: 0, mine: true },
      ...prev,
    ]);
    setDraft("");
    inputRef.current?.focus();
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end" role="dialog" aria-modal="true" aria-label={`Comments on ${movieTitle}`}>
      {/* Dismisses on a tap outside, and lets the reel stay visible above. */}
      <button
        type="button"
        className="absolute inset-0 animate-overlay-fade cursor-default border-0 bg-[rgba(0,0,0,0.45)]"
        aria-label="Close comments"
        onClick={onClose}
      />

      <section className="relative flex max-h-[76dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-[#0f0f0f] shadow-[0_-18px_50px_rgba(0,0,0,0.6)] min-[640px]:mx-auto min-[640px]:mb-6 min-[640px]:max-h-[70dvh] min-[640px]:w-[min(460px,calc(100vw-3rem))] min-[640px]:rounded-2xl">
        {/* The grab handle is the affordance that says this sheet pulls away. */}
        <span aria-hidden="true" className="mx-auto mt-[10px] block h-1 w-10 flex-none rounded-full bg-[rgba(255,255,225,0.22)]" />

        <header className="flex flex-none items-center justify-between gap-3 px-4 pt-3 pb-3">
          <h2 className="m-0 font-heading text-[1rem] font-extrabold text-ink">
            Comments <span className="ml-1 font-body text-[0.85rem] font-semibold text-[rgba(255,255,225,0.5)] tabular-nums">{compact(count + posted.length)}</span>
          </h2>
          <button
            type="button"
            aria-label="Close comments"
            onClick={onClose}
            className="grid size-9 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-[rgba(255,255,225,0.7)] transition-[background-color,color] duration-200 ease-[ease] hover:bg-[rgba(255,255,225,0.08)] hover:text-ink"
          >
            <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <line x1="5" y1="5" x2="19" y2="19" />
              <line x1="19" y1="5" x2="5" y2="19" />
            </svg>
          </button>
        </header>

        <ul className="m-0 min-h-0 flex-1 list-none overflow-y-auto overscroll-contain px-4 pb-2">
          {thread.map((comment) => (
            <li key={comment.id} className="flex gap-3 py-3">
              <span
                aria-hidden="true"
                className={cx(
                  "grid size-9 flex-none place-items-center rounded-full font-heading text-[0.72rem] font-black",
                  comment.mine
                    ? "bg-[#ff2e3d] text-ink"
                    : "bg-[rgba(255,255,225,0.1)] text-[rgba(255,255,225,0.78)]",
                )}
              >
                {comment.initials}
              </span>

              <div className="min-w-0 flex-1">
                <p className="m-0 flex items-center gap-2 font-body text-[0.74rem] font-semibold text-[rgba(255,255,225,0.52)]">
                  <span className={cx("truncate", comment.mine && "text-[#ff8d96]")}>{comment.author}</span>
                  <span className="flex-none tabular-nums">{comment.ago}</span>
                </p>
                <p className="m-0 mt-[3px] font-body text-[0.88rem] leading-[1.45] text-[rgba(255,255,225,0.92)]">{comment.body}</p>

                <button
                  type="button"
                  aria-label={liked[comment.id] ? `Remove like from ${comment.author}` : `Like comment by ${comment.author}`}
                  aria-pressed={!!liked[comment.id]}
                  onClick={() => setLiked((prev) => ({ ...prev, [comment.id]: !prev[comment.id] }))}
                  className={cx(
                    "mt-[6px] inline-flex cursor-pointer items-center gap-[6px] border-0 bg-transparent p-0 font-body text-[0.74rem] font-semibold transition-[color] duration-200 ease-[ease]",
                    liked[comment.id] ? "text-[#ff2e3d]" : "text-[rgba(255,255,225,0.5)] hover:text-ink",
                  )}
                >
                  <svg viewBox="0 0 24 24" width="15" height="15" fill={liked[comment.id] ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M7 22V10l5-8a2.5 2.5 0 0 1 2.4 3.2L13.4 9H19a2.5 2.5 0 0 1 2.4 3.1l-1.7 7A2.5 2.5 0 0 1 17.3 22z" />
                    <rect x="2" y="10" width="5" height="12" rx="1.2" />
                  </svg>
                  <span className="tabular-nums">{compact(comment.likes + (liked[comment.id] ? 1 : 0))}</span>
                </button>
              </div>
            </li>
          ))}
        </ul>

        {/* Sits below the safe area so the send control clears a home bar. */}
        <form
          className="flex flex-none items-center gap-2 border-t border-[rgba(255,255,225,0.08)] px-4 pt-3 pb-[max(0.85rem,env(safe-area-inset-bottom))]"
          onSubmit={(event) => {
            event.preventDefault();
            post();
          }}
        >
          <span aria-hidden="true" className="grid size-9 flex-none place-items-center rounded-full bg-[#ff2e3d] font-heading text-[0.72rem] font-black text-ink">
            YO
          </span>
          <label className="sr-only" htmlFor="comment-draft">
            Add a comment
          </label>
          <input
            id="comment-draft"
            ref={inputRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Add a comment…"
            autoComplete="off"
            className="h-10 min-w-0 flex-1 rounded-full border-0 bg-[rgba(255,255,225,0.07)] px-4 font-body text-[0.88rem] text-ink placeholder:text-[rgba(255,255,225,0.4)] focus:bg-[rgba(255,255,225,0.12)] focus:outline-none"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            aria-label="Post comment"
            className="grid size-10 flex-none cursor-pointer place-items-center rounded-full border-0 bg-[#ff2e3d] text-ink transition-[background-color,opacity] duration-200 ease-[ease] hover:bg-[#ff4552] disabled:cursor-default disabled:bg-[rgba(255,255,225,0.1)] disabled:text-[rgba(255,255,225,0.35)]"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </form>
      </section>
    </div>
  );
}
