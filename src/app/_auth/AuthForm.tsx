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

import type { Brand } from "@/lib/site-types";
import { getSafeReturnTo, markDemoSignedIn } from "./demo-auth";
import styles from "./auth.module.css";

type Mode = "signin" | "signup";

const AUTH_ANIMATIONS = [
  {
    src: "/bg_video_1.mp4",
    className: "authVideoOne",
  },
  {
    src: "/bg_video_2.mp4",
    className: "authVideoTwo",
  },
  {
    src: "/bg_video_4.mp4",
    className: "authVideoFour",
  },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    <div className={`${styles.page} ${isModal ? styles.modalPage : ""}`}>
      {/* Brand panel — hidden on narrow screens. */}
      <aside className={`${styles.brandPanel} ${showAuthShowcase ? styles.signupBrandPanel : ""}`} aria-hidden="true">
        {showAuthShowcase && (
          <div className={styles.signupShowcase}>
            <video
              key={activeAnimation.src}
              src={activeAnimation.src}
              autoPlay
              muted
              playsInline
              preload="auto"
              className={`${styles.authVideo} ${styles[activeAnimation.className]}`}
              onEnded={playNextAnimation}
              onError={playNextAnimation}
            />
            <span className={styles.signupShade} />
          </div>
        )}

        <div className={`${styles.brandInner} ${showAuthShowcase ? styles.signupBrandInner : ""}`}>
          <span className={styles.lockup}>
            <img className={styles.lockupMark} src={brand.mark} alt="" />
            <img className={styles.lockupWord} src={brand.wordmark} alt="" />
          </span>
          <p className={styles.brandSub}>
            Experience premium stories, hand-drawn 2D animation, and magical worlds curated by creators worldwide.
          </p>
        </div>
        <span className={styles.brandGlow} />
      </aside>

      {/* Form panel */}
      <main className={styles.formPanel}>
        <div className={styles.formInner}>
          <Link href="/watch" className={styles.mobileLockup}>
            <img className={styles.lockupMark} src={brand.mark} alt="" />
            <img className={styles.lockupWord} src={brand.wordmark} alt={brand.wordmarkAlt} />
          </Link>

          <h1 className={styles.title}>
            {isSignup ? "Create your account" : "Welcome back"}
          </h1>
          <p className={styles.subtitle}>
            {isSignup
              ? "A few details and you're in."
              : "Sign in to keep watching."}
          </p>

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            {isSignup && (
              <label className={styles.field}>
                <span className={styles.label}>Name</span>
                <input
                  type="text"
                  className={`${styles.input} ${errors.name ? styles.inputError : ""}`}
                  value={name}
                  autoComplete="name"
                  placeholder="Your name"
                  onChange={(e) => setName(e.target.value)}
                  aria-invalid={Boolean(errors.name)}
                />
                {errors.name && <span className={styles.error}>{errors.name}</span>}
              </label>
            )}

            <label className={styles.field}>
              <span className={styles.label}>Email</span>
              <input
                type="email"
                className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
                value={email}
                autoComplete="email"
                placeholder="you@example.com"
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={Boolean(errors.email)}
              />
              {errors.email && <span className={styles.error}>{errors.email}</span>}
            </label>

            <label className={styles.field}>
              <span className={styles.labelRow}>
                <span className={styles.label}>Password</span>
                {!isSignup && (
                  <button
                    type="button"
                    className={styles.forgot}
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                )}
              </span>
              <div className={styles.passwordWrap}>
                <input
                  type={showPassword ? "text" : "password"}
                  className={`${styles.input} ${errors.password ? styles.inputError : ""}`}
                  value={password}
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  placeholder={isSignup ? "At least 8 characters" : "Your password"}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={Boolean(errors.password)}
                />
                {isSignup && (
                  <button
                    type="button"
                    className={styles.reveal}
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                )}
              </div>
              {errors.password && <span className={styles.error}>{errors.password}</span>}
            </label>

            {isSignup && (
              <label className={styles.field}>
                <span className={styles.label}>Confirm password</span>
                <input
                  type={showPassword ? "text" : "password"}
                  className={`${styles.input} ${errors.confirm ? styles.inputError : ""}`}
                  value={confirm}
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  onChange={(e) => setConfirm(e.target.value)}
                  aria-invalid={Boolean(errors.confirm)}
                />
                {errors.confirm && <span className={styles.error}>{errors.confirm}</span>}
              </label>
            )}

            <button type="submit" className={styles.submit} disabled={pending}>
              <span>{isSignup ? "Create account" : "Sign in"}</span>
            </button>
          </form>

          <p className={styles.switch}>
            {isSignup ? (
              <>
                Already have an account?{" "}
                <Link href="/signin" onClick={(event) => visitFullPageAuth(event, "/signin")}>
                  Sign in
                </Link>
              </>
            ) : (
              <>
                New to Show Tiva?{" "}
                <Link href="/signup" onClick={(event) => visitFullPageAuth(event, "/signup")}>
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
