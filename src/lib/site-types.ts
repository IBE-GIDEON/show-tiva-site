// Pure type definitions for the site copy store (data/site.json).
//
// Kept free of imports so both server and client components can use these
// types. Runtime/filesystem access lives in site.ts, which is server-only.

export const LANDING_ROLES = ["family", "creator"] as const;
export type LandingRole = (typeof LANDING_ROLES)[number];

/**
 * The headline renders one of two ways:
 *  - "rotating": `{prefix} {staticWord} <animated word>` — the animated
 *    variant, where staticWord and the rotating word stay on one line.
 *  - "plain": a single fixed string.
 */
export type HeroTitle =
  | {
      mode: "rotating";
      prefix: string;
      staticWord: string;
      rotatingWords: string[];
    }
  | {
      mode: "plain";
      text: string;
    };

export interface LandingRoleContent {
  /** Small eyebrow line above the headline. */
  heroSub: string;
  heroTitle: HeroTitle;
  heroDesc: string;
  bannerHeadline: string;
  bannerDesc: string;
  /** Background video stripes, in display order. Any count works. */
  videos: string[];
}

export interface LandingContent {
  /** Delay before the intro collapses into the minimized layout. */
  introMinimizeDelayMs: number;
  /** Per-stripe reveal offset, in seconds. */
  stripeStaggerSeconds: number;
  roles: Record<LandingRole, LandingRoleContent>;
}

/** Shape of data/site.json. */
export interface Site {
  version: number;
  updatedAt: string | null;
  landing: LandingContent;
}

/** Editable fields on a landing role, used to validate API writes. */
export const LANDING_EDITABLE = [
  "heroSub",
  "heroTitle",
  "heroDesc",
  "bannerHeadline",
  "bannerDesc",
  "videos",
] as const;
