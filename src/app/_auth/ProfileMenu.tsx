"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

import {
  getDemoUserProfile,
  markDemoSignedOut,
  subscribeDemoAuthChange,
  type DemoUserProfile,
} from "./demo-auth";
import styles from "./profile-menu.module.css";

type ProfileMenuVariant = "glass" | "minimal" | "control";

interface ProfileMenuProps {
  ariaLabel?: string;
  variant?: ProfileMenuVariant;
}

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

function MenuIcon({ kind }: { kind: "account" | "appearance" | "playback" | "language" | "kids" | "help" | "signout" }) {
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
  const triggerClassName = `${styles.trigger} ${styles[variant]} ${profile ? styles.signedIn : ""}`;

  const openFullPageSignin = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    window.location.assign("/signin");
  };

  if (!profile) {
    return (
      <Link href="/signin" className={triggerClassName} aria-label={ariaLabel} onClick={openFullPageSignin}>
        <AccountIcon />
      </Link>
    );
  }

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={triggerClassName}
        aria-label="Open profile settings"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className={styles.avatar}>{initials}</span>
      </button>

      {open && (
        <div className={styles.menu} role="menu" aria-label="Profile settings">
          <div className={styles.profileBlock}>
            <span className={styles.profileAvatar}>{initials}</span>
            <span className={styles.profileText}>
              <strong>{profile.name}</strong>
              <span>{profile.email}</span>
            </span>
          </div>

          <div className={styles.menuTitle}>Settings</div>

          <div className={styles.menuList}>
            <button type="button" className={styles.menuItem} role="menuitem">
              <span className={styles.menuIcon}>
                <MenuIcon kind="account" />
              </span>
              <span className={styles.menuText}>
                <span className={styles.menuLabel}>Account</span>
                <span className={styles.menuCopy}>Membership and profile details</span>
              </span>
            </button>

            <button type="button" className={styles.menuItem} role="menuitem">
              <span className={styles.menuIcon}>
                <MenuIcon kind="appearance" />
              </span>
              <span className={styles.menuText}>
                <span className={styles.menuLabel}>Appearance</span>
                <span className={styles.menuCopy}>Show Tiva theatre styling</span>
              </span>
            </button>

            <button type="button" className={styles.menuItem} role="menuitem">
              <span className={styles.menuIcon}>
                <MenuIcon kind="playback" />
              </span>
              <span className={styles.menuText}>
                <span className={styles.menuLabel}>Playback</span>
                <span className={styles.menuCopy}>Autoplay and quality controls</span>
              </span>
            </button>

            <button type="button" className={styles.menuItem} role="menuitem">
              <span className={styles.menuIcon}>
                <MenuIcon kind="language" />
              </span>
              <span className={styles.menuText}>
                <span className={styles.menuLabel}>Language</span>
                <span className={styles.menuCopy}>Audio and subtitle preferences</span>
              </span>
            </button>

            <button type="button" className={styles.menuItem} role="menuitem">
              <span className={styles.menuIcon}>
                <MenuIcon kind="kids" />
              </span>
              <span className={styles.menuText}>
                <span className={styles.menuLabel}>Family mode</span>
                <span className={styles.menuCopy}>Profile safety and maturity level</span>
              </span>
            </button>

            <button type="button" className={styles.menuItem} role="menuitem">
              <span className={styles.menuIcon}>
                <MenuIcon kind="help" />
              </span>
              <span className={styles.menuText}>
                <span className={styles.menuLabel}>Help</span>
                <span className={styles.menuCopy}>Support, devices, and app info</span>
              </span>
            </button>
          </div>

          <button
            type="button"
            className={`${styles.menuItem} ${styles.signOut}`}
            role="menuitem"
            onClick={() => {
              markDemoSignedOut();
              setOpen(false);
            }}
          >
            <span className={styles.menuIcon}>
              <MenuIcon kind="signout" />
            </span>
            <span className={styles.menuText}>
              <span className={styles.menuLabel}>Sign out</span>
              <span className={styles.menuCopy}>Return to guest browsing</span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
