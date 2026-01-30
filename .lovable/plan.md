
# Monetization Implementation Plan
## Build Pricing Page & Subscription System like Otterly.ai/Profound

---

## Current State Analysis

Your project already has:
- Email capture flow with gated results
- `customers` table with Stripe fields (`stripe_customer_id`, `stripe_session_id`, `paid_at`)
- `scans` table tracking usage
- PDF report generation ($9 one-time upsell concept)
- Razorpay designated as payment processor (per project memory)

---

## Proposed Pricing Tiers (10x Cheaper Strategy)

| Tier | Price | Scans/mo | Prompts | Key Features |
|------|-------|----------|---------|--------------|
| **Free** | $0 | 1/day | 5 | Email-gated results, 1 prompt visible |
| **Pro** | $19/mo | 10 | 50 | Full results, CSV export, Slack alerts, API access |
| **Team** | $49/mo | 30 | 150 | Everything + white-label reports, priority support |
| **Agency** | $149/mo | Unlimited | 500 | Multi-domain dashboard, custom branding |

**Add-ons:**
- $9 one-time PDF report (keep existing)
- $0.15/extra prompt over limit

---

## Implementation Phases

### Phase 1: Database Schema Updates

Create subscription tracking tables:

**Table: `subscriptions`**
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| customer_id | uuid | FK to customers |
| plan_id | text | free, pro, team, agency |
| status | text | active, cancelled, past_due |
| razorpay_subscription_id | text | Razorpay reference |
| current_period_start | timestamp | Billing period start |
| current_period_end | timestamp | Billing period end |
| prompts_used | integer | Monthly prompt counter |
| scans_used | integer | Monthly scan counter |
| created_at | timestamp | Creation time |

**Table: `plans`**
| Column | Type | Description |
|--------|------|-------------|
| id | text | free, pro, team, agency |
| name | text | Display name |
| price_monthly | integer | Price in cents |
| scans_limit | integer | Monthly scans |
| prompts_limit | integer | Monthly prompts |
| features | jsonb | Feature flags |

---

### Phase 2: Pricing Page Component

Create `src/pages/Pricing.tsx`:

```text
+----------------------------------------------------------+
|              Choose Your AI Visibility Plan               |
|        10x cheaper than Otterly.ai & Profound            |
+----------------------------------------------------------+

+------------+  +------------+  +------------+  +------------+
|   FREE     |  |   PRO      |  |   TEAM     |  |  AGENCY    |
|   $0/mo    |  |   $19/mo   |  |   $49/mo   |  |  $149/mo   |
|            |  |   POPULAR  |  |            |  |            |
| 1 scan/day |  | 10 scans   |  | 30 scans   |  | Unlimited  |
| 5 prompts  |  | 50 prompts |  | 150 prompts|  | 500 prompts|
|            |  |            |  |            |  |            |
| Basic      |  | Full data  |  | White-label|  | Multi-site |
| results    |  | + Export   |  | + Reports  |  | Dashboard  |
|            |  | + Slack    |  | + Priority |  | + API      |
|            |  | + API      |  |            |  | + Branding |
|            |  |            |  |            |  |            |
| [Get Free] |  | [Upgrade]  |  | [Upgrade]  |  | [Contact]  |
+------------+  +------------+  +------------+  +------------+

+----------------------------------------------------------+
|          Why We're 10x Cheaper                            |
|----------------------------------------------------------|
| Us: $19/mo for 50 prompts                                |
| Otterly: $49/mo for 30 prompts                           |
| Profound: $99/mo for 100 queries                         |
+----------------------------------------------------------+
```

---

### Phase 3: Usage Tracking System

Update scan logic to:
1. Check subscription limits before allowing scan
2. Increment `prompts_used` and `scans_used` counters
3. Reset counters on billing period change
4. Show usage in results modal

**Add to `ScanResultsModal`:**
```text
+------------------------------------+
| Usage: 8/50 prompts | 3/10 scans  |
| [Upgrade for more]                 |
+------------------------------------+
```

---

### Phase 4: Razorpay Integration Edge Function

Create `supabase/functions/create-subscription/index.ts`:
- Accept plan selection
- Create Razorpay subscription
- Return checkout URL
- Handle webhook for payment confirmation

Create `supabase/functions/razorpay-webhook/index.ts`:
- Verify webhook signature
- Update subscription status
- Handle renewals/cancellations

---

### Phase 5: Upgrade CTAs Throughout App

