## Why no email is being sent

SendGrid itself is fine. The bug is in the **frontend wiring**.

There are two email-capture surfaces in the app:

1. `src/components/EmailCaptureModal.tsx` — correctly invokes the `send-scan-complete` edge function after inserting into `customers`.
2. `src/components/ScanResultsModal.tsx` (the inline "unlock" form inside the dark results modal) — inserts the email into `customers` and calls `trackEvent("email_captured", ...)`, but **never calls `supabase.functions.invoke("send-scan-complete", ...)`**.

After the recent dark-theme refactor, the inline unlock form in `ScanResultsModal` is the path real users actually go through, so:

- Row gets created in `customers` ✅
- Activity event tracked ✅
- SendGrid email never triggered ❌
- No logs ever appear for `send-scan-complete` (confirmed: edge function logs are empty)

So this isn't a SendGrid/API key/domain problem — the function is simply never invoked for the main flow.

## Fix

In `src/components/ScanResultsModal.tsx`, inside `handleEmailSubmit`, right after the successful `customers` insert and `trackEvent` call, add the same fire-and-forget invoke that `EmailCaptureModal` uses:

```ts
supabase.functions
  .invoke("send-scan-complete", {
    body: {
      email: email.trim().toLowerCase(),
      domain: scanData.project,
      score: scanData.score,
      scanId: scanData.scanId || null,
    },
  })
  .catch((err) => console.error("send-scan-complete invoke failed:", err));
```

Also update the success toast copy to mention the email was sent (matching `EmailCaptureModal`): "Check your inbox — we sent your scan summary too."

## Verification

After the change:
1. Run a scan, submit email in the results modal.
2. Check `supabase--edge_function_logs` for `send-scan-complete` — should now show a 200.
3. Confirm email arrives from `hello@aimentionyou.com`.

If after the fix logs show a non-200, then it's a SendGrid-side issue (API key, sender verification, suppression) and we'll debug from those logs.

## Out of scope

- No edge function changes.
- No DB / RLS changes.
- No changes to `EmailCaptureModal.tsx` (already correct, just unused on main path).
