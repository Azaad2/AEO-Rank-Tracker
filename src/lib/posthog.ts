import posthog from "posthog-js";

// PostHog project API key (publishable — safe for client-side use).
const POSTHOG_KEY = "phc_kHu7YDi8VUGeTAce6CM5Qi88wLsymR6TAqeR2NdJYPw9";
const POSTHOG_HOST = "https://us.i.posthog.com";

let initialized = false;

export function initPostHog() {
  if (typeof window === "undefined") return;
  if (import.meta.env.DEV) return; // skip in dev
  if (initialized) return;
  if (!POSTHOG_KEY) {
    console.warn("[PostHog] No project key set — analytics disabled.");
    return;
  }

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    person_profiles: "identified_only",
    capture_pageview: true,
    capture_pageleave: true,
  });
  initialized = true;
}

export { posthog };
    capture_pageleave: true,
  });
  initialized = true;
}

export { posthog };
