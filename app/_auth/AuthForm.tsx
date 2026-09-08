"use client";

// Sign-in / sign-up form.
//
// Front-end only: there is no backend, so validation runs entirely in the
// browser and a valid submit just enters the app (/watch). Only the display
// name/email are kept locally for the demo profile menu; passwords are never
// persisted anywhere. Wire the success branch to a real auth call when a
// backend exists.
import { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { cx } from "@/lib/cx";
import type { Brand } from "@/lib/site-types";
import { getSafeReturnTo, markDemoSignedIn } from "./demo-auth";

type Mode = "signin" | "signup";

/* The brand panel cycles through three of the landing videos. */
const AUTH_ANIMATIONS = ["/bg_video_1.mp4", "/bg_video_2.mp4", "/bg_video_4.mp4"];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ------------------------------------------------------------- styling -- */

const FIELD = "flex flex-col gap-2";
const LABEL = "text-[0.74rem] font-semibold tracking-[0.08em] text-[#8a8a8a] uppercase";
const ERROR = "text-[0.82rem] leading-[1.4] text-[#ff7a86]";
const GREY_TEXT_BUTTON =
  "cursor-pointer border-0 bg-transparent text-[0.74rem] font-semibold text-[#8a8a8a] transition-[color] duration-200 ease-[ease] hover:text-ink";
const SWITCH_LINK = "font-semibold text-ink underline underline-offset-[3px] hover:text-[#fc3343]";

/* Primary button: logo red, cut to the logo's 18.43deg on the right edge
   (run = height / 3 = 18px). Straight left, slanted right. */
const SUBMIT =
  "mt-[0.6rem] h-[54px] cursor-pointer rounded-none border-0 bg-[#fc3343] pr-[calc(1.5rem+18px)] pl-6 font-heading text-[0.95rem] font-bold tracking-[0.04em] text-ink uppercase transition-[background,transform] duration-200 ease-[ease] hover:bg-[#ff4552] active:translate-y-px disabled:cursor-default disabled:opacity-60 [clip-path:polygon(0_0,calc(100%-18px)_0,100%_100%,0_100%)]";

interface InputStyle {
  error?: boolean;
  /** The reveal toggle sits inside the field; padding keeps text clear of it. */
  password?: boolean;
  modal?: boolean;
}

function inputClass({ error, password, modal }: InputStyle): string {
  return cx(
    "w-full rounded-[4px] border bg-[#101010] pl-4 text-[1rem] text-ink transition-[border-color,background] duration-200 ease-[ease] placeholder:text-[rgba(255,255,225,0.34)] focus:border-[rgba(255,255,225,0.32)] focus:bg-[#141414] focus:outline-none max-[899px]:bg-[rgba(10,10,10,0.58)] max-[899px]:backdrop-blur-[12px] max-[899px]:focus:bg-[rgba(18,18,18,0.72)]",
    modal ? "h-[50px]" : "h-[52px]",
    password ? "pr-[3.75rem]" : "pr-4",
    error ? "border-[rgba(252,51,67,0.7)]" : "border-[rgba(255,255,225,0.12)]",
  );
}

/* ----------------------------------------------------------- component -- */

interface AuthFormProps {
  mode: Mode;
  brand: Brand;
  surface?: "page" | "modal";
}

interface Errors {
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
}

export default function AuthForm({ mode, brand, surface = "page" }: AuthFormProps) {
  const router = useRouter();
  const isSignup = mode === "signup";
  const isModal = surface === "modal";
  const showAuthShowcase = !isModal;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [pending, setPending] = useState(false);
  const [activeAnimationIndex, setActiveAnimationIndex] = useState(0);

  const activeAnimation = AUTH_ANIMATIONS[activeAnimationIndex];

  function playNextAnimation() {
    setActiveAnimationIndex((index) => (index + 1) % AUTH_ANIMATIONS.length);
  }

  function visitFullPageAuth(event: React.MouseEvent<HTMLAnchorElement>, href: string) {
    if (isModal) return;

    event.preventDefault();
    window.location.assign(href);
  }

  function validate(): Errors {
    const next: Errors = {};
    if (isSignup && name.trim().length < 2) next.name = "Enter your name.";
    if (!EMAIL_RE.test(email.trim())) next.email = "Enter a valid email address.";
    if (password.length < 8) next.password = "Use at least 8 characters.";
    if (isSignup && confirm !== password) next.confirm = "Passwords do not match.";
    return next;
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    // No backend yet: a valid form is treated as success for the demo.
    markDemoSignedIn({
      name: isSignup ? name : undefined,
      email,
    });
    setPending(true);
    const returnTo = getSafeReturnTo();
    if (returnTo) {
      router.replace(returnTo);
      return;
    }

    if (isModal) {
      router.back();
      return;
    }

    router.push("/watch");
  }

  return (
    <div
      className={cx(
        "font-body text-ink",
        isModal
          ? "block min-h-auto bg-transparent"
          : // Brand panel flexes, form column is fixed and comfortable.
            "relative grid min-h-dvh grid-cols-1 bg-black min-[900px]:grid-cols-[1fr_minmax(460px,40vw)]",
      )}
    >
      {/* Brand panel: a video showcase strip on top on narrow screens, a full
          column beside the form from 900px. Not rendered in the modal. */}
      <aside
        className={cx(
          "relative overflow-hidden",
          isModal
            ? "hidden"
            : "isolate flex min-h-[clamp(220px,40vh,360px)] flex-col justify-end border-b border-[rgba(255,255,225,0.12)] bg-[#020202] p-0 max-[899px]:absolute max-[899px]:inset-0 max-[899px]:z-0 max-[899px]:min-h-0 max-[899px]:border-b-0 min-[900px]:min-h-auto min-[900px]:border-r min-[900px]:border-b-0",
        )}
        aria-hidden="true"
      >
        {showAuthShowcase && (
          <div className="absolute inset-0 z-0 overflow-hidden bg-black bg-[image:radial-gradient(90%_70%_at_70%_14%,rgba(252,51,67,0.22)_0%,transparent_55%)]">
            <video
              key={activeAnimation}
              src={activeAnimation}
              autoPlay
              muted
              playsInline
              preload="auto"
              className="absolute inset-0 z-[1] h-full w-full animate-auth-video-in bg-black object-cover object-center opacity-0 contrast-[1.08] saturate-[1.08] will-change-[opacity,transform] [transform:scale(1.025)]"
              onEnded={playNextAnimation}
              onError={playNextAnimation}
            />
            <span className="absolute inset-0 z-[2] bg-[image:linear-gradient(90deg,rgba(0,0,0,0.74)_0%,rgba(0,0,0,0.38)_44%,rgba(0,0,0,0.1)_100%),linear-gradient(180deg,rgba(0,0,0,0.06)_0%,rgba(0,0,0,0.82)_100%)] max-[899px]:bg-[image:linear-gradient(180deg,rgba(0,0,0,0.72)_0%,rgba(0,0,0,0.84)_26%,rgba(0,0,0,0.86)_66%,rgba(0,0,0,0.74)_100%)]" />
          </div>
        )}

        <div className="relative z-[3] w-full max-w-[42ch] p-[clamp(1.5rem,5vw,5.5rem)] min-[900px]:p-[clamp(3rem,6vw,5.5rem)]">
          {/* Below 900px the form panel carries its own lockup directly
              underneath this one, so this is the duplicate and it goes. */}
          <span className="inline-flex items-center gap-[0.6rem] max-[899px]:hidden">
            <img className="block h-[30px] w-auto" src={brand.mark} alt="" />
            <img className="block h-5 w-auto" src={brand.wordmark} alt="" />
          </span>
          <p className="mt-4 text-[1rem] leading-[1.6] text-[rgba(255,255,225,0.76)] [text-shadow:0_2px_22px_rgba(0,0,0,0.72)] max-[899px]:hidden">
            Experience premium stories, hand-drawn 2D animation, and magical worlds curated by creators worldwide.
          </p>
        </div>
      </aside>

      {/* Form panel */}
      <main
        className={cx(
          isModal
            ? "block bg-transparent p-0"
            : "flex items-center justify-center bg-black px-[clamp(1.25rem,5vw,3.5rem)] py-[clamp(2rem,6vw,4rem)] max-[899px]:relative max-[899px]:z-10 max-[899px]:min-h-dvh max-[899px]:bg-transparent",
        )}
      >
        <div className={cx("w-full", isModal ? "max-w-none" : "max-w-[380px]")}>
          {/* The lockup on the form side: only below 900px on the page, where
              the brand panel is hidden; always in the modal. */}
          <Link
            href="/watch"
            className={cx(
              "inline-flex items-center gap-[0.55rem]",
              isModal ? "mb-8 pr-12" : "mb-10 min-[900px]:hidden",
            )}
          >
            <img className="block h-[26px] w-auto" src={brand.mark} alt="" />
            <img className="block h-[17px] w-auto" src={brand.wordmark} alt={brand.wordmarkAlt} />
          </Link>

          <h1
            className={cx(
              "font-heading leading-[1.1] font-semibold tracking-[-0.02em]",
              isModal ? "pr-12 text-[clamp(1.55rem,6vw,2rem)]" : "text-[clamp(1.75rem,3vw,2.25rem)]",
            )}
          >
            {isSignup ? "Create your account" : "Welcome back"}
          </h1>
          <p className={cx("mt-[0.6rem] text-[0.98rem] text-[#8a8a8a]", isModal && "pr-10")}>
            {isSignup
              ? "A few details and you're in."
              : "Sign in to keep watching."}
          </p>

          <form
            className={cx("flex flex-col", isModal ? "mt-7 gap-4" : "mt-9 gap-[1.15rem]")}
            onSubmit={handleSubmit}
            noValidate
          >
            {isSignup && (
              <label className={FIELD}>
                <span className={LABEL}>Name</span>
                <input
                  type="text"
                  className={inputClass({ error: Boolean(errors.name), modal: isModal })}
                  value={name}
                  autoComplete="name"
                  placeholder="Your name"
                  onChange={(e) => setName(e.target.value)}
                  aria-invalid={Boolean(errors.name)}
                />
                {errors.name && <span className={ERROR}>{errors.name}</span>}
              </label>
            )}

            <label className={FIELD}>
              <span className={LABEL}>Email</span>
              <input
                type="email"
                className={inputClass({ error: Boolean(errors.email), modal: isModal })}
                value={email}
                autoComplete="email"
                placeholder="you@example.com"
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={Boolean(errors.email)}
              />
              {errors.email && <span className={ERROR}>{errors.email}</span>}
            </label>

            <label className={FIELD}>
              <span className="flex items-baseline justify-between gap-4">
                <span className={LABEL}>Password</span>
                {!isSignup && (
                  <button
                    type="button"
                    className={cx(GREY_TEXT_BUTTON, "p-0 tracking-[0.02em] pointer-coarse:-my-3 pointer-coarse:px-2 pointer-coarse:py-3")}
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                )}
              </span>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className={inputClass({ error: Boolean(errors.password), password: true, modal: isModal })}
                  value={password}
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  placeholder={isSignup ? "At least 8 characters" : "Your password"}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={Boolean(errors.password)}
                />
                {isSignup && (
                  // Sign-up shows the reveal toggle inside the field; sign-in
                  // uses the one by the label.
                  <button
                    type="button"
                    className={cx(GREY_TEXT_BUTTON, "absolute top-1/2 right-2 px-[0.6rem] py-[0.4rem] [transform:translateY(-50%)] pointer-coarse:px-3 pointer-coarse:py-[0.8rem]")}
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                )}
              </div>
              {errors.password && <span className={ERROR}>{errors.password}</span>}
            </label>

            {isSignup && (
              <label className={FIELD}>
                <span className={LABEL}>Confirm password</span>
                <input
                  type={showPassword ? "text" : "password"}
                  className={inputClass({ error: Boolean(errors.confirm), modal: isModal })}
                  value={confirm}
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  onChange={(e) => setConfirm(e.target.value)}
                  aria-invalid={Boolean(errors.confirm)}
                />
                {errors.confirm && <span className={ERROR}>{errors.confirm}</span>}
              </label>
            )}

            <button type="submit" className={SUBMIT} disabled={pending}>
              <span>{isSignup ? "Create account" : "Sign in"}</span>
            </button>
          </form>

          <p className={cx("text-[0.92rem] text-[#8a8a8a]", isModal ? "mt-[1.35rem]" : "mt-7")}>
            {isSignup ? (
              <>
                Already have an account?{" "}
                <Link href="/signin" className={SWITCH_LINK} onClick={(event) => visitFullPageAuth(event, "/signin")}>
                  Sign in
                </Link>
              </>
            ) : (
              <>
                New to ShowTiva?{" "}
                <Link href="/signup" className={SWITCH_LINK} onClick={(event) => visitFullPageAuth(event, "/signup")}>
                  Create an account
                </Link>
              </>
            )}
          </p>

        </div>
      </main>
    </div>
  );
}
