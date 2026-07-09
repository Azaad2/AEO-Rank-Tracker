// Every future signal source is registered here. Only providers whose row in
// public.intelligence_provider_flags has enabled = true are actually executed.

import type { SignalProvider } from "./types.ts";
import { createInternalProvider } from "./internal.ts";
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

// Stubs for future providers — implement the SignalProvider interface, drop
// them here, and flip their flag row to enable them.
// e.g. createGoogleTrendsProvider(supabase), createRedditProvider(supabase), …

export function buildRegistry(supabase: SupabaseClient): SignalProvider[] {
  return [
    createInternalProvider(supabase),
    // createGoogleTrendsProvider(supabase),
    // createRedditProvider(supabase),
    // createPeopleAlsoAskProvider(supabase),
    // createQuoraProvider(supabase),
    // createNewsProvider(supabase),
    // createCommunityPacksProvider(supabase),
  ];
}
