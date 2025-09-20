// Paddle configuration
export const paddleConfig = {
  vendorId: process.env.PADDLE_VENDOR_ID!,
  apiKey: process.env.PADDLE_API_KEY!,
  environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
}

