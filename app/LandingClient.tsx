"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { cx } from "@/lib/cx";
import type { LandingRole, LandingRoleContent } from "@/lib/site-types";
import { FlipWords } from "../ui/flip-words";

interface LandingClientProps {
  role: LandingRole;
  content: LandingRoleContent;
  introMinimizeDelayMs: number;
  stripeStaggerSeconds: number;
}

/* ------------------------------------------------------------- styling -- */

/* The logo starts centred and huge, then travels to the top-left corner and
   shrinks over 1.2s once the intro minimises. Two class sets rather than one
   with overrides: two utilities for the same property on one element resolve
   by stylesheet order, not by which was written last. */
const LOGO_BOX = "fixed z-[100] flex items-center justify-center [transition:left_1.2s_cubic-bezier(0.25,1,0.5,1),top_1.2s_cubic-bezier(0.25,1,0.5,1),transform_1.2s_cubic-bezier(0.25,1,0.5,1)] will-change-[left,top,transform]";
const LOGO_BOX_STATE = {
  intro: "top-1/2 left-1/2 [transform:translate(-50%,-50%)]",
  minimized: "top-10 left-10 [transform:translate(0,0)] max-[768px]:top-[25px] max-[768px]:left-5",
};

/* The wordmark stands in for the SHOW/TIVA text. Its height tracks the cap
   height of the font sizes it replaces (~0.72em) and animates on the same
   curve, so the shrink into the minimised header matches the original. The
   entrance animation fades in from 0 itself, so the base state stays visible
   and the logo remains on screen if animations are disabled. */
const LOGO_IMG = "block w-auto flex-none animate-bounce-entrance transition-[height] duration-[1.2s] ease-[cubic-bezier(0.25,1,0.5,1)] will-change-[height,transform,opacity]";

/* The hero copy scales up and fades in as the intro minimises. */
const HERO = "absolute top-[40vh] left-1/2 z-40 flex w-[90%] max-w-[800px] flex-col items-center text-center [transition:opacity_1.2s_cubic-bezier(0.25,1,0.5,1)_0.3s,transform_1.2s_cubic-bezier(0.25,1,0.5,1)_0.3s] will-change-[opacity,transform] max-[768px]:top-[38vh] max-[768px]:w-full max-[768px]:px-6 max-[768px]:py-12 max-[768px]:bg-[image:radial-gradient(96%_54%_at_50%_50%,rgba(0,0,0,0.9)_0%,rgba(0,0,0,0.8)_40%,rgba(0,0,0,0.5)_66%,rgba(0,0,0,0.2)_84%,transparent_100%)]";
const HERO_STATE = {
  intro: "pointer-events-none opacity-0 [transform:translate(-50%,-50%)_scale(0.95)]",
  active: "pointer-events-auto opacity-100 [transform:translate(-50%,-50%)_scale(1)]",
};

/* The bottom banner rises into place half a second after the intro settles. */
const WRITEUP = "absolute right-[8%] bottom-[5%] left-[8%] z-[80] flex items-center justify-between max-[768px]:hidden max-[768px]:[text-shadow:0_1px_3px_rgba(0,0,0,0.95),0_1px_14px_rgba(0,0,0,0.85)] [transition:opacity_1s_cubic-bezier(0.25,1,0.5,1)_0.5s,transform_1s_cubic-bezier(0.25,1,0.5,1)_0.5s] will-change-[opacity,transform] max-[768px]:right-[5%] max-[768px]:bottom-[3%] max-[768px]:left-[5%] max-[768px]:mx-auto max-[768px]:w-[90%] max-[768px]:max-w-[500px] max-[768px]:flex-col max-[768px]:items-center max-[768px]:gap-3 max-[768px]:text-center";
const WRITEUP_STATE = {
  intro: "pointer-events-none opacity-0 [transform:translate(0,30px)]",
  active: "pointer-events-auto opacity-100 [transform:translate(0,0)]",
};

/* "Coming soon": a rotating conic-gradient border drawn by ::before, with
   ::after inset by 1px as the fill so only a hairline of the gradient shows. */
const CTA =
  "group/cta relative flex w-fit cursor-pointer items-center justify-center gap-[10px] overflow-hidden rounded-[30px] border-0 bg-transparent px-[23px] py-[11px] text-[0.95rem] font-bold whitespace-nowrap text-ink shadow-[0_8px_24px_rgba(255,30,47,0.15)] transition-[color,transform,box-shadow] duration-300 ease-[ease] hover:text-[#ff1e2f] hover:shadow-[0_12px_30px_rgba(255,30,47,0.35)] hover:[transform:translateY(-2px)] max-[768px]:px-[18px] max-[768px]:py-2 max-[768px]:text-[0.88rem] " +
  "before:absolute before:top-[-150%] before:left-[-50%] before:z-0 before:h-[400%] before:w-[200%] before:animate-rotate-border before:bg-[image:conic-gradient(from_0deg,transparent_20%,#ff1e2f_40%,#ff1e2f_60%,transparent_80%)] before:content-[''] " +
  "after:absolute after:inset-px after:z-[1] after:rounded-[29px] after:bg-black after:backdrop-blur-[12px] after:transition-[background-color,background] after:duration-300 after:ease-[ease] after:content-[''] hover:after:bg-white " +
  "[&>span]:relative [&>span]:z-[2] [&>svg]:relative [&>svg]:z-[2]";

