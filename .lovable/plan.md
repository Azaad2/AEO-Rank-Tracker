
# Fix Razorpay Integration: Currency Display and Checkout Flow

## Problems Identified

### 1. Currency Mismatch
The pricing page displays USD ($19, $49, $149) but Razorpay plans and database are configured in INR (₹1,900, ₹4,900, ₹14,900). This needs to be consistent.

### 2. "Hosted page is not available" Error
The Razorpay checkout fails because:
- The `VITE_RAZORPAY_KEY_ID` environment variable is missing from `.env`
- Without it, the system falls back to the hosted page URL, which is showing an error
- This error typically occurs when:
  - The Razorpay account isn't activated for hosted payments
  - The subscription/plan configuration in Razorpay Dashboard is incomplete

---

## Solution

### Part 1: Fix Currency Display (Frontend)
Update the pricing page to show INR instead of USD, matching the actual Razorpay plan prices:

| Plan | Current Display | Should Display |
|------|-----------------|----------------|
| Pro | $19/month | ₹1,900/month |
| Team | $49/month | ₹4,900/month |
| Agency | $149/month | ₹14,900/month |

Also update the comparison table to show INR pricing.

### Part 2: Fix Razorpay Checkout Popup
Add the `VITE_RAZORPAY_KEY_ID` environment variable so the inline Razorpay checkout popup works instead of redirecting to the hosted page:

1. Add `VITE_RAZORPAY_KEY_ID` to the project's environment variables
2. This allows the inline checkout popup to open directly on your site

### Part 3: Ensure Razorpay Dashboard Configuration
You'll need to verify in your Razorpay Dashboard that:
- Your account is properly activated (even in test mode, some features require activation)
- The subscription plans have valid configurations
- Hosted pages are enabled if you want to use them as fallback

---

## Implementation Details

### Files to Modify

**1. `src/pages/Pricing.tsx`**
- Change `$` to `₹` in price displays
- Update price values: 19 → 1900, 49 → 4900, 149 → 14900
- Format prices with commas for readability (₹1,900 instead of ₹1900)
- Update comparison table to show INR

**2. Environment Variable**
- Add `VITE_RAZORPAY_KEY_ID` to enable the inline checkout popup

### Code Changes Summary

```text
Pricing.tsx:
- Line 36: price: 19 → price: 1900
- Line 56: price: 49 → price: 4900  
- Line 76: price: 149 → price: 14900
- Line 98: comparisonData pricing values to INR
- Line 206-207: Format price with ₹ symbol and comma formatting
```

---

## User Actions Required

After I implement the code changes, you'll need to:

1. **Add the Razorpay Key ID as an environment variable** - I'll prompt you to add `VITE_RAZORPAY_KEY_ID` using the secrets tool

2. **Verify Razorpay Dashboard settings:**
   - Go to Razorpay Dashboard → Settings → API Keys
   - Copy your Key ID (starts with `rzp_test_` or `rzp_live_`)
   - Ensure your account has subscription payments enabled
   - Verify the plans (Pro, Team, Agency) are active and properly configured

---

## Testing Plan

After implementation:
1. Visit the Pricing page and verify ₹ currency is displayed
2. Click "Upgrade to Pro" button
3. Verify the Razorpay popup opens inline (not redirecting to hosted page)
4. Complete a test payment using test card: 4111 1111 1111 1111
