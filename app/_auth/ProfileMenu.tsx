"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

import { cx } from "@/lib/cx";
import {
  getDemoUserProfile,
  markDemoSignedOut,
  subscribeDemoAuthChange,
  type DemoUserProfile,
} from "./demo-auth";

type ProfileMenuVariant = "glass" | "minimal" | "control";

interface ProfileMenuProps {
  ariaLabel?: string;
  variant?: ProfileMenuVariant;
}

/* ------------------------------------------------------------- styling -- */

const TRIGGER =
  "inline-flex flex-none cursor-pointer items-center justify-center rounded-[999px] p-0 no-underline transition-[background,border-color,color,transform,box-shadow] duration-[0.22s] ease-[ease] hover:-translate-y-px focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-ink motion-reduce:transition-none [&_svg]:h-[52%] [&_svg]:w-[52%]";

/* One look per surface: frosted on the catalog, bare on the detail page,
   compact on the browse toolbar. */
const VARIANT: Record<ProfileMenuVariant, string> = {
  glass:
    "size-[42px] border bg-[rgba(255,255,255,0.06)] text-ink backdrop-blur-[10px] aria-expanded:bg-[rgba(255,255,255,0.14)] hover:bg-[rgba(255,255,255,0.14)]",
  minimal:
    "size-[2.35rem] border-0 bg-transparent text-[#8a8a8a] aria-expanded:bg-[rgba(255,255,225,0.06)] aria-expanded:text-ink hover:bg-[rgba(255,255,225,0.06)] hover:text-ink",
  control:
    "size-[34px] border-0 bg-transparent text-[rgba(255,255,225,0.72)] aria-expanded:bg-[rgba(255,255,225,0.06)] aria-expanded:text-ink hover:bg-[rgba(255,255,225,0.06)] hover:text-ink",
};

/* The glass ring's border: plain when signed out, a faint red halo once a
   profile is present (which then also holds on hover). */
const GLASS_BORDER =
  "border-[rgba(255,255,255,0.1)] aria-expanded:border-[rgba(255,255,255,0.24)] hover:border-[rgba(255,255,255,0.24)]";
const GLASS_BORDER_SIGNED_IN =
  "border-[rgba(255,46,61,0.38)] shadow-[0_0_0_1px_rgba(255,46,61,0.04),0_10px_28px_rgba(255,46,61,0.16)]";

const AVATAR =
  "grid place-items-center rounded-[999px] bg-[image:radial-gradient(circle_at_32%_25%,rgba(255,255,225,0.95),rgba(255,255,225,0.1)_28%,transparent_30%),linear-gradient(145deg,#ff2e3d_0%,#9f101a_58%,#2b0307_100%)] font-heading font-black tracking-[0] text-white uppercase shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)]";

const MENU =
  "absolute top-[calc(100%+12px)] right-0 w-[min(330px,calc(100vw-24px))] origin-top-right animate-menu-in rounded-lg border border-[rgba(255,255,225,0.12)] bg-[#090909] bg-[image:linear-gradient(180deg,rgba(255,255,225,0.055),rgba(255,255,225,0.015))] p-3 text-ink shadow-[0_28px_70px_rgba(0,0,0,0.68)] backdrop-blur-[18px] max-[420px]:right-[-8px] max-[420px]:w-[min(310px,calc(100vw-18px))] motion-reduce:animate-none motion-reduce:transition-none " +
  // the little notch pointing at the trigger
  "before:absolute before:top-[-6px] before:right-4 before:size-[11px] before:border-t before:border-l before:border-[rgba(255,255,225,0.12)] before:bg-[#111111] before:content-[''] before:[transform:rotate(45deg)]";

const ITEM =
  "grid min-h-[52px] w-full cursor-pointer grid-cols-[34px_minmax(0,1fr)_auto] items-center gap-[10px] rounded-md bg-transparent p-2 text-left transition-[background,color,transform] duration-[0.18s] ease-[ease] hover:-translate-x-px hover:bg-[rgba(255,255,225,0.065)] focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-ink max-[420px]:grid-cols-[32px_minmax(0,1fr)_auto] motion-reduce:animate-none motion-reduce:transition-none";
const ITEM_ICON = "grid size-[34px] place-items-center rounded-[999px] [&_svg]:size-[17px]";
const ITEM_TEXT = "flex min-w-0 flex-col gap-1";
const ITEM_LABEL = "font-heading text-[0.86rem] leading-none font-extrabold text-ink";
const ITEM_COPY = "truncate text-[0.68rem] leading-[1.25] font-semibold";

/* ------------------------------------------------------------- helpers -- */

function getInitials(profile: DemoUserProfile): string {
  const source = profile.name || profile.email;
  const parts = source
    .replace(/@.*$/, "")
    .split(/[.\s_-]+/)
    .filter(Boolean);

  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return (parts[0] || "ST").slice(0, 2).toUpperCase();
}

function getProfileSnapshot(): string {
  const profile = getDemoUserProfile();
  return profile ? JSON.stringify(profile) : "";
}

function getServerProfileSnapshot(): string {
  return "";
}

function AccountIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

type MenuIconKind = "account" | "appearance" | "playback" | "language" | "kids" | "help" | "signout";

