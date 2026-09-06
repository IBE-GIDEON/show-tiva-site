// Server-only data access for the site copy store (data/site.json).
//
// Kept separate from content.json on purpose: a malformed landing-copy edit
// must not be able to take down the movie catalog, and the two have nothing
// in common structurally.
import "server-only";

import { cache } from "react";

import { mutateJson, readJson, StoreError, writeJson } from "./json-store";
import type { LandingRole, LandingRoleContent, Site } from "./site-types";
import { LANDING_ROLES } from "./site-types";

const FILE = "site.json";

class SiteError extends StoreError {
  constructor(message: string) {
    super(FILE, message);
    this.name = "SiteError";
  }
}

function assertString(value: unknown, at: string): string {
  if (typeof value !== "string" || !value) throw new SiteError(`${at} must be a non-empty string`);
  return value;
}

function assertRoleContent(value: unknown, at: string): LandingRoleContent {
  if (typeof value !== "object" || value === null) throw new SiteError(`${at} must be an object`);
  const role = value as Record<string, unknown>;

  assertString(role.heroSub, `${at}.heroSub`);
  assertString(role.heroDesc, `${at}.heroDesc`);
  assertString(role.bannerHeadline, `${at}.bannerHeadline`);
  assertString(role.bannerDesc, `${at}.bannerDesc`);

  if (!Array.isArray(role.videos) || role.videos.length === 0) {
    throw new SiteError(`${at}.videos must be a non-empty array`);
  }
  role.videos.forEach((src, i) => assertString(src, `${at}.videos[${i}]`));

  const title = role.heroTitle as Record<string, unknown> | null;
  if (typeof title !== "object" || title === null) {
    throw new SiteError(`${at}.heroTitle must be an object`);
  }
  if (title.mode === "rotating") {
    assertString(title.prefix, `${at}.heroTitle.prefix`);
    assertString(title.staticWord, `${at}.heroTitle.staticWord`);
    if (!Array.isArray(title.rotatingWords) || title.rotatingWords.length === 0) {
      throw new SiteError(`${at}.heroTitle.rotatingWords must be a non-empty array`);
    }
    title.rotatingWords.forEach((word, i) =>
      assertString(word, `${at}.heroTitle.rotatingWords[${i}]`),
    );
  } else if (title.mode === "plain") {
    assertString(title.text, `${at}.heroTitle.text`);
  } else {
    throw new SiteError(`${at}.heroTitle.mode must be "rotating" or "plain"`);
  }

  return value as LandingRoleContent;
}

/** Every key on an object must be a non-empty string. */
function assertStringMap(value: unknown, at: string, keys: readonly string[]): void {
  if (typeof value !== "object" || value === null) throw new SiteError(`${at} must be an object`);
  const o = value as Record<string, unknown>;
  for (const key of keys) assertString(o[key], `${at}.${key}`);
}

const WATCH_KEYS = [
  "search", "notifications", "profile", "heroDurationPrefix", "heroWatchNow",
  "heroAddList", "heroAdded", "heroSlideDot", "viewAll", "scrollLeft",
  "scrollRight", "saveToList",
] as const;

const DETAIL_KEYS = [
  "goBack", "search", "profile", "download", "typeFallback", "qualityBadge",
  "play", "watchlist", "inWatchlist", "castHeading", "trailerHeading",
  "trailerTitleSuffix", "trailerStudio", "trailerPlay", "relatedHeading",
  "saveToList",
] as const;

const POPOVER_KEYS = ["typeBadge", "languageBadge", "watchNow", "addToWatchlist"] as const;
const NOT_FOUND_KEYS = ["title", "backLabel"] as const;
const BRAND_KEYS = ["mark", "wordmark", "wordmarkAlt", "homeHref"] as const;

