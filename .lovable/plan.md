
# Razorpay Payment Integration Plan

## Overview
Integrate Razorpay subscription payments to enable users to upgrade from the Free tier to Pro, Team, or Agency plans. This will include:
- Creating Razorpay plans that mirror your existing database plans
- Checkout flow for subscription purchases
- Webhook handling for payment events
- Subscription management in the dashboard

---

## Architecture

```text
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│   Pricing Page  │────▶│  create-subscription │────▶│   Razorpay API  │
│   (Frontend)    │     │   (Edge Function)    │     │                 │
└─────────────────┘     └──────────────────────┘     └────────┬────────┘
                                                              │
┌─────────────────┐     ┌──────────────────────┐              │
│   Database      │◀────│  razorpay-webhook    │◀─────────────┘
│  subscriptions  │     │   (Edge Function)    │   (Payment Events)
└─────────────────┘     └──────────────────────┘
```

---

## Implementation Steps

### Phase 1: Setup & Configuration

**1.1 Add Razorpay API Secrets**
- `RAZORPAY_KEY_ID` - Your Razorpay API Key ID
- `RAZORPAY_KEY_SECRET` - Your Razorpay API Secret

**1.2 Database Migration**
Add a `razorpay_plan_id` column to the `plans` table to store the corresponding Razorpay plan IDs:
```sql
ALTER TABLE plans ADD COLUMN razorpay_plan_id text;
```

---

### Phase 2: Edge Functions

**2.1 Create Subscription Edge Function (`create-razorpay-subscription`)**
- Receives: `planId`, `customerEmail`, `userId` (optional)
- Creates or retrieves Razorpay customer
- Creates Razorpay subscription
- Returns `subscription_id` for checkout popup

**2.2 Razorpay Webhook Handler (`razorpay-webhook`)**
Handles these events:
- `subscription.authenticated` - Subscription created, pending first payment
- `subscription.activated` - First payment successful
- `subscription.charged` - Recurring payment successful
- `subscription.cancelled` - User cancelled subscription
- `subscription.paused` / `subscription.resumed`

**2.3 Verify Payment Edge Function (`verify-razorpay-payment`)**
- Verifies payment signature after checkout
- Updates subscription status in database

---

### Phase 3: Frontend Integration

**3.1 Load Razorpay Checkout SDK**
Add the Razorpay script to `index.html`:
```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

**3.2 Create `useRazorpay` Hook**
Custom hook for:
- Opening Razorpay checkout popup
- Handling payment success/failure callbacks
- Verifying payment with backend

**3.3 Update Pricing Page**
- Replace placeholder CTAs with actual checkout buttons
- Show loading states during checkout
- Handle success/failure redirects

**3.4 Dashboard Subscription Management**
- Display current plan and billing period
- Add cancel subscription option
- Show payment history (future enhancement)

---

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/create-razorpay-subscription/index.ts` | Creates Razorpay subscription |
| `supabase/functions/razorpay-webhook/index.ts` | Handles payment events |
| `supabase/functions/verify-razorpay-payment/index.ts` | Verifies payment signature |
| `src/hooks/useRazorpay.ts` | Frontend checkout logic |

---

## Files to Modify

| File | Changes |
|------|---------|
| `index.html` | Add Razorpay SDK script |
| `src/pages/Pricing.tsx` | Add checkout functionality to plan buttons |
| `src/components/dashboard/UserProfile.tsx` | Add subscription management |
| `src/hooks/useSubscription.ts` | Add upgrade/cancel methods |

---

## Technical Details

### Razorpay Checkout Options
```javascript
{
  key: "RAZORPAY_KEY_ID",
  subscription_id: "sub_xxxxx",
  name: "AI Mention You",
  description: "Pro Plan - Monthly",
  prefill: {
    email: "user@example.com"
  },
  handler: function(response) {
    // Verify payment with backend
  }
}
```

### Webhook Signature Verification
```javascript
const crypto = require('crypto');
const generated_signature = crypto
  .createHmac('sha256', webhookSecret)
  .update(JSON.stringify(payload))
  .digest('hex');

if (generated_signature === razorpay_signature) {
  // Valid webhook
}
```

---

## Security Considerations

1. **Never expose `RAZORPAY_KEY_SECRET`** - Only use in edge functions
2. **Verify all webhook signatures** - Prevent fake payment events
3. **Verify payment client-side** - Double-check with backend after checkout
4. **Use HTTPS** - All communication with Razorpay must be secure

---

## Testing Flow

1. Use Razorpay test mode credentials
2. Test card: `4111 1111 1111 1111` (any future date, any CVV)
3. Test the full flow:
   - Click upgrade → Checkout opens → Complete payment → Webhook fires → Subscription activated

---

## Prerequisites Before Implementation

1. **Razorpay Account Required** - You'll need to sign up at razorpay.com
2. **Create Plans in Razorpay Dashboard** - Create corresponding plans for Pro ($19), Team ($49), Agency ($149)
3. **Get API Keys** - From Razorpay Dashboard → Settings → API Keys
4. **Configure Webhook URL** - Set to your edge function URL in Razorpay Dashboard

---

## Post-Implementation

After setup, you'll need to:
1. Add Razorpay plan IDs to your database `plans` table
2. Configure webhook URL in Razorpay Dashboard
3. Test in sandbox mode before going live
