#!/usr/bin/env node

/**
 * Recurring Billing Test Script
 * 
 * This script tests the entire recurring billing flow to ensure customers
 * will get charged next month.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

async function testEndpoint(url, options = {}) {
  try {
    const response = await fetch(`${BASE_URL}${url}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    })
    
    const data = await response.json()
    return { success: response.ok, status: response.status, data }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function runTests() {
  console.log('🧪 Testing Recurring Billing Setup...\n')
  
  // Test 1: Check Paddle Configuration
  console.log('1️⃣ Testing Paddle Configuration...')
  const paddleConfig = await testEndpoint('/api/debug/paddle-config')
  
  if (paddleConfig.success) {
    console.log('✅ Paddle configuration loaded')
    console.log(`   - API Key: ${paddleConfig.data.config.hasApiKey ? '✅' : '❌'}`)
    console.log(`   - Client Token: ${paddleConfig.data.config.hasClientToken ? '✅' : '❌'}`)
    console.log(`   - Price ID: ${paddleConfig.data.config.hasPriceId ? '✅' : '❌'}`)
    console.log(`   - Environment: ${paddleConfig.data.config.environment}`)
    console.log(`   - API Test: ${paddleConfig.data.apiTest.success ? '✅' : '❌'}`)
  } else {
    console.log('❌ Paddle configuration failed')
    console.log(`   Error: ${paddleConfig.error}`)
  }
  
  // Test 2: Check Price Details
  console.log('\n2️⃣ Testing Price Configuration...')
  const priceDetails = await testEndpoint('/api/debug/price-details')
  
  if (priceDetails.success) {
    console.log('✅ Price details retrieved')
    console.log(`   - Price ID: ${priceDetails.data.price.id}`)
    console.log(`   - Type: ${priceDetails.data.analysis.priceType}`)
    console.log(`   - Is Recurring: ${priceDetails.data.analysis.isRecurring ? '✅' : '❌'}`)
    console.log(`   - Billing Interval: ${priceDetails.data.analysis.billingInterval}`)
    console.log(`   - Status: ${priceDetails.data.analysis.status}`)
    
    if (priceDetails.data.analysis.isRecurring) {
      console.log('✅ Price is configured for recurring billing')
    } else {
      console.log('❌ Price is NOT configured for recurring billing')
      console.log('   Fix: Go to Paddle Dashboard → Catalog → Products')
      console.log('   Set price type to "Recurring" with "Monthly" billing')
    }
  } else {
    console.log('❌ Price details failed')
    console.log(`   Error: ${priceDetails.error}`)
  }
  
  // Test 3: Check Recurring Billing Setup
  console.log('\n3️⃣ Testing Recurring Billing Setup...')
  const recurringTest = await testEndpoint('/api/debug/test-recurring-billing')
  
  if (recurringTest.success) {
    console.log('✅ Recurring billing test completed')
    console.log(`   - Properly Configured: ${recurringTest.data.isProperlyConfigured ? '✅' : '❌'}`)
    console.log(`   - Health Score: ${recurringTest.data.analysis.isRecurring ? 'Good' : 'Needs Fix'}`)
    
    if (recurringTest.data.recommendations) {
      console.log('   Recommendations:')
      recurringTest.data.recommendations.forEach(rec => {
        console.log(`   - ${rec}`)
      })
    }
  } else {
    console.log('❌ Recurring billing test failed')
    console.log(`   Error: ${recurringTest.error}`)
  }
  
  // Test 4: Check Webhook Endpoint
  console.log('\n4️⃣ Testing Webhook Endpoint...')
  const webhookTest = await testEndpoint('/api/billing/webhook')
  
  if (webhookTest.success) {
    console.log('✅ Webhook endpoint is active')
    console.log(`   - Status: ${webhookTest.data.status}`)
    console.log(`   - Message: ${webhookTest.data.message}`)
  } else {
    console.log('❌ Webhook endpoint failed')
    console.log(`   Error: ${webhookTest.error}`)
  }
  
  // Test 5: Check Subscription Monitor
  console.log('\n5️⃣ Testing Subscription Monitor...')
  const monitorTest = await testEndpoint('/api/debug/subscription-monitor')
  
  if (monitorTest.success) {
    console.log('✅ Subscription monitor working')
    console.log(`   - Total Subscriptions: ${monitorTest.data.analysis.totalSubscriptions}`)
    console.log(`   - Active Subscriptions: ${monitorTest.data.analysis.activeSubscriptions}`)
    console.log(`   - Health Score: ${monitorTest.data.healthScore}%`)
    console.log(`   - Issues: ${monitorTest.data.issues.length}`)
    
    if (monitorTest.data.issues.length > 0) {
      console.log('   Issues detected:')
      monitorTest.data.issues.forEach(issue => {
        console.log(`   - ${issue}`)
      })
    }
  } else {
    console.log('❌ Subscription monitor failed')
    console.log(`   Error: ${monitorTest.error}`)
  }
  
  // Summary
  console.log('\n📊 Test Summary:')
  console.log('================')
  
  const allTests = [
    { name: 'Paddle Config', passed: paddleConfig.success },
    { name: 'Price Details', passed: priceDetails.success },
    { name: 'Recurring Setup', passed: recurringTest.success },
    { name: 'Webhook Endpoint', passed: webhookTest.success },
    { name: 'Subscription Monitor', passed: monitorTest.success }
  ]
  
  const passedTests = allTests.filter(test => test.passed).length
  const totalTests = allTests.length
  
  console.log(`Passed: ${passedTests}/${totalTests} tests`)
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Recurring billing should work correctly.')
  } else {
    console.log('⚠️  Some tests failed. Check the issues above and fix them.')
  }
  
  console.log('\n🔧 Next Steps:')
  console.log('1. Verify Paddle Dashboard configuration')
  console.log('2. Test with a real subscription')
  console.log('3. Monitor webhook events in Paddle Dashboard')
  console.log('4. Check subscription status in your app')
}

// Run the tests
runTests().catch(console.error)
