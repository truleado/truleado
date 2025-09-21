# Paddle Payments Integration Setup

This guide will help you set up Paddle Payments integration for your Truleado application.

## Prerequisites

1. **Paddle Account**: Sign up at [Paddle](https://www.paddle.com/)
2. **Supabase Database**: Ensure your database is set up and accessible
3. **Environment Variables**: Access to your deployment environment (Vercel)

## Step 1: Create Paddle Account

1. Go to [Paddle](https://www.paddle.com/) and sign up
2. Start with a **Sandbox account** for testing
3. Complete the account setup process

## Step 2: Get API Credentials

### Sandbox Environment
1. Log into your Paddle dashboard
2. **Switch to Sandbox mode** (toggle in top right corner)
3. Go to **Developer Tools > Authentication**
4. Create a new **API key** for server-side operations (starts with `sandbox_`)
5. Create a new **Client Token** for client-side Paddle.js (starts with `live_` for sandbox)
6. Copy both credentials

### Live Environment
1. Switch to live mode in your Paddle dashboard
2. Create a new **API key** for server-side operations (starts with `live_`)
3. Create a new **Client Token** for client-side Paddle.js
4. Copy both credentials

## Step 3: Create Products and Prices

1. Go to **Catalog > Products** in your Paddle dashboard
2. Click **Add Product**
3. Fill in product details:
   - **Name**: "Truleado Pro Plan"
   - **Description**: "Premium features for Truleado"
   - **Category**: Choose appropriate category
4. Set up pricing:
   - **Price**: Your desired amount (e.g., $29.99)
   - **Billing**: Monthly or Annual
   - **Currency**: USD (or your preferred currency)
5. Save the product and copy the **Price ID** (starts with `pri_`)

## Step 4: Set Up Webhooks

1. Go to **Developer Tools > Events** in your Paddle dashboard
2. Click **Add Endpoint**
3. Set the webhook URL:
   - **Development**: `https://your-ngrok-url.ngrok.io/api/billing/webhook`
   - **Production**: `https://www.truleado.com/api/billing/webhook`
4. Select these events:
   - `checkout.session.completed`
   - `subscription.created`
   - `subscription.updated`
   - `subscription.canceled`
   - `transaction.completed`
   - `transaction.payment_failed`
5. Copy the **Webhook Secret** (starts with `whsec_`)

## Step 5: Configure Environment Variables

### In Vercel Dashboard:
1. Go to your project settings
2. Navigate to **Environment Variables**
3. Add these variables:

```env
# Paddle Configuration (Server-side)
PADDLE_API_KEY=your_api_key_here
PADDLE_WEBHOOK_SECRET=your_webhook_secret_here
PADDLE_PRICE_ID=your_price_id_here

# Paddle Configuration (Client-side)
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=your_client_token_here
NEXT_PUBLIC_PADDLE_PRICE_ID=your_price_id_here

# App Configuration
NEXT_PUBLIC_APP_URL=https://www.truleado.com
```

### In your local .env.local file:
```env
# Paddle Configuration (Server-side - Sandbox)
PADDLE_API_KEY=sandbox_your_api_key_here
PADDLE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
PADDLE_PRICE_ID=pri_your_price_id_here

# Paddle Configuration (Client-side - Sandbox)
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=your_sandbox_client_token_here
NEXT_PUBLIC_PADDLE_PRICE_ID=pri_your_price_id_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 6: Run Database Migration

Execute the SQL migration in your Supabase SQL editor:

```sql
-- See migration-add-paddle-fields.sql
```

This will add the necessary Paddle fields to your profiles table.

## Step 7: Test the Integration

### Local Testing with ngrok:
1. Install ngrok: `npm install -g ngrok`
2. Start your local server: `npm run dev`
3. In another terminal: `ngrok http 3000`
4. Copy the ngrok URL and update your webhook endpoint in Paddle
5. Test the checkout flow

### Test Card Details:
Use these test card numbers in sandbox mode:
- **Success**: `4000 0000 0000 0002`
- **Decline**: `4000 0000 0000 0005`
- **CVV**: Any 3 digits (e.g., `123`)
- **Expiry**: Any future date (e.g., `12/25`)
- **Name**: Any name
- **Email**: Any valid email format

## Step 8: Go Live

1. **Switch to Live Mode**:
   - Update your Paddle account to live mode
   - Update environment variables with live API keys
   - Update webhook URL to production

2. **Deploy**:
   ```bash
   git add .
   git commit -m "Add Paddle Payments integration"
   git push
   vercel --prod
   ```

## API Endpoints

### Checkout
- **POST** `/api/billing/checkout` - Create checkout session
- **GET** `/billing/success` - Payment success page
- **GET** `/billing/cancel` - Payment cancel page

### Webhooks
- **POST** `/api/billing/webhook` - Handle Paddle webhooks

### Subscription Management
- **POST** `/api/billing/cancel` - Cancel subscription
- **GET** `/api/billing/status` - Get subscription status
- **GET** `/api/debug/subscription` - Debug subscription info

## Webhook Events Handled

- `checkout.session.completed` - Payment successful
- `subscription.created` - Subscription created
- `subscription.updated` - Subscription updated
- `subscription.canceled` - Subscription cancelled
- `transaction.completed` - Payment processed
- `transaction.payment_failed` - Payment failed

## Troubleshooting

### Common Issues:

1. **"Invalid API key"**:
   - Check if you're using the correct environment (sandbox vs live)
   - Verify the API key format

2. **"Webhook signature verification failed"**:
   - Check if the webhook secret is correct
   - Ensure the webhook URL is accessible

3. **"Product not found"**:
   - Verify the Price ID is correct
   - Check if the product is active in Paddle

4. **"Checkout session creation failed"**:
   - Check API key permissions
   - Verify product configuration

### Debug Endpoints:

- **GET** `/api/debug/subscription` - Check user subscription status
- **GET** `/api/billing/status` - Get billing information

## Support

- **Paddle Documentation**: [developer.paddle.com](https://developer.paddle.com/)
- **Paddle Support**: [paddle.com/support](https://paddle.com/support)
- **Truleado Support**: support@truleado.com

## Security Notes

- Never expose API keys in client-side code
- Always verify webhook signatures
- Use HTTPS for all webhook endpoints
- Regularly rotate API keys
- Monitor webhook events for suspicious activity
