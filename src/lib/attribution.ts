// Acquisition source + signup-intent attribution helpers.
// Persists the original traffic source per-browser so that account_created
// events can be cohorted even after OAuth redirects clear referrer state.

const SOURCE_KEY = "acq_source";
const INTENT_KEY = "signup_intent";
const FIRED_PREFIX = "acct_created_fired:";

export type AcquisitionSource =
  | "Direct"
  | "Google"
  | "ChatGPT"
  | "Reddit"
  | "LinkedIn"
  | "Referral";

export function getAcquisitionSource(): AcquisitionSource {
  if (typeof window === "undefined") return "Direct";
  try {
    const stored = localStorage.getItem(SOURCE_KEY) as AcquisitionSource | null;
    if (stored) return stored;

    const params = new URLSearchParams(window.location.search);
    const utm = (params.get("utm_source") || "").toLowerCase();
    const ref = (document.referrer || "").toLowerCase();
    const host = window.location.host.toLowerCase();

    const patterns: Array<[RegExp, AcquisitionSource]> = [
      [/google/, "Google"],
      [/chat\.openai|chatgpt/, "ChatGPT"],
      [/reddit/, "Reddit"],
      [/linkedin|lnkd\.in/, "LinkedIn"],
    ];

    const haystack = utm || ref;
    let source: AcquisitionSource = "Direct";
    for (const [re, name] of patterns) {
      if (haystack && re.test(haystack)) {
        source = name;
        break;
      }
    }
    if (source === "Direct" && ref && !ref.includes(host)) {
      source = "Referral";
    }

    localStorage.setItem(SOURCE_KEY, source);
    return source;
  } catch {
    return "Direct";
  }
}

export interface SignupIntent {
  source_page: string;
  scan_id: string | null;
  acquisition_source: AcquisitionSource;
  saved_at: number;
}

export function saveSignupIntent(extra?: Partial<SignupIntent>) {
  if (typeof window === "undefined") return;
  try {
    let scanId: string | null = null;
    try {
      scanId = localStorage.getItem("pendingScanId");
    } catch {}
    const intent: SignupIntent = {
      source_page: window.location.pathname + window.location.search,
      scan_id: scanId,
      acquisition_source: getAcquisitionSource(),
      saved_at: Date.now(),
      ...extra,
    };
    localStorage.setItem(INTENT_KEY, JSON.stringify(intent));
  } catch {}
}

export function readSignupIntent(): SignupIntent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(INTENT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SignupIntent;
  } catch {
    return null;
  }
}

export function clearSignupIntent() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(INTENT_KEY);
  } catch {}
}

export function markAccountCreatedFired(userId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const key = FIRED_PREFIX + userId;
    if (localStorage.getItem(key)) return false;
    localStorage.setItem(key, "1");
    return true;
  } catch {
    return true;
  }
}
