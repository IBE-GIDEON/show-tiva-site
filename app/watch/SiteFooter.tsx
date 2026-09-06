import type { Brand, FooterContent } from "@/lib/site-types";

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

/** Shared by the catalog, browse and detail pages. */
export default function SiteFooter({ brand, footer }: SiteFooterProps) {
  return (
    <footer className="relative w-full overflow-hidden border-t border-[rgba(255,255,255,0.04)] bg-black pt-20 pb-[60px] max-[768px]:pt-[60px] max-[768px]:pb-10">
      {/* Blurred key art behind everything; scaled up so the blur has no
          transparent edges, and vignetted into the black. */}
      <div className="absolute inset-0 z-[1] overflow-hidden">
        <img src={footer.backgroundImage} alt={footer.backgroundAlt} className="h-full w-full object-cover blur-[50px] brightness-[0.18] [transform:scale(1.15)]" />
        <div className="absolute inset-0 bg-[image:radial-gradient(circle_at_center,transparent_30%,#000000_100%)]" />
      </div>

      <div className="relative z-[2] mx-auto flex max-w-[1480px] flex-col gap-[60px] px-12 max-[768px]:px-6">
        <div className="flex flex-wrap justify-between gap-12">
          {/* Branding column */}
          <div className="max-w-[420px] flex-[1_1_320px]">
            {/* Mark runs slightly taller than the wordmark's cap height so the
                lockup reads as one unit rather than two same-size blocks. */}
            <div className="mb-5 flex items-center gap-[11px] font-heading text-[1.8rem] font-extrabold tracking-[-0.03em]">
              {/* Decorative: the wordmark beside it carries the accessible name. */}
              <img src={brand.mark} alt="" className="block h-[27px] w-auto" />
              <img src={brand.wordmark} alt={brand.wordmarkAlt} className="block h-[21px] w-auto" />
            </div>
            <p className="font-body text-[0.95rem] leading-[1.6] text-[rgba(255,255,225,0.6)]">{footer.tagline}</p>
          </div>

          {/* Quick link columns */}
          <div className="flex flex-wrap gap-16 max-[768px]:gap-9">
            {footer.columns.map((column) => (
              <div key={column.title} className="flex-[1_1_140px]">
                <h5 className="mb-[22px] font-heading text-[0.95rem] font-bold tracking-[0.08em] text-ink uppercase">{column.title}</h5>
                <ul className="m-0 flex list-none flex-col gap-3 p-0">
                  {column.links.map((link) => (
                    <li key={`${link.label}-${link.href}`}>
                      <a
                        href={link.href}
                        className="inline-block font-body text-[0.9rem] text-[rgba(255,255,225,0.5)] no-underline transition-[color,transform] duration-250 ease-[ease] hover:text-[#ff2e3d] hover:[transform:translateX(4px)]"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-6 border-t border-[rgba(255,255,255,0.05)] pt-[30px]">
          <p className="font-body text-[0.85rem] text-[rgba(255,255,225,0.4)]">
            &copy; {new Date().getFullYear()} {footer.copyright}
          </p>
          <div className="flex gap-4">
            {footer.socials.map((social) => (
              <a
                key={social.platform}
                href={social.href}
                className="flex h-[38px] w-[38px] items-center justify-center rounded-[50%] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] text-[rgba(255,255,225,0.6)] transition-all duration-250 ease-[ease] hover:border-[#ff2e3d] hover:bg-[#ff2e3d] hover:text-ink hover:shadow-[0_4px_15px_rgba(255,46,61,0.4)] hover:[transform:translateY(-3px)]"
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
