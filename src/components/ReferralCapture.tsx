import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { captureReferralFromUrl } from "@/lib/referral";

/** Mount once inside the router. Captures ?ref= on every navigation. */
export const ReferralCapture = () => {
  const location = useLocation();
  useEffect(() => {
    captureReferralFromUrl();
  }, [location.pathname, location.search]);
  return null;
};
