import { supabase } from "@/integrations/supabase/client";
import { posthog } from "@/lib/posthog";

// Generate or retrieve session ID
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('tracking_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('tracking_session_id', sessionId);
  }
  return sessionId;
};

// Declare gtag function for TypeScript
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

export const useActivityTracking = () => {
  const trackEvent = async (
    eventType: string,
    metadata?: Record<string, any>
  ) => {
    const sessionId = getSessionId();
    const userAgent = navigator.userAgent;
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id ?? null;
    const enrichedMetadata = {
      ...(metadata || {}),
      user_id: userId,
      page_path: window.location.pathname + window.location.search,
    };

    // Track in Google Analytics
    if (window.gtag) {
      window.gtag('event', eventType, {
        ...enrichedMetadata,
        session_id: sessionId,
      });
    }

    // Track in PostHog
    if (typeof window !== 'undefined' && posthog) {
      try {
        posthog.capture(eventType, {
          ...enrichedMetadata,
          session_id: sessionId,
        });
      } catch (error) {
        console.debug('PostHog capture failed:', error);
      }
    }

    // Track in Supabase (async, non-blocking)
    try {
      await (supabase.from('user_activity') as any).insert({
        user_id: userId,
        event_type: eventType,
        event_metadata: enrichedMetadata,
        session_id: sessionId,
        user_agent: userAgent,
      });
    } catch (error) {
      // Silently fail - don't disrupt user experience
      console.debug('Activity tracking failed:', error);
    }
  };

  return { trackEvent };
};
