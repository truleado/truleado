# Environment Variables Cleanup

## Remove these Dodo Payments environment variables from Vercel:

### In Vercel Dashboard:
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Remove these variables:

```env
DODO_PAYMENTS_API_KEY
DODO_PAYMENTS_WEBHOOK_SECRET
DODO_PAYMENTS_PRODUCT_ID
```

### In your local .env file:
Remove these lines from your `.env.local` file:

```env
DODO_PAYMENTS_API_KEY=your_api_key
DODO_PAYMENTS_WEBHOOK_SECRET=your_webhook_secret
DODO_PAYMENTS_PRODUCT_ID=your_product_id
```

## Database Migration

Run the SQL migration to clean up the database:

```sql
-- See migration-remove-dodo-fields.sql
```

## What was removed:

- ✅ Dodo Payments configuration file
- ✅ All Dodo Payments API routes
- ✅ Dodo Payments billing pages
- ✅ Dodo Payments documentation
- ✅ Dodo Payments database fields
- ✅ Dodo Payments webhook test endpoint

## Next Steps:

1. Run the database migration
2. Remove environment variables from Vercel
3. Deploy the cleaned up code
4. Choose a new payment gateway (Stripe, Razorpay, etc.)
