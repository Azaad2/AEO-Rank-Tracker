## Plan: Activate Razorpay payments

Good news — your project already has a **complete Razorpay integration** built. Plans, edge functions, webhook, hook, and DB columns all exist. We just need to wire the Pricing page back to it (it's currently calling PayPal) and confirm the Razorpay SDK script is loaded.

### What's already there (no work needed)
- DB: `plans.razorpay_plan_id` populated for Pro (`plan_SCokLVuHjsAOlA`), Team (`plan_SBwr5Gm88JWwPg`), Agency (`plan_SBwrxIPmX3DWK0`)
- DB: `subscriptions.razorpay_subscription_id` column
- Edge functions: `create-razorpay-subscription`, `verify-razorpay-payment`, `razorpay-webhook` (all with `verify_jwt = false` in `config.toml`)
- Hook: `src/hooks/useRazorpay.ts` (opens Razorpay checkout overlay, verifies payment, handles failures)
- Secrets configured: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`

### What needs to change

**1. `src/pages/Pricing.tsx` — switch from PayPal to Razorpay**
- Replace `import { usePayPal } from "@/hooks/usePayPal"` with `useRazorpay`
- Replace the `usePayPal({...})` destructure: drop `verifySubscription` (Razorpay verifies inline in the modal handler), keep `initiateCheckout` and `isLoading`
- Remove the PayPal return-redirect `useEffect` (lines 161–175) — Razorpay uses an overlay modal, no redirect/return flow
- `handlePlanSelect` keeps the same signature; `initiateCheckout(planId, email, userId)` already matches

**2. `index.html` — load the Razorpay checkout SDK**
Add `<script src="https://checkout.razorpay.com/v1/checkout.js"></script>` in `<head>` so `window.Razorpay` is available when `useRazorpay` runs (the hook already throws a clear error if it's missing).

**3. `src/components/UpgradeModal.tsx`**
Check it for any PayPal references and switch to `useRazorpay` the same way as Pricing (will verify when implementing).

**4. Razorpay dashboard — webhook URL (manual step you'll do)**
After deploy, register this webhook URL in your Razorpay dashboard (Settings → Webhooks):
`https://sxcsbqglcmwbueztpvei.supabase.co/functions/v1/razorpay-webhook`
Subscribe to events: `subscription.activated`, `subscription.charged`, `subscription.cancelled`, `subscription.completed`, `payment.failed`. Use the same secret you stored in `RAZORPAY_WEBHOOK_SECRET`.

### Optional cleanup (recommended, but I'll only do it if you say yes)
Remove the now-unused PayPal stack so the codebase has one billing path:
- Delete `src/hooks/usePayPal.ts`
- Delete edge functions: `create-paypal-subscription`, `verify-paypal-payment`, `paypal-webhook`
- Drop unused `paypal_plan_id` column from `plans` and `paypal_subscription_id` from `subscriptions` (data is empty)
- Remove `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` secrets

### One thing to confirm before I proceed
**Are you using Razorpay Live keys or Test keys right now?** The hook will work either way, but the existing `razorpay_plan_id`s in your `plans` table must match the same mode. If they're test plans and your secrets are live (or vice versa), checkout will fail with "plan not found." If unsure, I'll point you at how to verify in the Razorpay dashboard.

### Note on Razorpay availability
Razorpay primarily serves businesses with an Indian entity. If your business isn't registered in India and you can't onboard, let me know and I'll switch the plan to Lovable's built-in Paddle instead (recommended for global SaaS — handles VAT/tax/MoR automatically).

Reply "go ahead" and I'll execute steps 1–3 (and the cleanup if you also say yes to it).
