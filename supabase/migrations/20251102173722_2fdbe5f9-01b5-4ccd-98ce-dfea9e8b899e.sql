-- Create scans table
CREATE TABLE IF NOT EXISTS scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_domain TEXT NOT NULL,
  prompts TEXT[] NOT NULL,
  market TEXT NOT NULL DEFAULT 'en-US',
  score INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create scan_results table
CREATE TABLE IF NOT EXISTS scan_results (
  id BIGSERIAL PRIMARY KEY,
  scan_id UUID NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  mentioned BOOLEAN,
  cited BOOLEAN,
  citation_rank INT,
  top_cited_domains TEXT[],
  used_results TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_results ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (MVP - no auth required)
CREATE POLICY "allow_public_select_scans" ON scans
  FOR SELECT USING (true);

CREATE POLICY "allow_public_insert_scans" ON scans
  FOR INSERT WITH CHECK (true);

CREATE POLICY "allow_public_select_results" ON scan_results
  FOR SELECT USING (true);

CREATE POLICY "allow_public_insert_results" ON scan_results
  FOR INSERT WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_scan_results_scan_id ON scan_results(scan_id);