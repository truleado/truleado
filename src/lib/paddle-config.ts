export const paddleConfig = {
  vendorId: process.env.PADDLE_VENDOR_ID,
  apiKey: process.env.PADDLE_API_KEY,
  productId: process.env.PADDLE_PRODUCT_ID,
  priceId: process.env.PADDLE_PRICE_ID,
  environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
  webhookSecret: process.env.PADDLE_WEBHOOK_SECRET,
  
  // Trial settings
  trialDays: 1,
  monthlyPrice: 30,
  
  // Security settings
  maxTrialPerEmail: 1,
  maxTrialPerIP: 3,
  trialCooldownHours: 24
}

export const getPaddleCheckoutUrl = (userId: string, userEmail: string) => {
  const baseUrl = paddleConfig.environment === 'production' 
    ? 'https://checkout.paddle.com' 
    : 'https://sandbox-checkout.paddle.com'
  
  return `${baseUrl}/product/${paddleConfig.productId}?customer_id=${userId}&email=${userEmail}`
}
