import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const GUEST_SCAN_KEY = 'guest_scan_date';

// Generate a lightweight browser fingerprint
function generateFingerprint(): string {
  const components = [
    navigator.userAgent,
    screen.width + 'x' + screen.height,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.language,
  ];
  
  // Simple hash function
  const str = components.join('|');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

export function useGuestScans() {
  const [hasUsedFreeScan, setHasUsedFreeScan] = useState(false);
  const [fingerprint] = useState(() => generateFingerprint());

  useEffect(() => {
    // Check localStorage for today's scan
    const lastScanDate = localStorage.getItem(GUEST_SCAN_KEY);
    const today = new Date().toISOString().split('T')[0];
    
    if (lastScanDate === today) {
      setHasUsedFreeScan(true);
    }
  }, []);

  const canScan = useCallback(() => {
    const lastScanDate = localStorage.getItem(GUEST_SCAN_KEY);
    const today = new Date().toISOString().split('T')[0];
    return lastScanDate !== today;
  }, []);

  const recordGuestScan = useCallback(async (scanId?: string) => {
    const today = new Date().toISOString().split('T')[0];
    
    // Store in localStorage
    localStorage.setItem(GUEST_SCAN_KEY, today);
    setHasUsedFreeScan(true);
    
    // Also record in database for server-side validation
    try {
      await supabase.from('guest_scans').insert({
        fingerprint,
        scan_date: today,
        scan_id: scanId || null,
      });
    } catch (error) {
      // Silently fail - localStorage is the primary check
      console.error('Failed to record guest scan:', error);
    }
  }, [fingerprint]);

  const resetForNewDay = useCallback(() => {
    const lastScanDate = localStorage.getItem(GUEST_SCAN_KEY);
    const today = new Date().toISOString().split('T')[0];
    
    if (lastScanDate && lastScanDate !== today) {
      localStorage.removeItem(GUEST_SCAN_KEY);
      setHasUsedFreeScan(false);
    }
  }, []);

  return {
    hasUsedFreeScan,
    canScan,
    recordGuestScan,
    resetForNewDay,
    fingerprint,
  };
}
