import { supabase } from "@/integrations/supabase/client";

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

    // Track in Google Analytics
    if (window.gtag) {
      window.gtag('event', eventType, {
        ...metadata,
        session_id: sessionId,
      });
    }

    // Track in Supabase (async, non-blocking)
    try {
      await supabase.from('user_activity').insert({
        event_type: eventType,
        event_metadata: metadata || {},
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
