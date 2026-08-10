import type { Brand, FooterContent } from "@/lib/site-types";

import styles from "./watch.module.css";

/**
 * Social icons live in code, keyed by platform. Icons are never rendered from
 * stored data — that would let anything with write access inject markup.
 * An unrecognised platform falls back to a generic link glyph.
 */
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

const GENERIC_ICON = (
  <>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </>
);

interface SiteFooterProps {
  brand: Brand;
  footer: FooterContent;
}

/**
 * Shared by the catalog and detail pages, which previously carried two
 * identical copies of this markup.
 */
export default function SiteFooter({ brand, footer }: SiteFooterProps) {
  return (
    <footer className={styles.watchFooter}>
      <div className={styles.footerBgWrap}>
        <img src={footer.backgroundImage} alt={footer.backgroundAlt} className={styles.footerBgImage} />
        <div className={styles.footerVignette} />
      </div>

      <div className={styles.footerContent}>
        <div className={styles.footerTop}>
          {/* Branding Column */}
          <div className={styles.footerBrandCol}>
            <div className={styles.footerLogo}>
              <img src={brand.wordmark} alt={brand.wordmarkAlt} className={styles.footerLogoImg} />
            </div>
            <p className={styles.footerTagline}>{footer.tagline}</p>
          </div>

          {/* Quick Link Columns */}
          <div className={styles.footerLinksGrid}>
            {footer.columns.map((column) => (
              <div key={column.title} className={styles.footerLinksCol}>
                <h5 className={styles.footerColTitle}>{column.title}</h5>
                <ul className={styles.footerLinksList}>
                  {column.links.map((link) => (
                    <li key={`${link.label}-${link.href}`}>
                      <a href={link.href}>{link.label}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.footerBottom}>
          <p className={styles.footerCopyright}>
            &copy; {new Date().getFullYear()} {footer.copyright}
          </p>
          <div className={styles.footerSocials}>
            {footer.socials.map((social) => (
              <a
                key={social.platform}
                href={social.href}
                className={styles.socialIconLink}
                aria-label={social.label}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {SOCIAL_ICONS[social.platform] ?? GENERIC_ICON}
                </svg>
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