function MenuIcon({ kind }: { kind: MenuIconKind }) {
  if (kind === "appearance") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3v2" />
        <path d="M12 19v2" />
        <path d="m4.22 4.22 1.42 1.42" />
        <path d="m18.36 18.36 1.42 1.42" />
        <path d="M3 12h2" />
        <path d="M19 12h2" />
        <path d="m4.22 19.78 1.42-1.42" />
        <path d="m18.36 5.64 1.42-1.42" />
        <circle cx="12" cy="12" r="4" />
      </svg>
    );
  }

  if (kind === "playback") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M8 5v14l11-7z" />
        <path d="M3 5v14" />
      </svg>
    );
  }

  if (kind === "language") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18" />
        <path d="M12 3a14 14 0 0 1 0 18" />
        <path d="M12 3a14 14 0 0 0 0 18" />
      </svg>
    );
  }

  if (kind === "kids") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3 5 6v5c0 4.4 2.7 8.3 7 10 4.3-1.7 7-5.6 7-10V6z" />
        <path d="M9 12h6" />
        <path d="M12 9v6" />
      </svg>
    );
  }

  if (kind === "help") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M9.5 9a2.7 2.7 0 0 1 5 1.4c0 1.8-2.5 2.2-2.5 3.8" />
        <path d="M12 17.5h.01" />
      </svg>
    );
  }

  if (kind === "signout") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M10 17l5-5-5-5" />
        <path d="M15 12H3" />
        <path d="M21 4v16" />
      </svg>
    );
  }

  return <AccountIcon />;
}

const SETTINGS: { kind: MenuIconKind; label: string; copy: string }[] = [
  { kind: "account", label: "Account", copy: "Membership and profile details" },
  { kind: "appearance", label: "Appearance", copy: "ShowTiva theatre styling" },
  { kind: "playback", label: "Playback", copy: "Autoplay and quality controls" },
  { kind: "language", label: "Language", copy: "Audio and subtitle preferences" },
  { kind: "kids", label: "Family mode", copy: "Profile safety and maturity level" },
  { kind: "help", label: "Help", copy: "Support, devices, and app info" },
];

/* ----------------------------------------------------------- component -- */

export default function ProfileMenu({ ariaLabel = "Profile", variant = "glass" }: ProfileMenuProps) {
  const profileSnapshot = useSyncExternalStore(
    subscribeDemoAuthChange,
    getProfileSnapshot,
    getServerProfileSnapshot,
  );
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const profile = useMemo<DemoUserProfile | null>(() => {
    if (!profileSnapshot) return null;

    try {
      return JSON.parse(profileSnapshot) as DemoUserProfile;
    } catch {
      return null;
    }
  }, [profileSnapshot]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const initials = useMemo(() => (profile ? getInitials(profile) : "ST"), [profile]);
  const triggerClassName = cx(
    TRIGGER,
    VARIANT[variant],
    variant === "glass" && (profile ? GLASS_BORDER_SIGNED_IN : GLASS_BORDER),
  );

  if (!profile) {
    return (
      // A plain anchor rather than <Link>: a client-side navigation to /signin
      // is intercepted by the @auth slot and opens the modal, and this control
      // is meant to land on the full sign-in page. The lint rule cannot tell
      // an intentional full navigation from a missed <Link>.
      // eslint-disable-next-line @next/next/no-html-link-for-pages
      <a href="/signin" className={triggerClassName} aria-label={ariaLabel}>
        <AccountIcon />
      </a>
    );
  }

  return (
    <div className="relative z-[1500] inline-flex flex-none" ref={rootRef}>
      <button
        type="button"
        className={triggerClassName}
        aria-label="Open profile settings"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className={cx(AVATAR, "h-[calc(100%-6px)] w-[calc(100%-6px)] text-[0.7rem]")}>{initials}</span>
      </button>

      {open && (
        <div className={MENU} role="menu" aria-label="Profile settings">
          <div className="grid grid-cols-[44px_minmax(0,1fr)] items-center gap-3 px-2 pt-2 pb-3">
            <span className={cx(AVATAR, "size-11 text-[0.78rem]")}>{initials}</span>
            <span className="flex min-w-0 flex-col gap-1">
              <strong className="truncate font-heading text-[0.95rem] leading-[1.1] font-extrabold text-ink">{profile.name}</strong>
              <span className="truncate text-[0.74rem] leading-[1.2] font-semibold text-[rgba(255,255,225,0.55)]">{profile.email}</span>
            </span>
          </div>

          <div className="border-t border-[rgba(255,255,225,0.08)] px-2 pt-[10px] pb-[7px] font-[family-name:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace] text-[0.58rem] font-bold tracking-[0.16em] text-[rgba(255,255,225,0.48)] uppercase">
            Settings
          </div>

          <div className="flex flex-col gap-[2px]">
            {SETTINGS.map((item) => (
              <button key={item.kind} type="button" className={cx(ITEM, "text-inherit")} role="menuitem">
                <span className={cx(ITEM_ICON, "bg-[rgba(255,255,225,0.06)] text-[rgba(255,255,225,0.76)]")}>
                  <MenuIcon kind={item.kind} />
                </span>
                <span className={ITEM_TEXT}>
                  <span className={ITEM_LABEL}>{item.label}</span>
                  <span className={cx(ITEM_COPY, "text-[rgba(255,255,225,0.5)]")}>{item.copy}</span>
                </span>
              </button>
            ))}
          </div>

          <button
            type="button"
            className={cx(ITEM, "mt-2 rounded-t-none border-t border-[rgba(255,255,225,0.08)] text-[#ff6a75]")}
            role="menuitem"
            onClick={() => {
              markDemoSignedOut();
              setOpen(false);
            }}
          >
            <span className={cx(ITEM_ICON, "bg-[rgba(255,46,61,0.1)] text-[#ff6a75]")}>
              <MenuIcon kind="signout" />
            </span>
            <span className={ITEM_TEXT}>
              <span className={ITEM_LABEL}>Sign out</span>
              <span className={cx(ITEM_COPY, "text-[rgba(255,106,117,0.62)]")}>Return to guest browsing</span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
