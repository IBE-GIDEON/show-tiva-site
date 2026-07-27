"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";
import { FlipWords } from "../ui/flip-words";

function LandingContent() {
  const searchParams = useSearchParams();
  const role = searchParams.get("role") || "family"; // defaults to family
  const isCreator = role === "creator";

  const showLetters = ["S", "H", "O", "W"];
  const tivaLetters = ["T", "I", "V", "A"];
  const [isMinimized, setIsMinimized] = useState(false);
  const rotatingWords = ["Shows", "Movies", "Series", "Stories", "Shorts", "Tales"];

  useEffect(() => {
    const minimizeTimer = setTimeout(() => {
      setIsMinimized(true);
    }, 2200);

    return () => {
      clearTimeout(minimizeTimer);
    };
  }, []);

  const stripes = [0, 1, 2, 3, 4];

  // Dynamic content based on search parameter ?role=
  const copy = {
    family: {
      heroSub: "100% WHOLESOME SHOWS",
      heroTitle: "Trusted Animation for Your Family",
      heroDesc: "We feed families clean, safe, and trusted video shows. Zero explicit content, pure storytelling, and complete peace of mind for our audience.",
      emailPlaceholder: "Enter your email to start watching",
      emailButtonText: "Start watching",
      bannerHeadline: "Trusted Entertainment Studio",
      bannerDesc: "Every single animation is fully vetted, creating a wholesome environment for your family.",
      bottomCTA: "Coming soon",
    },
    creator: {
      heroSub: "ELITE CREATOR STUDIO ACCESS",
      heroTitle: "Co-Create the Future of Family Shows",
      heroDesc: "Collaborate with our studio to produce trusted shows. Access is exclusive: you must be invited and pass our vetting checks to earn a spot.",
      emailPlaceholder: "Enter email for invite request",
      emailButtonText: "Request Invite",
      bannerHeadline: "The Ultimate Creator Hub",
      bannerDesc: "Upload stories, collaborate with creators, and showcase films to the world.",
      bottomCTA: "Coming soon",
    }
  };

  const activeCopy = isCreator ? copy.creator : copy.family;

  return (
    <main className={`${styles.container} ${isMinimized ? styles.lightBg : ""}`}>
      {/* Intro viewport wrapper to contain the initial cinematic reveal */}
      <div className={styles.intro}>
        {/* Background Video Stripes */}
        <div className={`${styles.stripeContainer} ${isMinimized ? styles.stripeVisible : ""}`}>
          {stripes.map((index) => {
            // Switch video folder based on ?role=
            const videoSrc = isCreator 
              ? `/creator_video_${index + 1}.mp4` 
              : `/bg_video_${index + 1}.mp4`;
            return (
              <div
                key={index}
                className={styles.stripe}
                style={{
                  animationDelay: `${index * 0.3}s`,
                } as React.CSSProperties}
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
            );
          })}
          {/* Dark blur overlay */}
          <div className={`${styles.videoOverlay} ${isMinimized ? styles.overlayActive : ""}`}></div>
        </div>

        {/* Centered Hero Writeup */}
        <div className={`${styles.heroWriteup} ${isMinimized ? styles.heroActive : ""}`}>
          <h3 className={styles.heroSub}>{activeCopy.heroSub}</h3>
          <h1 className={styles.heroTitle}>
            {!isCreator ? (
              <>
                Trusted{" "}
                <span style={{ whiteSpace: "nowrap" }}>
                  Family <FlipWords words={rotatingWords} />
                </span>
              </>
            ) : (
              activeCopy.heroTitle
            )}
          </h1>
          <p className={styles.heroDesc}>{activeCopy.heroDesc}</p>
          <div className={styles.emailCollector}>
            <Link href="/watch" style={{ textDecoration: "none" }}>
              <button className={styles.emailButton}>
                <span>Start watching</span>
                <svg className={styles.arrowIconSmall} viewBox="0 0 24 24" width="18" height="18">
                  <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
              </button>
            </Link>
          </div>
        </div>
        
        {/* Left pattern overlay at start */}
        <div className={styles.patternLeft}></div>
        
        {/* Minimized Logo Link */}
        <div className={`${styles.logoContainer} ${isMinimized ? styles.minimized : ""}`}>
          <Link href={`/?role=${role}`} className={styles.logoLink}>
            <h1 className={styles.logo}>
              <span className={styles.showText}>
                {showLetters.map((char, index) => (
                  <span
                    key={`show-${index}`}
                    className={styles.letter}
                    style={{ animationDelay: `${index * 0.08}s` }}
                  >
                    {char}
                  </span>
                ))}
              </span>
              <span className={styles.tivaText}>
                {tivaLetters.map((char, index) => (
                  <span
                    key={`tiva-${index}`}
                    className={styles.letter}
                    style={{ 
                      animationDelay: `${(showLetters.length + index) * 0.08 + 0.05}s` 
                    }}
                  >
                    {char}
                  </span>
                ))}
              </span>
            </h1>
          </Link>
        </div>

        {/* Bottom Banner Bar */}
        <div className={styles.writeup}>
          <div className={styles.bannerInfo}>
            <h2 className={styles.headline}>{activeCopy.bannerHeadline}</h2>
            <span className={styles.divider}></span>
            <p className={styles.description}>{activeCopy.bannerDesc}</p>
          </div>
          <button className={styles.ctaButton}>
            <span>{activeCopy.bottomCTA}</span>
          </button>
        </div>
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className={styles.loadingContainer}>
        <p className={styles.loadingText}>Loading ShowTiva...</p>
      </div>
    }>
      <LandingContent />
    </Suspense>
  );
}