/* ----------------------------------------------------------- component -- */

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
    <main className="relative h-screen w-full overflow-hidden bg-black font-[family-name:system-ui,-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,Helvetica,Arial,sans-serif]">
      {/* First screen: the cinematic intro, locked to 100vh so its absolutely
          positioned children anchor to it. */}
      <div className="relative h-screen w-full overflow-hidden">
        {/* Background video stripes: hidden until the intro minimises, then
            each drops in from above on a stagger. Only the first shows on
            phones. */}
        <div
          className={cx(
            "pointer-events-none absolute top-0 left-0 z-0 box-border flex h-[80vh] w-screen gap-4 overflow-hidden px-5 pt-5 pb-[10px] transition-opacity duration-400 ease-[ease-out] max-[768px]:h-full max-[768px]:gap-0 max-[768px]:p-0",
            isMinimized ? "opacity-100" : "opacity-0",
          )}
        >
          {content.videos.map((videoSrc, index) => (
            <div
              key={videoSrc}
              className={cx(
                "relative h-full flex-1 overflow-hidden rounded-2xl shadow-[0_15px_30px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.1)] will-change-transform [transform:translateY(-120%)] max-[768px]:not-first:hidden max-[768px]:rounded-none max-[768px]:shadow-none max-[768px]:after:hidden",
                // a soft sheen across each stripe, and a darker foot
                "after:pointer-events-none after:absolute after:top-0 after:left-0 after:z-[2] after:h-full after:w-full after:rounded-[inherit] after:bg-[image:linear-gradient(to_right,rgba(0,0,0,0.55)_0%,rgba(0,0,0,0)_25%,rgba(255,255,255,0.08)_50%,rgba(0,0,0,0)_75%,rgba(0,0,0,0.55)_100%),linear-gradient(to_bottom,rgba(255,255,255,0.15)_0%,rgba(255,255,255,0)_20%,rgba(0,0,0,0)_80%,rgba(0,0,0,0.4)_100%)] after:content-['']",
                isMinimized && "animate-stroke-in",
              )}
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
                className="absolute top-0 left-0 h-full w-full rounded-[inherit] object-cover opacity-85 max-[768px]:opacity-100"
              />
            </div>
          ))}
          {/* Dark blur overlay */}
          <div
            className={cx(
              "pointer-events-none absolute top-0 left-0 z-[5] h-full w-full bg-[rgba(0,0,0,0.65)] backdrop-blur-[8px] transition-opacity duration-[1.2s] ease-[cubic-bezier(0.25,1,0.5,1)] max-[768px]:bg-transparent max-[768px]:bg-[image:linear-gradient(to_bottom,transparent_0%,rgba(0,0,0,0.04)_20%,rgba(0,0,0,0.12)_42%,rgba(0,0,0,0.24)_62%,rgba(0,0,0,0.38)_80%,rgba(0,0,0,0.55)_100%)] max-[768px]:backdrop-blur-none",
              isMinimized ? "opacity-100" : "opacity-0",
            )}
          ></div>
        </div>

        {/* Centred hero copy */}
        <div className={cx(HERO, isMinimized ? HERO_STATE.active : HERO_STATE.intro)}>
          <h3 className="mb-3 text-[0.85rem] font-extrabold tracking-[0.3em] text-[#ff1e2f] uppercase [text-shadow:0_0_20px_rgba(255,30,47,0.4)] max-[768px]:mb-2 max-[768px]:text-[0.7rem] max-[768px]:tracking-[0.2em] max-[768px]:[text-shadow:0_1px_3px_rgba(0,0,0,0.95),0_0_14px_rgba(0,0,0,0.8)]">
            {content.heroSub}
          </h3>
          <h1 className="m-0 mb-4 text-[clamp(2.2rem,5vw,4rem)] leading-[1.1] font-black tracking-[-0.03em] text-ink [text-shadow:0_2px_10px_rgba(0,0,0,0.8)] max-[768px]:mb-3 max-[768px]:text-[1.8rem] max-[768px]:[text-shadow:0_1px_2px_rgba(0,0,0,0.95),0_2px_18px_rgba(0,0,0,0.9)]">
            {heroTitle.mode === "rotating" ? (
              <>
                {heroTitle.prefix}{" "}
                {/* Wraps on a phone: held on one line the rotating word overran the
                    column and was clipped mid-flip. */}
                <span className="whitespace-nowrap max-[768px]:whitespace-normal">
                  {heroTitle.staticWord} <FlipWords words={heroTitle.rotatingWords} />
                </span>
              </>
            ) : (
              heroTitle.text
            )}
          </h1>
          <p className="m-0 max-w-[600px] text-[clamp(1rem,1.5vw,1.25rem)] leading-[1.5] font-normal text-[#d1d1d6] [text-shadow:0_1px_4px_rgba(0,0,0,0.6)] max-[768px]:text-[0.85rem] max-[768px]:text-[#e8e8ed] max-[768px]:[text-shadow:0_1px_2px_rgba(0,0,0,0.95),0_1px_12px_rgba(0,0,0,0.85)]">
            {content.heroDesc}
          </p>
          <div className="z-50 mt-7 flex w-full max-w-[540px] items-center justify-center gap-[10px] max-[768px]:mt-5 max-[768px]:w-full max-[768px]:flex-col max-[768px]:gap-3">
            {/* The link is the button: a <button> inside an <a> is invalid HTML
                and gives keyboard users two tab stops for one action. */}
            <Link
              href="/watch"
              className="group/go flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-[rgba(255,30,47,0.35)] bg-[#ff1e2f] px-7 py-[15px] text-[0.95rem] font-bold whitespace-nowrap text-ink no-underline shadow-[0_8px_24px_rgba(255,30,47,0.25)] transition-[background-color,transform,box-shadow,border-color] duration-300 ease-[ease] hover:border-[rgba(255,30,47,0.7)] hover:bg-[#ff3343] hover:shadow-[0_12px_30px_rgba(255,30,47,0.4)] hover:[transform:translateY(-2px)] max-[768px]:box-border max-[768px]:w-full max-[768px]:px-5 max-[768px]:py-3 max-[768px]:text-[0.9rem]"
            >
              <span>Start watching</span>
              <svg className="transition-[transform] duration-300 ease-[ease] group-hover/go:[transform:translateX(4px)]" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Red dot grid in the top-left corner during the intro. */}
        <div
          className={cx(
            "pointer-events-none absolute top-0 left-0 z-[1] h-full w-full dot-pattern transition-opacity duration-[0.8s] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[opacity]",
            isMinimized ? "opacity-0" : "opacity-45",
          )}
        ></div>

        {/* Logo: centred for the intro, then minimised into the corner, where
            it becomes a link. */}
        <div className={cx(LOGO_BOX, isMinimized ? LOGO_BOX_STATE.minimized : LOGO_BOX_STATE.intro)}>
          <Link
            href={`/?role=${role}`}
            className={cx("flex items-center text-inherit no-underline", isMinimized ? "pointer-events-auto cursor-pointer" : "pointer-events-none cursor-default")}
          >
            <h1
              className={cx(
                "flex items-center gap-0 font-extrabold select-none [transition:font-size_1.2s_cubic-bezier(0.25,1,0.5,1),gap_1.2s_cubic-bezier(0.25,1,0.5,1),letter-spacing_1.2s_cubic-bezier(0.25,1,0.5,1)] will-change-[font-size,gap]",
                isMinimized ? "text-[1.8rem] tracking-[-0.03em] max-[768px]:text-[1.5rem]" : "text-[clamp(3.8rem,11vw,7.5rem)] tracking-[-0.02em]",
              )}
            >
              <img
                src="/logo-wordmark.png"
                alt="ShowTiva"
                className={cx(LOGO_IMG, isMinimized ? "h-[1.3rem]" : "h-[clamp(2.74rem,7.92vw,5.4rem)]")}
              />
            </h1>
          </Link>
        </div>

        {/* Bottom banner bar */}
        <div className={cx(WRITEUP, isMinimized ? WRITEUP_STATE.active : WRITEUP_STATE.intro)}>
          <div className="flex max-w-[75%] items-center gap-[25px] max-[768px]:max-w-full max-[768px]:flex-col max-[768px]:items-center max-[768px]:gap-[10px]">
            <h2 className="m-0 text-[clamp(1.4rem,2vw,1.8rem)] leading-[1.2] font-extrabold tracking-[-0.01em] whitespace-nowrap text-ink max-[768px]:text-[1.4rem] max-[768px]:whitespace-normal">
              {content.bannerHeadline}
            </h2>
            <span className="inline-block h-7 w-px bg-[rgba(255,255,255,0.15)] max-[768px]:hidden"></span>
            <p className="m-0 font-grotesk text-[0.95rem] leading-[1.5] font-normal text-[#a0a0a8] [text-shadow:0_1px_2px_rgba(0,0,0,0.5)] max-[768px]:text-[0.88rem]">
              {content.bannerDesc}
            </p>
          </div>
          <button type="button" className={CTA}>
            <span>Coming soon</span>
          </button>
        </div>
      </div>
    </main>
  );
}
