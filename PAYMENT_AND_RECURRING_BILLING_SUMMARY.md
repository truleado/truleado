# Payment & Recurring Billing Summary

## ✅ YES - After Payment, Users Get Full Access and Are Charged Monthly

### What Happens After Payment:

#### 1. **Immediate Full Access** ✅
- User's `subscription_status` is updated to `'active'`
- Webhook handler (`src/app/api/billing/webhook/route.ts`) receives:
  - `checkout.session.completed` event
  - Updates user in database with full access
  - Sets `paddle_subscription_id` for recurring billing
  - Sets `subscription_ends_at` to next month

#### 2. **Recurring Monthly Charges** ✅
- Paddle automatically charges the user every month
- Webhook receives `subscription.payment_succeeded` event each month
- User's `subscription_ends_at` is updated to next month
- User remains on `subscription_status = 'active'`

### Key Webhook Events Handled:

```javascript
// Initial Payment (checkout.session.completed)
- Sets subscription_status to 'active'
- Stores paddle_subscription_id
- Sets subscription_ends_at to next month

// Monthly Recurring Payment (subscription.payment_succeeded)
- Keeps subscription_status as 'active'
- Updates subscription_ends_at to next month
- User continues with full access

// Payment Failed (subscription.payment_failed)
- Changes subscription_status to 'past_due'
- User still has access (Paddle retries payment)
- If payment fails permanently, access is revoked
```

### Database Schema:

```sql
profiles table stores:
- subscription_status: 'trial' | 'active' | 'past_due' | 'cancelled'
- paddle_subscription_id: 'sub_xxxxx' (for recurring billing)
- paddle_customer_id: 'ctm_xxxxx' (Paddle customer ID)
- subscription_ends_at: Next billing date
```

### Verification:

```bash
# Check if price is configured for recurring
curl https://truleado.com/api/debug/test-recurring-billing

# Check user subscription status
curl https://truleado.com/api/billing/status
```

### Configuration Requirements:

1. **Paddle Dashboard**:
   - Price must be type: "Recurring"
   - Billing cycle: "Monthly"
   - Status: "Active"

2. **Environment Variables**:
   - `NEXT_PUBLIC_PADDLE_PRICE_ID` must point to recurring price
   - `PADDLE_API_KEY` for webhook verification
   - `PADDLE_WEBHOOK_SECRET` for security

3. **Webhook URL**:
   - Must be: `https://truleado.com/api/billing/webhook`
   - Must handle `subscription.payment_succeeded` events
   - Must be "Active" in Paddle Dashboard
