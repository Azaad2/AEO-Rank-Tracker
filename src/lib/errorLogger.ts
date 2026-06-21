import { supabase } from "@/integrations/supabase/client";

function detectBrowser(): string {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (/Edg\//.test(ua)) return "Edge";
  if (/OPR\//.test(ua)) return "Opera";
  if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) return "Chrome";
  if (/Firefox\//.test(ua)) return "Firefox";
  if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return "Safari";
  return "Other";
}

export interface ScanErrorPayload {
  error: unknown;
  component?: string;
  errorType?: string;
  domain?: string | null;
  userId?: string | null;
  metadata?: Record<string, any>;
}

export async function logScanError({
  error,
  component,
  errorType,
  domain,
  userId,
  metadata = {},
}: ScanErrorPayload): Promise<void> {
  try {
    const err = error as any;
    const message =
      (err && (err.message || err.error_description || err.error)) ||
      (typeof err === "string" ? err : "Unknown error");
    const stack = (err && err.stack) || new Error().stack || null;

    // Resolve user id if not provided
    let resolvedUserId = userId ?? null;
    if (!resolvedUserId) {
      try {
        const { data } = await supabase.auth.getUser();
        resolvedUserId = data.user?.id ?? null;
      } catch {
        resolvedUserId = null;
      }
    }

    await supabase.from("scan_errors").insert({
      user_id: resolvedUserId,
      domain: domain ?? null,
      error_type: errorType ?? err?.name ?? "Error",
      error_message: String(message).slice(0, 2000),
      stack_trace: stack ? String(stack).slice(0, 8000) : null,
      component: component ?? null,
      url: typeof window !== "undefined" ? window.location.href : null,
      browser: detectBrowser(),
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      metadata,
    });
  } catch (e) {
    // Never let logging break the app
    console.debug("logScanError failed:", e);
  }
}

let installed = false;
export function installGlobalErrorHandlers() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  window.addEventListener("error", (event) => {
    // Ignore noisy DOM removeChild errors from browser extensions (Google Translate, etc.)
    const msg = event.message || "";
    logScanError({
      error: event.error || new Error(msg),
      component: "window.onerror",
      errorType: msg.includes("removeChild") ? "DomRemoveChild" : "WindowError",
      metadata: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    logScanError({
      error: event.reason,
      component: "unhandledrejection",
      errorType: "UnhandledRejection",
    });
  });
}
