'use client'

export default function TestPaddle() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Paddle Checkout Test</h1>
      <p>This is a simple test page to verify Paddle checkout works.</p>
      
      <div style={{ marginTop: '20px', padding: '20px', border: '1px solid #ccc', borderRadius: '5px' }}>
        <h2>Test Paddle Checkout URL</h2>
        <p>Click the button below to test the Paddle checkout:</p>
        <button 
          onClick={() => {
            const url = 'https://buy.paddle.com/product/pro_01k5kd1pam009p3f3w4d76r9dz?customer_email=test@example.com&customer_id=test-user-id&return_url=http%3A%2F%2Flocalhost%3A3000%2Fbilling%2Fsuccess&cancel_url=http%3A%2F%2Flocalhost%3A3000%2Fbilling%2Fcancel'
            window.open(url, '_blank')
          }}
          style={{ 
            backgroundColor: '#007bff', 
            color: 'white', 
            padding: '10px 20px', 
            border: 'none', 
            borderRadius: '5px', 
            cursor: 'pointer' 
          }}
        >
          Test Paddle Checkout
        </button>
      </div>
      
      <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
        <h3>What to expect:</h3>
        <ul>
          <li>Clicking the button should open Paddle checkout in a new tab</li>
          <li>You should see the Paddle payment form</li>
          <li>This confirms the Paddle integration is working</li>
        </ul>
      </div>
    </div>
  )
}