function assertFooter(value: unknown, at: string): void {
  if (typeof value !== "object" || value === null) throw new SiteError(`${at} must be an object`);
  const f = value as Record<string, unknown>;

  for (const key of ["tagline", "backgroundImage", "backgroundAlt", "copyright"]) {
    assertString(f[key], `${at}.${key}`);
  }

  if (!Array.isArray(f.columns)) throw new SiteError(`${at}.columns must be an array`);
  f.columns.forEach((column, i) => {
    const col = column as Record<string, unknown>;
    assertString(col?.title, `${at}.columns[${i}].title`);
    if (!Array.isArray(col.links)) throw new SiteError(`${at}.columns[${i}].links must be an array`);
    col.links.forEach((link, j) => {
      const l = link as Record<string, unknown>;
      assertString(l?.label, `${at}.columns[${i}].links[${j}].label`);
      assertString(l?.href, `${at}.columns[${i}].links[${j}].href`);
    });
  });

  if (!Array.isArray(f.socials)) throw new SiteError(`${at}.socials must be an array`);
  f.socials.forEach((social, i) => {
    const s = social as Record<string, unknown>;
    assertString(s?.platform, `${at}.socials[${i}].platform`);
    assertString(s?.label, `${at}.socials[${i}].label`);
    assertString(s?.href, `${at}.socials[${i}].href`);
  });
}

/** Narrow parsed JSON to `Site`, failing loudly with the offending path. */
function assertSite(value: unknown): Site {
  if (typeof value !== "object" || value === null) {
    throw new SiteError("expected a top-level object");
  }
  const site = value as Record<string, unknown>;

  const landing = site.landing as Record<string, unknown> | undefined;
  if (typeof landing !== "object" || landing === null) {
    throw new SiteError("landing must be an object");
  }
  if (typeof landing.introMinimizeDelayMs !== "number") {
    throw new SiteError("landing.introMinimizeDelayMs must be a number");
  }
  if (typeof landing.stripeStaggerSeconds !== "number") {
    throw new SiteError("landing.stripeStaggerSeconds must be a number");
  }

  const roles = landing.roles as Record<string, unknown> | undefined;
  if (typeof roles !== "object" || roles === null) {
    throw new SiteError("landing.roles must be an object");
  }
  for (const role of LANDING_ROLES) {
    assertRoleContent(roles[role], `landing.roles.${role}`);
  }

  assertStringMap(site.brand, "brand", BRAND_KEYS);
  assertFooter(site.footer, "footer");
  assertStringMap(site.watch, "watch", WATCH_KEYS);
  assertStringMap(site.detail, "detail", DETAIL_KEYS);
  assertStringMap(site.popover, "popover", POPOVER_KEYS);
  assertStringMap(site.notFound, "notFound", NOT_FOUND_KEYS);

  return value as Site;
}

/** Read and validate the store. Request-scoped: one disk read per request. */
export const getSite = cache(async (): Promise<Site> => {
  return readJson(FILE, assertSite);
});

/** Coerce an arbitrary `?role=` value to a known role, defaulting to family. */
export function resolveRole(value: string | string[] | undefined): LandingRole {
  return value === "creator" ? "creator" : "family";
}

/**
 * The chrome shared by the watch and detail pages: brand, footer and every
 * UI label. One read serves a whole page render.
 */
export async function getChrome() {
  const site = await getSite();
  return {
    brand: site.brand,
    footer: site.footer,
    watch: site.watch,
    detail: site.detail,
    popover: site.popover,
    notFound: site.notFound,
  };
}

/** Landing copy for one role, plus the shared animation timings. */
export async function getLanding(role: LandingRole) {
  const { landing } = await getSite();
  return {
    role,
    content: landing.roles[role],
    introMinimizeDelayMs: landing.introMinimizeDelayMs,
    stripeStaggerSeconds: landing.stripeStaggerSeconds,
  };
}

/** Validate, back up, then atomically replace the site store. */
export async function writeSite(next: Site): Promise<Site> {
  return writeJson(FILE, { ...next, updatedAt: new Date().toISOString() }, assertSite);
}

/**
 * Read-modify-write the site store under a single lock, so overlapping
 * requests cannot each read the same snapshot and lose one another's changes.
 */
export async function mutateSite(
  mutator: (current: Site) => Site | Promise<Site>,
): Promise<Site> {
  return mutateJson(FILE, assertSite, async (current) => ({
    ...(await mutator(current)),
    updatedAt: new Date().toISOString(),
  }));
}
