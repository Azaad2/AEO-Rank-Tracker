# intelligence-refresh

Nightly (and admin-callable) job that turns anonymized scan data in
`global_intelligence` into the derived views that power the AI Market
Intelligence dashboard.

## Signal-source architecture

Every intelligence source is isolated behind the `SignalProvider` interface
in `signals/types.ts`. Adding a new source (Google Trends, Reddit, Quora,
News, Community Prompt Packs, competitor crawlers, …) is a matter of:

1. Implement `SignalProvider` in `signals/external/<name>.ts`.
2. Register it in `signals/registry.ts`.
3. Flip its row in `public.intelligence_provider_flags` to `enabled = true`.

The dashboard never has to change — it reads only from the derived views.

## v1 status

- `internal_scans` (first-party): **enabled**, sole source of the network
  effect data described in the "Powered by AI Mention You" card.
- All external providers are wired but disabled behind their flag row.
