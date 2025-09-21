# Dodo Payments Integration Setup

This guide will help you set up Dodo Payments integration for Truleado.

## 1. Environment Variables

Add the following environment variables to your `.env.local` file:

```env
# Dodo Payments Configuration
DODO_PAYMENTS_API_KEY=your_dodo_api_key_here
DODO_PAYMENTS_WEBHOOK_SECRET=your_webhook_secret_here
DODO_PAYMENTS_PRODUCT_ID=your_product_id_here

# App URL (for webhook callbacks)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Environment
NODE_ENV=development
```

## 2. Getting Your Dodo Payments Credentials

### API Key
1. Log in to your Dodo Payments dashboard
2. Navigate to **Developer** → **API Keys**
3. Generate a new API key
4. Copy the key and add it to your environment variables

### Webhook Secret
1. In your Dodo Payments dashboard, go to **Webhook Settings**
2. Create a webhook URL pointing to: `https://yourdomain.com/api/billing/webhook`
3. Copy the webhook secret and add it to your environment variables

### Product ID
1. In your Dodo Payments dashboard, go to **Products**
2. Create a product for your Pro plan (e.g., $30/month)
3. Copy the product ID and add it to your environment variables

## 3. Database Migration

Run the database migration to update the schema for Dodo Payments:

```sql
-- Run the migration-dodo-payments.sql file in your database
```

## 4. Testing

### Test Cards
Use these test card numbers for testing:
- **Card Number**: `4242 4242 4242 4242`
- **Expiry**: Any future date
- **CVV**: Any 3-digit number

### Test Flow
1. Start your development server: `npm run dev`
2. Go to `/upgrade` page
3. Click "Upgrade to Pro"
4. Complete the payment flow with test card
5. Check that the webhook is received and processed

## 5. Webhook Endpoints

The following webhook events are handled:

- `checkout.session.completed` - Payment successful
- `customer.subscription.created` - Subscription created
- `customer.subscription.updated` - Subscription updated
- `customer.subscription.deleted` - Subscription cancelled
- `invoice.payment_succeeded` - Payment succeeded
- `invoice.payment_failed` - Payment failed

## 6. API Endpoints

### Checkout
- **POST** `/api/billing/checkout` - Create checkout session
- **GET** `/api/billing/success` - Payment success page
- **GET** `/api/billing/cancel` - Payment cancel page

### Webhook
- **POST** `/api/billing/webhook` - Handle Dodo Payments webhooks

### Subscription Management
- **POST** `/api/billing/cancel` - Cancel subscription
- **GET** `/api/debug/subscription` - Get subscription status

## 7. Features

- ✅ Secure payment processing
- ✅ Subscription management
- ✅ Webhook handling
- ✅ Trial period support
- ✅ Automatic subscription updates
- ✅ Payment failure handling
- ✅ Subscription cancellation

## 8. Troubleshooting

### Common Issues

1. **Webhook not received**: Check that your webhook URL is accessible and the secret is correct
2. **Payment fails**: Verify your API key and product ID are correct
3. **Subscription not updating**: Check webhook logs and database connection

### Debug Endpoints

- `/api/debug/subscription` - Check current subscription status
- Check server logs for detailed error messages

## 9. Production Deployment

1. Update environment variables with production values
2. Set `NODE_ENV=production`
3. Update `NEXT_PUBLIC_APP_URL` to your production domain
4. Ensure webhook URL is accessible from the internet
5. Test the complete payment flow

## 10. Security Notes

- Never commit API keys to version control
- Use environment variables for all sensitive data
- Verify webhook signatures to ensure authenticity
- Use HTTPS in production
- Regularly rotate API keys
