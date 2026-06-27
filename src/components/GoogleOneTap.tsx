import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useActivityTracking } from "@/hooks/useActivityTracking";
import { toast } from "sonner";

declare global {
  interface Window {
    google?: any;
    __googleOneTapInitialized?: boolean;
  }
}

const GSI_SRC = "https://accounts.google.com/gsi/client";
const SESSION_KEY = "googleOneTapShown";
const DISMISS_KEY = "googleOneTapDismissedAt";
const DISMISS_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

async function sha256(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function loadGsiScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${GSI_SRC}"]`)) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = GSI_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Google Identity Services"));
    document.head.appendChild(s);
  });
}

export const GoogleOneTap = () => {
  const { user, isLoading } = useAuth();
  const { trackEvent } = useActivityTracking();
  const startedRef = useRef(false);

  useEffect(() => {
    if (isLoading || user || startedRef.current) return;

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
    if (!clientId) {
      // No-op when not configured. Add VITE_GOOGLE_CLIENT_ID to enable.
      return;
    }

    // Session-level "shown once" guard.
    try {
      if (sessionStorage.getItem(SESSION_KEY)) return;
    } catch {}

    // 7-day dismissal guard.
    try {
      const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
      if (dismissedAt && Date.now() - dismissedAt < DISMISS_WINDOW_MS) return;
    } catch {}

    startedRef.current = true;

    let cancelled = false;

    (async () => {
      try {
        await loadGsiScript();
        if (cancelled || !window.google?.accounts?.id) return;

        const rawNonce = crypto.randomUUID() + crypto.randomUUID();
        const hashedNonce = await sha256(rawNonce);

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response: { credential: string }) => {
            try {
              trackEvent("google_one_tap_clicked", {});
              const { error } = await supabase.auth.signInWithIdToken({
                provider: "google",
                token: response.credential,
                nonce: rawNonce,
              });
              if (error) throw error;

              trackEvent("google_one_tap_success", {});
              toast.success("You're signed in. Your scans will now be saved automatically.");

              try {
                window.google?.accounts?.id?.cancel();
              } catch {}
            } catch (err) {
              console.debug("One Tap sign-in failed:", err);
              toast.error("Google sign-in failed. Please try again.");
            }
          },
          nonce: hashedNonce,
          use_fedcm_for_prompt: true,
          auto_select: false,
          cancel_on_tap_outside: false,
          itp_support: true,
        });

        try {
          sessionStorage.setItem(SESSION_KEY, "1");
        } catch {}

        window.google.accounts.id.prompt((notification: any) => {
          try {
            if (notification.isDisplayed?.()) {
              trackEvent("google_one_tap_shown", {});
            }
            if (
              notification.isSkippedMoment?.() ||
              notification.isDismissedMoment?.()
            ) {
              const reason =
                notification.getDismissedReason?.() ||
                notification.getSkippedReason?.() ||
                "unknown";
              trackEvent("google_one_tap_dismissed", { reason });
              try {
                localStorage.setItem(DISMISS_KEY, String(Date.now()));
              } catch {}
            }
          } catch (e) {
            console.debug("One Tap notification handler error:", e);
          }
        });
      } catch (err) {
        console.debug("One Tap init failed:", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, isLoading, trackEvent]);

  // Hide prompt once authenticated (covers other-tab sign-in too).
  useEffect(() => {
    if (user) {
      try {
        window.google?.accounts?.id?.cancel();
      } catch {}
    }
  }, [user]);

  return null;
};

export default GoogleOneTap;
