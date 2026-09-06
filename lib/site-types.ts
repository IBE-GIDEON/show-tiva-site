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

/** Brand assets shared by the header, footer and landing logo. */
export interface Brand {
  /**
   * Logo mark image path, served from public/. Sits before the wordmark to
   * form the lockup. Rendered with an empty alt: the wordmark beside it
   * already carries the accessible name, so labelling both would make screen
   * readers announce the brand twice.
   */
  mark: string;
  /** Wordmark image path, served from public/. */
  wordmark: string;
  wordmarkAlt: string;
  /** Where the logo links to. */
  homeHref: string;
}

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterColumn {
  title: string;
  links: FooterLink[];
}

/**
 * Social links. `platform` selects a built-in icon — icons are never rendered
 * from stored markup, which would be an injection vector. An unrecognised
 * platform falls back to a generic link icon.
 */
export const SOCIAL_PLATFORMS = ["twitter", "instagram", "youtube"] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export interface FooterSocial {
  platform: string;
  label: string;
  href: string;
}

export interface FooterContent {
  tagline: string;
  backgroundImage: string;
  backgroundAlt: string;
  /** Rendered after the current year, e.g. "© 2026 {copyright}". */
  copyright: string;
  columns: FooterColumn[];
  socials: FooterSocial[];
}

/** Labels on the /watch catalog page. */
export interface WatchLabels {
  search: string;
  notifications: string;
  profile: string;
  heroDurationPrefix: string;
  heroWatchNow: string;
  heroAddList: string;
  heroAdded: string;
  /** Rendered as "{heroSlideDot} 1", "{heroSlideDot} 2", … */
  heroSlideDot: string;
  viewAll: string;
  scrollLeft: string;
  scrollRight: string;
  saveToList: string;
}

/** Labels on the movie detail page. */
export interface DetailLabels {
  goBack: string;
  search: string;
  profile: string;
  download: string;
  /** Shown when a movie has no `type` of its own. */
  typeFallback: string;
  qualityBadge: string;
  play: string;
  watchlist: string;
  inWatchlist: string;
  castHeading: string;
  trailerHeading: string;
  /** Rendered as "{title} — {trailerTitleSuffix}". */
  trailerTitleSuffix: string;
  trailerStudio: string;
  trailerPlay: string;
  relatedHeading: string;
  saveToList: string;
}

/** Labels in the hover pop-out card, used on both watch and detail. */
export interface PopoverLabels {
  typeBadge: string;
  languageBadge: string;
  watchNow: string;
  addToWatchlist: string;
}

/** Copy for the unknown-title page. */
export interface NotFoundLabels {
  title: string;
  backLabel: string;
}

/** Shape of data/site.json. */
export interface Site {
  version: number;
  updatedAt: string | null;
  brand: Brand;
  landing: LandingContent;
  footer: FooterContent;
  watch: WatchLabels;
  detail: DetailLabels;
  popover: PopoverLabels;
  notFound: NotFoundLabels;
}

/** Label groups a client may replace via the labels endpoint. */
export const LABEL_GROUPS = ["watch", "detail", "popover", "notFound", "brand"] as const;
export type LabelGroup = (typeof LABEL_GROUPS)[number];

/** Editable fields on a landing role, used to validate API writes. */
export const LANDING_EDITABLE = [
  "heroSub",
  "heroTitle",
  "heroDesc",
  "bannerHeadline",
  "bannerDesc",
  "videos",
] as const;
