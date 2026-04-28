import posthog from 'posthog-js';

// PostHog project API key (publishable — safe for client-side use).
// Replace with your real key from posthog.com after signup.
const POSTHOG_KEY = 'YOUR_POSTHOG_PROJECT_KEY';
const POSTHOG_HOST = 'https://us.i.posthog.com';

let initialized = false;

export function initPostHog() {
  if (typeof window === 'undefined') return;
  if (import.meta.env.DEV) return; // skip in dev
  if (initialized) return;
  if (!POSTHOG_KEY || POSTHOG_KEY === 'YOUR_POSTHOG_PROJECT_KEY') {
    console.warn('[PostHog] No project key set — analytics disabled.');
    return;
  }

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    person_profiles: 'identified_only',
    capture_pageview: true,
    capture_pageleave: true,
  });
  initialized = true;
}

export { posthog };
