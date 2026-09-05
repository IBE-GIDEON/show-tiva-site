"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import type { LandingRole, LandingRoleContent } from "@/lib/site-types";
import styles from "./page.module.css";
import { FlipWords } from "../ui/flip-words";

interface LandingClientProps {
  role: LandingRole;
  content: LandingRoleContent;
  introMinimizeDelayMs: number;
  stripeStaggerSeconds: number;
}

export default function LandingClient({
  role,
  content,
  introMinimizeDelayMs,
  stripeStaggerSeconds,
}: LandingClientProps) {
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    const minimizeTimer = setTimeout(() => {
      setIsMinimized(true);
    }, introMinimizeDelayMs);

    return () => {
      clearTimeout(minimizeTimer);
    };
  }, [introMinimizeDelayMs]);

  const { heroTitle } = content;

  return (
    <main className={`${styles.container} ${isMinimized ? styles.lightBg : ""}`}>
      {/* Intro viewport wrapper to contain the initial cinematic reveal */}
      <div className={styles.intro}>
        {/* Background Video Stripes */}
        <div className={`${styles.stripeContainer} ${isMinimized ? styles.stripeVisible : ""}`}>
          {content.videos.map((videoSrc, index) => (
            <div
              key={videoSrc}
              className={styles.stripe}
              style={
                {
                  animationDelay: `${index * stripeStaggerSeconds}s`,
                } as React.CSSProperties
              }
            >
              <video
                key={`${role}-${index}`}
                src={videoSrc}
                autoPlay
                loop
                muted
                playsInline
                className={styles.stripeVideo}
              />
            </div>
          ))}
          {/* Dark blur overlay */}
          <div className={`${styles.videoOverlay} ${isMinimized ? styles.overlayActive : ""}`}></div>
        </div>

        {/* Centered Hero Writeup */}
        <div className={`${styles.heroWriteup} ${isMinimized ? styles.heroActive : ""}`}>
          <h3 className={styles.heroSub}>{content.heroSub}</h3>
          <h1 className={styles.heroTitle}>
            {heroTitle.mode === "rotating" ? (
              <>
                {heroTitle.prefix}{" "}
                <span style={{ whiteSpace: "nowrap" }}>
                  {heroTitle.staticWord} <FlipWords words={heroTitle.rotatingWords} />
                </span>
              </>
            ) : (
              heroTitle.text
            )}
          </h1>
          <p className={styles.heroDesc}>{content.heroDesc}</p>
          <div className={styles.emailCollector}>
            {/* The link is the button: a <button> inside an <a> is invalid HTML and
                gives keyboard users two tab stops for one action. */}
            <Link href="/watch" className={styles.emailButton}>
              <span>Start watching</span>
              <svg className={styles.arrowIconSmall} viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Left pattern overlay at start */}
        <div className={styles.patternLeft}></div>

        {/* Minimized Logo Link */}
        <div className={`${styles.logoContainer} ${isMinimized ? styles.minimized : ""}`}>
          <Link href={`/?role=${role}`} className={styles.logoLink}>
            <h1 className={styles.logo}>
              <img src="/logo-wordmark.png" alt="SHOWTIVA" className={styles.logoImg} />
            </h1>
          </Link>
        </div>

        {/* Bottom Banner Bar */}
        <div className={styles.writeup}>
          <div className={styles.bannerInfo}>
            <h2 className={styles.headline}>{content.bannerHeadline}</h2>
            <span className={styles.divider}></span>
            <p className={styles.description}>{content.bannerDesc}</p>
          </div>
          <button className={styles.ctaButton}>
            <span>Coming soon</span>
          </button>
        </div>
      </div>
    </main>
  );
}
