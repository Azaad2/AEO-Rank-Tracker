// Isolated interface every intelligence source implements. Adding a new
// provider never requires changes in the dashboard or the derivation views.

export interface SignalRow {
  prompt_template_hash: string;
  day: string;                    // YYYY-MM-DD
  industry_id: string | null;
  scan_count: number;
  citation_frequency: number;
  distinct_brands: number;
  distinct_domains: number;
  engines: string[];
  top_brands: Array<{ brand: string; count: number }>;
  top_domains: Array<{ domain: string; count: number }>;
}

export interface DisplaySample {
  prompt_template_hash: string;
  display_text: string;
  sample_count: number;
}

export interface SignalProvider {
  key: string;                                // matches intelligence_provider_flags.provider
  fetchDaily(sinceDays: number): Promise<{ rows: SignalRow[]; displays: DisplaySample[] }>;
}
