import { logScanError } from "@/lib/errorLogger";

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    posthog?: { capture: (event: string, props?: Record<string, any>) => void };
  }
}

/**
 * Lightweight fire-and-forget analytics for tool pages.
 * Sends to GA4 + PostHog without pulling in the React hook (so it works in
 * plain handlers and non-component code). Never throws.
 */
export function trackToolEvent(event: string, props: Record<string, any> = {}) {
  try {
    if (typeof window === "undefined") return;
    const payload = { ...props, ts: Date.now() };
    window.gtag?.("event", event, payload);
    window.posthog?.capture(event, payload);
  } catch (e) {
    console.debug("trackToolEvent failed:", e);
  }
}

export interface ToolErrorContext {
  tool: string;
  domain?: string | null;
  input?: Record<string, any>;
}

export async function logToolError(error: unknown, ctx: ToolErrorContext) {
  trackToolEvent("tool_scan_failed", {
    tool: ctx.tool,
    domain: ctx.domain ?? null,
    error_message: error instanceof Error ? error.message : String(error),
  });
  try {
    await logScanError({
      error,
      component: ctx.tool,
      errorType: "ToolSubmissionError",
      domain: ctx.domain ?? null,
      metadata: ctx.input ?? {},
    });
  } catch {
    /* never block UI on logging */
  }
}
