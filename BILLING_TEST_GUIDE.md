# Monthly Billing Testing Guide

## 🧪 Step-by-Step Testing Process

### 1. **Pre-Test Setup**

#### Check Paddle Configuration
Visit: `https://your-domain.com/api/debug/paddle-config`

**Expected Response:**
```json
{
  "config": {
    "hasApiKey": true,
    "hasClientToken": true,
    "hasPriceId": true,
    "environment": "sandbox",
    "baseUrl": "https://api.sandbox.paddle.com",
    "priceIdValue": "pri_xxxxx"
  },
  "apiTest": {
    "success": true,
    "error": null
  }
}
```

#### Verify Price is Recurring
1. Go to Paddle Dashboard → Catalog → Products
2. Find your price (the one matching `priceIdValue` above)
3. **CRITICAL**: Ensure it's set to "Recurring" with "Monthly" billing
4. If not, create a new recurring monthly price and update `NEXT_PUBLIC_PADDLE_PRICE_ID`

### 2. **Test Checkout Flow**

#### Test 1: Server-Side Checkout
1. Go to Settings → Billing
2. Click "Upgrade to Pro"
3. **Expected**: Should open Paddle checkout overlay
4. Complete payment with test card: `4000 0000 0000 0002`
5. **Expected**: Redirect to success page, then back to Settings showing "Pro Plan Active"

#### Test 2: Trial Banner Checkout
1. If you see the trial banner, click "Upgrade Now"
2. **Expected**: Same Paddle checkout flow
3. Complete payment
4. **Expected**: Banner disappears, UI updates to Pro

### 3. **Verify Database Updates**

#### Check Subscription Status
Visit: `https://your-domain.com/api/debug/subscription`

**Expected Response:**
```json
{
  "user_id": "user-uuid",
  "subscription_status": "active",
  "paddle_customer_id": "ctm_xxxxx",
  "paddle_subscription_id": "sub_xxxxx",
  "subscription_ends_at": "2024-02-15T00:00:00.000Z"
}
```

### 4. **Test Webhook Handling**

#### Check Webhook Logs
1. Go to Paddle Dashboard → Developer Tools → Events
2. Look for recent webhook calls to your endpoint
3. **Expected Events**:
   - `checkout.session.completed`
   - `subscription.created` (if recurring)
   - `transaction.completed`

#### Test Webhook Manually
Visit: `https://your-domain.com/api/debug/webhook-test`

**Expected**: Shows current subscription status

### 5. **Test Recurring Billing (Sandbox)**

#### Simulate Monthly Charge
1. In Paddle Dashboard → Subscriptions
2. Find your test subscription
3. Click "Actions" → "Charge Now" (if available)
4. **Expected**: Should trigger `subscription.payment_succeeded` webhook

#### Check Payment History
1. Go to Paddle Dashboard → Transactions
2. Look for recurring payment entries
3. **Expected**: Multiple transactions with same customer

### 6. **Test Edge Cases**

#### Test Payment Failure
1. Use test card: `4000 0000 0000 0002` (declined)
2. **Expected**: Should show payment failed, retry options

#### Test Cancellation
1. Go to Settings → Billing
2. Click "Cancel Subscription"
3. **Expected**: Status changes to "cancelled"
4. Check Paddle Dashboard: subscription should be cancelled

#### Test Resubscription
1. After cancellation, click "Resubscribe"
2. **Expected**: New checkout flow, new subscription created

## 🔍 Debugging Tools

### Check Current Status
```bash
# Check if user is authenticated
curl -H "Cookie: your-session-cookie" https://your-domain.com/api/debug/subscription

# Check Paddle configuration
curl https://your-domain.com/api/debug/paddle-config

# Test webhook endpoint
curl -X POST https://your-domain.com/api/billing/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "webhook"}'
```

### Monitor Logs
1. Check Vercel Function Logs
2. Look for Paddle API calls and responses
3. Monitor webhook delivery status in Paddle Dashboard

## 🚨 Common Issues & Solutions

### Issue: "Billing configuration error"
**Solution**: Check that `NEXT_PUBLIC_PADDLE_PRICE_ID` is set to a recurring price

### Issue: Checkout opens but payment fails
**Solution**: Verify Paddle API key has correct permissions

### Issue: Payment succeeds but UI doesn't update
**Solution**: Check webhook delivery and event handling

### Issue: No recurring charges
**Solution**: Ensure price is configured for monthly recurring in Paddle

## 📊 Success Criteria

✅ Checkout opens successfully  
✅ Payment completes without errors  
✅ Database shows `subscription_status: 'active'`  
✅ Database has `paddle_subscription_id` set  
✅ UI updates to show "Pro Plan Active"  
✅ Trial banner disappears  
✅ Webhook events are received  
✅ Cancellation works properly  
✅ Resubscription works properly  

## 🎯 Next Steps After Testing

1. **Production Setup**: Update environment variables to use live Paddle credentials
2. **Webhook Security**: Ensure webhook signature verification is working
3. **Monitoring**: Set up alerts for failed payments and webhook failures
4. **Customer Support**: Prepare billing support documentation
