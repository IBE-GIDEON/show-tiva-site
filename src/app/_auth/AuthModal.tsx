"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import styles from "./auth-modal.module.css";

interface AuthModalProps {
  children: React.ReactNode;
  label: string;
}

export default function AuthModal({ children, label }: AuthModalProps) {
  const router = useRouter();

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") router.back();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [router]);

  return (
    <div className={styles.overlay}>
      <button
        type="button"
        className={styles.backdrop}
        aria-label="Close"
        onClick={() => router.back()}
      />

      <section className={styles.panel} role="dialog" aria-modal="true" aria-label={label}>
        <button
          type="button"
          className={styles.close}
          aria-label="Close"
          onClick={() => router.back()}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <line x1="5" y1="5" x2="19" y2="19" />
            <line x1="19" y1="5" x2="5" y2="19" />
          </svg>
        </button>

        {children}
      </section>
    </div>
  );
}
