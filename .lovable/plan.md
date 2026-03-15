

# Replace Razorpay with PayPal Payment Processor

## Overview

Replace the entire Razorpay payment integration with PayPal Subscriptions. PayPal provides a JavaScript SDK for client-side checkout and REST APIs for server-side subscription management.

## Prerequisites

You will need a PayPal Business account with:
- **Client ID** (public, used in frontend SDK)
- **Client Secret** (private, stored as a backend secret)
- Three PayPal subscription plans created in the PayPal dashboard matching Pro ($19/mo), Team ($49/mo), and Agency ($149/mo)

## Changes

### 1. Database Migration
- Add `paypal_plan_id` column to `plans` table (to store PayPal plan IDs)
- Add `paypal_subscription_id` column to `subscriptions` table
- Update plan rows with PayPal plan IDs once provided

### 2. Edge Functions

**Create `create-paypal-subscription/index.ts`**
- Accepts `planId`, `customerEmail`, `userId`
- Uses PayPal REST API to create a subscription
- Returns approval URL for redirect or subscription ID for JS SDK

**Create `verify-paypal-payment/index.ts`**
- Verifies subscription status via PayPal API
- Activates subscription in database (same logic as current verify-razorpay-payment)

**Create `paypal-webhook/index.ts`**
- Handles PayPal webhook events (subscription activated, cancelled, payment failed)
- Verifies webhook signature

### 3. Frontend

**Replace `src/hooks/useRazorpay.ts` → `src/hooks/usePayPal.ts`**
- Uses PayPal JS SDK (`@paypal/react-paypal-js`) or redirect-based flow
- `initiateCheckout()` opens PayPal approval flow
- On approval, calls `verify-paypal-payment` edge function
- `cancelSubscription()` calls PayPal cancel API

**Update `index.html`**
- Remove Razorpay script: `<script src="https://checkout.razorpay.com/v1/checkout.js">`
- Add PayPal SDK script with client ID

**Update `src/pages/Pricing.tsx`**
- Import `usePayPal` instead of `useRazorpay`
- Same checkout flow, just different hook

**Update `src/hooks/useSubscription.ts`**
- Add `paypal_subscription_id` to Subscription interface

### 4. Config
- Add `create-paypal-subscription`, `verify-paypal-payment`, `paypal-webhook` to `supabase/config.toml` with `verify_jwt = false`
- Store `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` as backend secrets

## Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/functions/create-paypal-subscription/index.ts` | Create |
| `supabase/functions/verify-paypal-payment/index.ts` | Create |
| `supabase/functions/paypal-webhook/index.ts` | Create |
| `src/hooks/usePayPal.ts` | Create (replaces useRazorpay) |
| `src/pages/Pricing.tsx` | Update imports |
| `src/hooks/useSubscription.ts` | Update interface |
| `index.html` | Swap SDK scripts |
| `supabase/config.toml` | Add new functions |
| Database migration | Add PayPal columns |

## Secrets Needed
- `PAYPAL_CLIENT_ID` — from PayPal Developer Dashboard
- `PAYPAL_CLIENT_SECRET` — from PayPal Developer Dashboard
- PayPal Plan IDs for Pro, Team, Agency tiers

