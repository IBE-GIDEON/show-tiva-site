// Engagement figures for a short.
//
// There is no analytics store yet, so these are derived from the title's id.
// That matters more than it sounds: the number has to be the same on the card
// in the catalog and on the reel itself, or the two disagree in front of the
// viewer. Deriving both from one function is what keeps them honest until
// something real replaces the body of `shortMetrics`.

/**
 * A salted rolling hash.
 *
 * The salt varies rather than the string, because callers ask for several
 * figures about the same id: appending an index would only change the last
 * character, shift the hash by one, and hand back near-identical numbers.
 */
function hash(value: string, salt: number): number {
  let out = salt;
  for (let i = 0; i < value.length; i += 1) {
    out = (out * 31 + value.charCodeAt(i)) >>> 0;
  }
  return out;
}

export interface ShortMetrics {
  views: number;
  likes: number;
  comments: number;
  shares: number;
}

export function shortMetrics(id: string): ShortMetrics {
  return {
    views: hash(id, 101) % 2_400_000,
    likes: hash(id, 7) % 240_000,
    comments: hash(id, 13) % 4_800,
    shares: hash(id, 29) % 9_400,
  };
}

/** 1_240_000 -> "1.2M". Counts are read at a glance, not audited. */
export function compactCount(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1).replace(/\.0$/, "")}K`;
  return String(value);
}