Add upgrade prompts in:
1. **Results Modal** - "Upgrade to see all results"
2. **Scan Form** - "You've used 5/5 daily prompts"
3. **Header** - Current plan indicator + "Upgrade" button
4. **Optimization Hub** - "Pro feature" badges

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/pages/Pricing.tsx` | Main pricing page with tier comparison |
| `src/components/SubscriptionStatus.tsx` | Usage display component |
| `src/components/UpgradeModal.tsx` | Upgrade CTA modal |
| `src/hooks/useSubscription.ts` | Subscription state hook |
| `supabase/functions/create-subscription/index.ts` | Razorpay checkout |
| `supabase/functions/razorpay-webhook/index.ts` | Payment webhooks |

## Files to Modify

| File | Changes |
|------|---------|
| `src/App.tsx` | Add /pricing route |
| `src/components/Header.tsx` | Add pricing link + plan indicator |
| `src/pages/Index.tsx` | Check subscription limits before scan |
| `src/components/ScanResultsModal.tsx` | Show usage + upgrade CTAs |
| `supabase/config.toml` | Add new edge functions |

---

## Database Migration SQL

```sql
-- Plans reference table
CREATE TABLE public.plans (
  id text PRIMARY KEY,
  name text NOT NULL,
  price_monthly integer NOT NULL DEFAULT 0,
  scans_limit integer NOT NULL DEFAULT 1,
  prompts_limit integer NOT NULL DEFAULT 5,
  features jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now()
);

-- Insert default plans
INSERT INTO public.plans (id, name, price_monthly, scans_limit, prompts_limit, features) VALUES
  ('free', 'Free', 0, 1, 5, '{"csv_export": false, "slack_alerts": false, "api_access": false}'),
  ('pro', 'Pro', 1900, 10, 50, '{"csv_export": true, "slack_alerts": true, "api_access": true}'),
  ('team', 'Team', 4900, 30, 150, '{"csv_export": true, "slack_alerts": true, "api_access": true, "white_label": true}'),
  ('agency', 'Agency', 14900, -1, 500, '{"csv_export": true, "slack_alerts": true, "api_access": true, "white_label": true, "multi_site": true}');

-- Subscriptions table
CREATE TABLE public.subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE,
  plan_id text REFERENCES public.plans(id) DEFAULT 'free',
  status text DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing')),
  razorpay_subscription_id text,
  current_period_start timestamp with time zone DEFAULT now(),
  current_period_end timestamp with time zone,
  prompts_used integer DEFAULT 0,
  scans_used integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Indexes
CREATE INDEX idx_subscriptions_customer ON public.subscriptions(customer_id);
CREATE INDEX idx_subscriptions_razorpay ON public.subscriptions(razorpay_subscription_id);

-- RLS policies
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Plans are public readable" ON public.plans FOR SELECT USING (true);
CREATE POLICY "Subscriptions public insert" ON public.subscriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "Subscriptions public select" ON public.subscriptions FOR SELECT USING (true);
CREATE POLICY "Subscriptions public update" ON public.subscriptions FOR UPDATE USING (true);
```

---

## User Flow

```text
1. User runs free scan
   |
   v
2. Email captured -> Free subscription created
   |
   v
3. Results modal shows usage (0/5 prompts, 0/1 scan)
   |
   v
4. User hits limit -> Upgrade modal appears
   |
   v
5. Click "Upgrade to Pro"
   |
   v
6. Razorpay checkout opens
   |
   v
7. Payment success -> Webhook updates subscription
   |
   v
8. User returns with Pro access
```

---

## Comparison Table (Homepage Section)

Add a comparison section to showcase competitive advantage:

| Feature | AImentionyou | Otterly.ai | Profound |
|---------|--------------|------------|----------|
| Starting Price | **$19/mo** | $49/mo | $99/mo |
| Prompts at $19 | 50 | N/A | N/A |
| AI Platforms | 3 | 4 | 3 |
| Free Tier | Yes | No | No |
| Slack Alerts | Pro+ | Business | Enterprise |

---

## Prerequisites

Before implementation:
1. Razorpay account and API keys
2. RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET secrets to be added

---

## Implementation Order

1. Database schema (plans + subscriptions tables)
2. Pricing page UI
3. Subscription hook + status component
4. Usage tracking in scan flow
5. Razorpay edge functions (requires API keys)
6. Upgrade modals + CTAs
7. Homepage comparison section
