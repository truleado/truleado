# Recurring Billing Verification Guide

## 🎯 How to Ensure Customers Get Charged Next Month

### 1. **Paddle Configuration Requirements** ✅

#### **A. Price Must Be Recurring**
- Go to Paddle Dashboard → Catalog → Products
- Find your price (check `NEXT_PUBLIC_PADDLE_PRICE_ID`)
- **CRITICAL**: Must be set to "Recurring" type
- **CRITICAL**: Must have "Monthly" billing cycle
- **CRITICAL**: Must be "Active" status

#### **B. Webhook Configuration**
- Go to Paddle Dashboard → Developer Tools → Notifications
- **URL**: `https://www.truleado.com/api/billing/webhook`
- **Events**: Must include `subscription.payment_succeeded`
- **Status**: Must be "Active"

### 2. **Database Requirements** ✅

#### **A. Subscription Data Must Be Stored**
```sql
-- Check if user has proper subscription data
SELECT 
  id,
  subscription_status,
  paddle_subscription_id,
  subscription_ends_at,
  created_at
FROM profiles 
WHERE subscription_status = 'active';
```

#### **B. Required Fields**
- `subscription_status` = 'active'
- `paddle_subscription_id` = 'sub_xxxxx' (from Paddle)
- `subscription_ends_at` = Next billing date

### 3. **Webhook Event Flow** 🔄

#### **Initial Purchase:**
1. Customer completes checkout
2. `checkout.session.completed` webhook fires
3. User gets `subscription_status = 'active'`
4. `paddle_subscription_id` is stored
5. `subscription_ends_at` is set to next month

#### **Monthly Renewal:**
1. Paddle automatically charges customer
2. `subscription.payment_succeeded` webhook fires
3. `subscription_ends_at` is updated to next month
4. User remains `subscription_status = 'active'`

### 4. **Testing & Verification** 🧪

#### **A. Test Recurring Billing Setup**
```bash
# Check if price is configured for recurring
curl https://www.truleado.com/api/debug/test-recurring-billing

# Expected response:
{
  "isProperlyConfigured": true,
  "analysis": {
    "isRecurring": true,
    "billingInterval": "month",
    "status": "active"
  }
}
```

#### **B. Test Webhook Endpoint**
```bash
# Test webhook is receiving events
curl https://www.truleado.com/api/billing/webhook

# Expected response:
{
  "message": "Paddle webhook endpoint is active",
  "status": "ready"
}
```

#### **C. Monitor Subscription Status**
```bash
# Check user's subscription status
curl https://www.truleado.com/api/billing/status
```

### 5. **Common Issues & Solutions** 🔧

#### **Issue: Customer Not Getting Charged Next Month**

**Possible Causes:**
1. **Price not recurring** → Fix in Paddle Dashboard
2. **Webhook not configured** → Add webhook in Paddle Dashboard
3. **Webhook failing** → Check webhook logs
4. **Database not updated** → Check webhook processing
5. **Card expired/declined** → Customer needs to update payment method

#### **Issue: Next Billing Date Shows "N/A"**

**Solutions:**
1. Ensure `subscription_ends_at` is set in database
2. Check webhook is processing `subscription.payment_succeeded`
3. Verify Paddle subscription has `next_billed_at` field

### 6. **Monitoring & Alerts** 📊

#### **A. Webhook Monitoring**
- Check Paddle Dashboard → Developer Tools → Events
- Look for `subscription.payment_succeeded` events
- Verify webhook responses are 200 OK

#### **B. Database Monitoring**
```sql
-- Check for active subscriptions
SELECT COUNT(*) as active_subscriptions 
FROM profiles 
WHERE subscription_status = 'active';

-- Check for subscriptions expiring soon
SELECT id, subscription_ends_at 
FROM profiles 
WHERE subscription_status = 'active' 
  AND subscription_ends_at < NOW() + INTERVAL '7 days';
```

### 7. **Production Checklist** ✅

- [ ] Price is configured as "Recurring" in Paddle
- [ ] Billing cycle is set to "Monthly"
- [ ] Webhook endpoint is active and receiving events
- [ ] `subscription.payment_succeeded` webhook is configured
- [ ] Database is storing `paddle_subscription_id`
- [ ] `subscription_ends_at` is being updated monthly
- [ ] Test webhook is working with test transactions
- [ ] Monitor webhook logs for failures

### 8. **Testing Process** 🧪

#### **Step 1: Verify Configuration**
1. Visit `/api/debug/test-recurring-billing`
2. Ensure `isProperlyConfigured: true`

#### **Step 2: Test Initial Purchase**
1. Create a test subscription
2. Verify webhook fires `checkout.session.completed`
3. Check database has correct subscription data

#### **Step 3: Test Recurring Payment**
1. Use Paddle's test mode to simulate monthly renewal
2. Verify webhook fires `subscription.payment_succeeded`
3. Check `subscription_ends_at` is updated

#### **Step 4: Monitor Production**
1. Check webhook logs daily
2. Monitor database for subscription updates
3. Verify customers see correct next billing date

### 9. **Emergency Procedures** 🚨

#### **If Customers Stop Getting Charged:**
1. Check Paddle Dashboard for failed payments
2. Verify webhook is still active
3. Check database for subscription status
4. Contact Paddle support if needed

#### **If Webhook Stops Working:**
1. Check server logs for errors
2. Verify webhook URL is accessible
3. Test webhook endpoint manually
4. Reconfigure webhook in Paddle if needed

## 🎯 **Bottom Line: To Ensure Customers Get Charged Next Month**

1. **Price must be "Recurring" in Paddle** ✅
2. **Webhook must be configured and active** ✅
3. **Database must store `paddle_subscription_id`** ✅
4. **Webhook must process `subscription.payment_succeeded`** ✅
5. **Monitor and test regularly** ✅

The system is already set up correctly - just need to verify the Paddle configuration!
