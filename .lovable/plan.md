# Real 4-Engine Scanning: Gemini, Perplexity, ChatGPT, Claude

## What exists today (verified)

- `supabase/functions/scan/index.ts` queries **Gemini** (direct answer, 40% of score), **Perplexity** (35%), and **Google search + an OpenAI pass that only summarises search results** (25%). OpenAI is not used as a real ChatGPT answer engine today.
- **Claude is not called anywhere.**
- The `scan_results` table already has unused columns for both missing engines: `chatgpt_response/mentioned/cited/competitors` and `claude_response/mentioned/cited/competitors`. No schema change needed for results.
- Keys present: `GOOGLE_AI_API_KEY`, `PERPLEXITY_API_KEY`, `OPENAI_API_KEY`, `SERPER_API_KEY`.

## What I need from you

1. **An Anthropic API key** (`ANTHROPIC_API_KEY`) from console.anthropic.com → API Keys. I'll open a secure form for it when we start building. Everything else is already in place.
2. Nothing else — ChatGPT will use the existing OpenAI key.

## Plan

### 1. Add two real answer engines to the scan function
- `analyzeWithChatGPT(prompt, domain)` — OpenAI Chat Completions asking the model the user's prompt as a real buyer question, then detect brand mention, citation/link, and extract competitor brands (reusing the existing `extractCompetitorBrands` helper).
- `analyzeWithClaude(prompt, domain)` — Anthropic Messages API (`claude-sonnet-4-5`) with the same detection logic.
- Both get the same resilience pattern already used for Gemini: model fallback then graceful null so one failing provider can never zero out a scan.
- Store into the existing `chatgpt_*` and `claude_*` columns; also feed their citation URLs into the existing `citations` pipeline with `engine = 'chatgpt' | 'claude'`.

### 2. Tiered scanning (your choice: 2 engines free, 4 engines paid)
- The scan function resolves the caller's tier from `subscriptions` + `plans`.
- **Guest / free**: run Gemini + Perplexity only. Score computed from those two (re-normalised so a free score is still 0–100 and comparable).
- **Paid (Pro/Team/Agency)**: run all four in parallel per prompt. Weights: Gemini 30%, Perplexity 30%, ChatGPT 25%, Claude 15%, seeded into the existing `engine_weights` table so they're tunable without a redeploy.
- The response tells the client which engines actually ran, so the UI never shows a blank engine as "not mentioned".

### 3. Locked-engine UI (upsell, not confusion)
- Prompt Intelligence, Quick Scan result, Scan Results modal and Ranking Opportunities get a 4-engine row: Gemini, Perplexity, ChatGPT, Claude.
- For free users the ChatGPT and Claude tiles render blurred with a lock and "Unlock ChatGPT + Claude results" → `/pricing`, using the existing `LockedOverlay` pattern.
- Paid users see real per-engine mention/citation status plus which brands each engine recommended instead.

### 4. Live progress during the scan
- `ScanProgressBar` becomes engine-aware: a checklist that ticks off each engine as it returns ("✓ Gemini · ✓ Perplexity · running ChatGPT…"), matching the live-search panel style already used in Prompt Intelligence.

## Technical notes

- Four engines × N prompts is a lot of concurrent calls; each prompt's four engine calls run in parallel and prompts stay sequential with the existing small delay, keeping paid scans in the ~30–60s range for 3–5 prompts.
- Anthropic has no web search, so Claude measures *trained-in brand knowledge* while Perplexity measures *live citation behaviour* — I'll label them that way in the UI so the difference is obvious rather than looking like a bug.
- Scoring stays backward compatible: old scans keep their stored score; only new scans use the 4-engine weighting.
- Usage metering (`scans_used`, `prompts_used`) and the existing limit enforcement are unchanged.
