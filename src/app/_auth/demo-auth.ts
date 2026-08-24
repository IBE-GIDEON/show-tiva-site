const DEMO_AUTH_KEY = "show-tiva-demo-auth";

export function isDemoSignedIn(): boolean {
  if (typeof window === "undefined") return false;

  try {
    return window.localStorage.getItem(DEMO_AUTH_KEY) === "1";
  } catch {
    return false;
  }
}

export function markDemoSignedIn(): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(DEMO_AUTH_KEY, "1");
  } catch {
    // Ignore storage failures; the form can still route like a successful demo.
  }
}

export function getSignupHref(returnTo?: string): string {
  if (!returnTo) return "/signup";
  return `/signup?returnTo=${encodeURIComponent(returnTo)}`;
}

export function getSafeReturnTo(): string | null {
  if (typeof window === "undefined") return null;

  const value = new URLSearchParams(window.location.search).get("returnTo");
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}
