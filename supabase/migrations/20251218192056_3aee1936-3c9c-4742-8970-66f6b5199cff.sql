-- Add Gemini AI analysis columns to scan_results table
ALTER TABLE public.scan_results 
ADD COLUMN gemini_response TEXT,
ADD COLUMN gemini_mentioned BOOLEAN DEFAULT FALSE,
ADD COLUMN gemini_cited BOOLEAN DEFAULT FALSE,
ADD COLUMN gemini_competitors TEXT[];