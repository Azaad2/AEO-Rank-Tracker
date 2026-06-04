# Chunk #6 — Resumable Backfill Job

Backfills all historical `scans` through the Chunk #1–#4 pipeline (citations → metrics → recommendations → global_intelligence rollup) without double-counting and with full resume support.

## Core requirements (per your instruction)

1. **Resumable** — interruption-safe; resumes from last completed scan.
2. **Idempotent** — re-running the job produces identical state, never inflates `observation_count` or `citation_frequency` in `global_intelligence`.
3. **Progress-tracked** — every scan's backfill state is recorded; operator can query "what % done, what failed, what's pending".
4. **Batched** — processes N scans per invocation (default 25), respects edge function timeout.

## New table: `backfill_jobs`

Tracks one row per scan being backfilled. Single source of truth for resume + idempotency.

Columns:

- `scan_id` (PK, FK → scans)
- `status` — `pending | in_progress | citations_done | metrics_done | recs_done | rollup_done | completed | failed | skipped`
- `stage_checksums` JSONB — per-stage content hash so we can detect "already processed this exact input" on re-runs
- `error` text, `attempts` int, `last_attempt_at`, `completed_at`, `created_at`, `updated_at`
- Index on `status` for fast "next batch" queries

The status enum is a strict ladder. Resumption picks up at the first non-done stage. Each stage is itself idempotent (see below), so re-entering a stage is safe.

## Idempotency strategy per stage

- **Citations** (`citations` table): delete-then-insert scoped to `scan_result_id` inside a transaction. Same scan twice = same rows.
- **Metrics** (`proprietary_metrics_cache`): already keyed by `(scan_id, metric_period)` — upsert.
- **Recommendations** (`recommendations`): delete `WHERE scan_id = X AND source = 'engine_v1'` then re-insert. Manual user edits preserved by filtering on `source`.
- **Rollup** (`global_intelligence`) — the critical one:
  - Add a new table `global_intelligence_scan_contributions(scan_id, grain_key, observation_count, citation_frequency, contributed_at)` recording exactly what each scan contributed.
  - Rollup writer becomes: `for each grain → upsert global_intelligence delta = (new_value - previous_contribution_for_this_scan)`. So re-running a scan subtracts its old contribution and adds the new one — net effect zero on a clean re-run, correct on a changed re-run.
  - First-time contributions just add. This is what guarantees "never double-count."

## New edge function: `backfill-scans`

`supabase/functions/backfill-scans/index.ts` — invocable by cron or manually.

Body:

```json
{ "batch_size": 25, "max_runtime_seconds": 50, "only_failed": false, "scan_ids": [] }
```

Flow per invocation:

1. Claim up to `batch_size` rows from `backfill_jobs` where `status IN ('pending','failed','in_progress')` using `FOR UPDATE SKIP LOCKED` → mark `in_progress`.
2. For each scan, run stages in order, advancing `status` after each stage commits.
3. On error: set `status='failed'`, increment `attempts`, store `error`. Cap retries at 5.
4. Exit when `max_runtime_seconds` elapses or batch is empty. Always return `{ processed, succeeded, failed, remaining }`.

Auth: `verify_jwt=false`, gated by service-role check + admin role check (existing pattern in `bulk-scan`).

## Seeding the queue

One-time SQL (run as part of the migration) inserts all existing `scans.id` into `backfill_jobs` with `status='pending'`. New scans are NOT auto-enqueued — the live pipeline already runs the same stages on fresh scans.

## Operator surface

- Admin page `/admin/backfill` (new, simple): shows aggregate counts by status, a "Run batch now" button (invokes the edge function), and a table of recent failures with their `error` text.
- Optional cron (commented in `supabase/config.toml` instructions, not auto-enabled) to call `backfill-scans` every 5 minutes.

## Files

- New migration: `backfill_jobs` table + `global_intelligence_scan_contributions` table + grants + RLS (admin-only) + seed insert from `scans`.
- New: `supabase/functions/backfill-scans/index.ts`
- New: `supabase/functions/_shared/backfill.ts` (stage runners; reuse `_shared/citations.ts`, `_shared/metrics.ts`, `_shared/recommendations.ts`, `_shared/intelligence.ts`)
- Edited: `supabase/functions/rollup-intelligence/index.ts` — switch to delta-via-contributions model so live scans and backfill share one idempotent path.
- Edited: `supabase/config.toml` — register `backfill-scans` with `verify_jwt=false`.
- New: `src/pages/admin/Backfill.tsx` (admin-gated, mirrors existing `BulkScan` styling).
- Edited: `src/App.tsx` — add `/admin/backfill` route.

## Acceptance

- Running the job twice on the same scan yields identical `global_intelligence` totals (verified by snapshot-diff).
- Killing the job mid-batch and re-invoking resumes from the next pending scan with no data loss or duplication.
- `backfill_jobs` always reflects truth: `completed` rows are never re-processed unless explicitly re-queued.
- Admin page shows live progress (`X / Y completed, Z failed`).
- No changes to the live scan pipeline's behavior beyond the rollup writer using contributions (which is a strict improvement for live scans too).

## Out of scope

- No changes to dashboard UI.
- No re-classification model changes — backfill uses current `_shared/citations.ts` rules as-is.
- No deletion of legacy `optimization_tasks` data.  
  
  
Approved. Add contribution_hash and engine_version to global_intelligence_scan_contributions so future reprocessing can distinguish between logic versions. Also add processed_rows and estimated_remaining_rows to backfill_jobs for operational visibility. Everything else looks correct. Proceed with implementation