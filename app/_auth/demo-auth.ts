const DEMO_AUTH_KEY = "show-tiva-demo-auth";
const DEMO_PROFILE_KEY = "show-tiva-demo-profile";
const DEMO_AUTH_EVENT = "show-tiva-demo-auth-change";

export interface DemoUserProfile {
  name: string;
  email: string;
}

function notifyDemoAuthChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(DEMO_AUTH_EVENT));
}

export function isDemoSignedIn(): boolean {
  if (typeof window === "undefined") return false;

  try {
    return window.localStorage.getItem(DEMO_AUTH_KEY) === "1";
  } catch {
    return false;
  }
}

function fallbackNameFromEmail(email: string): string {
  const local = email.split("@")[0]?.trim();
  if (!local) return "ShowTiva Viewer";

  return local
    .replace(/[._-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getDemoUserProfile(): DemoUserProfile | null {
  if (typeof window === "undefined" || !isDemoSignedIn()) return null;

  try {
    const raw = window.localStorage.getItem(DEMO_PROFILE_KEY);
    if (!raw) return { name: "ShowTiva Viewer", email: "viewer@showtiva.demo" };

    const parsed = JSON.parse(raw) as Partial<DemoUserProfile>;
    const email =
      typeof parsed.email === "string" && parsed.email.trim()
        ? parsed.email.trim()
        : "viewer@showtiva.demo";
    const name =
      typeof parsed.name === "string" && parsed.name.trim()
        ? parsed.name.trim()
        : fallbackNameFromEmail(email);

    return { name, email };
  } catch {
    return { name: "ShowTiva Viewer", email: "viewer@showtiva.demo" };
  }
}

export function markDemoSignedIn(profile?: Partial<DemoUserProfile>): void {
  if (typeof window === "undefined") return;

  try {
    const existing = getDemoUserProfile();
    const email = profile?.email?.trim() || existing?.email || "viewer@showtiva.demo";
    const name =
      profile?.name?.trim() ||
      (profile?.email ? fallbackNameFromEmail(email) : existing?.name) ||
      fallbackNameFromEmail(email);

    window.localStorage.setItem(DEMO_AUTH_KEY, "1");
    window.localStorage.setItem(DEMO_PROFILE_KEY, JSON.stringify({ name, email }));
    notifyDemoAuthChanged();
  } catch {
    // Ignore storage failures; the form can still route like a successful demo.
  }
}

export function markDemoSignedOut(): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(DEMO_AUTH_KEY);
    window.localStorage.removeItem(DEMO_PROFILE_KEY);
    notifyDemoAuthChanged();
  } catch {
    // Ignore storage failures; the UI will stay on the current demo state.
  }
}

export function subscribeDemoAuthChange(callback: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;

  const handleAuthChange = () => callback();
  const handleStorage = (event: StorageEvent) => {
    if (event.key === DEMO_AUTH_KEY || event.key === DEMO_PROFILE_KEY) callback();
  };

  window.addEventListener(DEMO_AUTH_EVENT, handleAuthChange);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(DEMO_AUTH_EVENT, handleAuthChange);
    window.removeEventListener("storage", handleStorage);
  };
}

export function getSignupHref(returnTo?: string): string {
  if (!returnTo) return "/signup";
  return `/signup?returnTo=${encodeURIComponent(returnTo)}`;
}

export function getSafeReturnTo(): string | null {
  if (typeof window === "undefined") return null;

  const value = new URLSearchParams(window.location.search).get("returnTo");
  if (!value || !value.startsWith("/")) return null;

  // Resolve it the way the router will and keep only same-origin targets. A
  // prefix test is not enough: "/\evil.example" passes a "//" check, but the
  // URL parser treats the backslash as a slash and resolves it to
  // http://evil.example/, which the router then hard-navigates to.
  let url: URL;
  try {
    url = new URL(value, window.location.origin);
  } catch {
    return null;
  }
  if (url.origin !== window.location.origin) return null;
  return url.pathname + url.search + url.hash;
}
