import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ABTestVariant {
  key: string;
  value: string;
}

interface UseABTestResult {
  variant: ABTestVariant | null;
  isLoading: boolean;
  trackConversion: (conversionType: string) => void;
}

// Get or create a persistent session ID
function getSessionId(): string {
  const STORAGE_KEY = 'ab_test_session_id';
  let sessionId = localStorage.getItem(STORAGE_KEY);
  
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, sessionId);
  }
  
  return sessionId;
}

// Weighted random selection
function selectVariant(variants: { variant_key: string; variant_value: string; weight: number }[]): { key: string; value: string } {
  const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const variant of variants) {
    random -= variant.weight;
    if (random <= 0) {
      return { key: variant.variant_key, value: variant.variant_value };
    }
  }
  
  // Fallback to first variant
  return { key: variants[0].variant_key, value: variants[0].variant_value };
}

export function useABTest(testName: string): UseABTestResult {
  const [variant, setVariant] = useState<ABTestVariant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const sessionId = getSessionId();

  useEffect(() => {
    async function initTest() {
      try {
        // Check localStorage first for instant loading
        const cachedKey = `ab_test_${testName}`;
        const cached = localStorage.getItem(cachedKey);
        
        if (cached) {
          const parsed = JSON.parse(cached);
          setVariant(parsed);
          setIsLoading(false);
          return;
        }

        // Check if already assigned in DB
        const { data: existingAssignment } = await supabase
          .from('ab_test_assignments')
          .select('variant_key')
          .eq('session_id', sessionId)
          .eq('test_name', testName)
          .maybeSingle();

        if (existingAssignment) {
          // Get the variant value
          const { data: variantData } = await supabase
            .from('ab_test_variants')
            .select('variant_value')
            .eq('test_name', testName)
            .eq('variant_key', existingAssignment.variant_key)
            .maybeSingle();

          if (variantData) {
            const result = { key: existingAssignment.variant_key, value: variantData.variant_value };
            setVariant(result);
            localStorage.setItem(cachedKey, JSON.stringify(result));
          }
        } else {
          // Fetch all variants and randomly assign
          const { data: variants } = await supabase
            .from('ab_test_variants')
            .select('variant_key, variant_value, weight')
            .eq('test_name', testName)
            .eq('is_active', true);

          if (variants && variants.length > 0) {
            const selected = selectVariant(variants);
            
            // Save assignment to DB
            await supabase
              .from('ab_test_assignments')
              .insert({
                session_id: sessionId,
                test_name: testName,
                variant_key: selected.key,
              });

            setVariant(selected);
            localStorage.setItem(cachedKey, JSON.stringify(selected));
          }
        }
      } catch (error) {
        console.error('A/B test initialization error:', error);
        // Fall back to variant A
        setVariant({ key: 'A', value: '' });
      } finally {
        setIsLoading(false);
      }
    }

    initTest();
  }, [testName, sessionId]);

  const trackConversion = useCallback(async (conversionType: string) => {
    if (!variant) return;
    
    try {
      await supabase
        .from('ab_test_conversions')
        .insert({
          session_id: sessionId,
          test_name: testName,
          variant_key: variant.key,
          conversion_type: conversionType,
        });
    } catch (error) {
      console.error('Failed to track conversion:', error);
    }
  }, [variant, sessionId, testName]);

  return { variant, isLoading, trackConversion };
}
