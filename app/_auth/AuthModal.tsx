"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

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
    <div className="fixed inset-0 z-[1000] grid place-items-center bg-[rgba(0,0,0,0.62)] bg-[image:radial-gradient(circle_at_50%_20%,rgba(252,51,67,0.14),transparent_38%)] p-[clamp(1rem,4vw,2.5rem)] backdrop-blur-[18px] max-[520px]:p-3">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close"
        onClick={() => router.back()}
      />

      <section
        className="relative max-h-[calc(100dvh-2rem)] w-[min(100%,460px)] overflow-y-auto rounded-lg border border-[rgba(255,255,225,0.14)] bg-[#0d0d0d] bg-[image:linear-gradient(145deg,rgba(18,18,18,0.98),rgba(5,5,5,0.98))] p-[clamp(1.5rem,4vw,2.25rem)] text-ink shadow-[0_30px_90px_rgba(0,0,0,0.62)] max-[520px]:max-h-[calc(100dvh-1.5rem)] max-[520px]:w-full max-[520px]:p-[1.35rem]"
        role="dialog"
        aria-modal="true"
        aria-label={label}
      >
        <button
          type="button"
          className="absolute top-4 right-4 z-[1] inline-flex size-9 cursor-pointer items-center justify-center rounded-[999px] border border-[rgba(255,255,225,0.12)] bg-[rgba(255,255,255,0.05)] text-[rgba(255,255,225,0.76)] transition-[background,border-color,color] duration-200 ease-[ease] hover:border-[#fc3343] hover:bg-[#fc3343] hover:text-ink"
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
