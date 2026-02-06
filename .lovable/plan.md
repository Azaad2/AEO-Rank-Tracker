

# Fix Razorpay Inline Checkout Popup

## Problem

The Razorpay checkout fails because the frontend cannot access the `VITE_RAZORPAY_KEY_ID` environment variable. This causes the system to fall back to opening the `shortUrl`, which shows "Hosted page not available" error.

The subscription is being created correctly by the edge function - the issue is only with opening the checkout popup.

## Solution

Return the Razorpay Key ID from the edge function so the frontend can use it to initialize the inline checkout popup. The Key ID is a **public key** (meant to be used in browsers), so this is completely safe.

## Changes Required

### 1. Edge Function: `create-razorpay-subscription`

Add `keyId` to the response:

| Line | Current | New |
|------|---------|-----|
| 154-161 | Returns `subscriptionId`, `shortUrl`, `status`, `customerId` | Add `keyId: RAZORPAY_KEY_ID` to response |

### 2. Frontend Hook: `useRazorpay.ts`

Use the key from the API response instead of environment variable:

| Line | Current | New |
|------|---------|-----|
| 44 | `const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID` | `const razorpayKey = data.keyId` |

## How It Will Work After Fix

```text
1. User clicks "Upgrade to Pro"
   ↓
2. Edge function creates subscription via Razorpay API
   ↓
3. Returns: subscriptionId, shortUrl, keyId (NEW!)
   ↓
4. Frontend uses keyId to initialize Razorpay SDK
   ↓
5. Inline checkout popup opens ✓
   ↓
6. User completes payment
   ↓
7. Webhook updates subscription in database
```

## Why This Works

- The `RAZORPAY_KEY_ID` is already available in the edge function (line 9)
- It's a public key designed for client-side use
- No security risk - Razorpay explicitly designs this key to be exposed
- The secret key (`RAZORPAY_KEY_SECRET`) stays server-side only

## Files Modified

| File | Change |
|------|--------|
| `supabase/functions/create-razorpay-subscription/index.ts` | Add `keyId` to response JSON |
| `src/hooks/useRazorpay.ts` | Use `data.keyId` instead of environment variable |

