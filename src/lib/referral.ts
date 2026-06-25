// Referral attribution: capture ?ref=CODE from URL, persist for 90 days,
// expose for signup so we can credit affiliates.

const REF_KEY = "aff_ref";
const REF_AT_KEY = "aff_ref_at";
const COOKIE_NAME = "aff_ref";
const COOKIE_DAYS = 90;

const QUERY_KEYS = ["ref", "via", "aff"];

function setCookie(name: string, value: string, days: number) {
  try {
    const d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    const host = window.location.hostname;
    // Set on apex domain when possible so subdomain redirects keep attribution.
    const parts = host.split(".");
    const domainAttr =
      parts.length >= 2 && !/^\d+\.\d+\.\d+\.\d+$/.test(host)
        ? `; domain=.${parts.slice(-2).join(".")}`
        : "";
    document.cookie = `${name}=${encodeURIComponent(
      value
    )}; expires=${d.toUTCString()}; path=/; SameSite=Lax${domainAttr}`;
  } catch {}
}

function getCookie(name: string): string | null {
  try {
    const match = document.cookie
      .split("; ")
      .find((row) => row.startsWith(name + "="));
    return match ? decodeURIComponent(match.split("=")[1]) : null;
  } catch {
    return null;
  }
}

function sanitize(code: string): string | null {
  const cleaned = code.trim().slice(0, 64);
  if (!cleaned) return null;
  if (!/^[a-zA-Z0-9_-]+$/.test(cleaned)) return null;
  return cleaned;
}

/** Capture ?ref= (or ?via=, ?aff=) from the current URL, if present. */
export function captureReferralFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const params = new URLSearchParams(window.location.search);
    for (const key of QUERY_KEYS) {
      const raw = params.get(key);
      if (raw) {
        const code = sanitize(raw);
        if (code) {
          // Last-click attribution: overwrite any existing ref.
          localStorage.setItem(REF_KEY, code);
          localStorage.setItem(REF_AT_KEY, new Date().toISOString());
          setCookie(COOKIE_NAME, code, COOKIE_DAYS);
          return code;
        }
      }
    }
  } catch {}
  return null;
}

/** Read the current referral code from cookie/localStorage, if any. */
export function getReferralCode(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return (
      localStorage.getItem(REF_KEY) || getCookie(COOKIE_NAME) || null
    );
  } catch {
    return getCookie(COOKIE_NAME);
  }
}

export function getReferralCapturedAt(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(REF_AT_KEY);
  } catch {
    return null;
  }
}
