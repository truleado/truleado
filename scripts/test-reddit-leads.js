#!/usr/bin/env node

/**
 * Reddit Leads Test Script
 * 
 * This script tests the Reddit lead finding system to identify why
 * leads might not be found after the initial batch.
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

async function runRedditLeadsTest() {
  console.log('🔍 Testing Reddit Lead Finding System...\n')
  
  // Test 1: Run comprehensive diagnostic
  console.log('1️⃣ Running Reddit Leads Diagnostic...')
  const diagnostic = await testEndpoint('/api/debug/reddit-leads-diagnostic')
  
  if (diagnostic.success) {
    console.log('✅ Diagnostic completed')
    console.log(`   - Health Score: ${diagnostic.data.health.score}/100 (${diagnostic.data.health.status})`)
    console.log(`   - Reddit Connected: ${diagnostic.data.reddit.connected ? '✅' : '❌'}`)
    console.log(`   - Reddit Token Expired: ${diagnostic.data.reddit.tokenExpired ? '❌' : '✅'}`)
    console.log(`   - Products: ${diagnostic.data.products.count}`)
    console.log(`   - Active Jobs: ${diagnostic.data.jobs.active}`)
    console.log(`   - Scheduler Running: ${diagnostic.data.scheduler.running ? '✅' : '❌'}`)
    console.log(`   - Leads Last 24h: ${diagnostic.data.leads.last24h}`)
    console.log(`   - Leads Last 7d: ${diagnostic.data.leads.last7d}`)
    
    if (diagnostic.data.health.issues.length > 0) {
      console.log('\n   Issues Found:')
      diagnostic.data.health.issues.forEach(issue => {
        console.log(`   - ❌ ${issue}`)
      })
    }
    
    if (diagnostic.data.recommendations.length > 0) {
      console.log('\n   Recommendations:')
      diagnostic.data.recommendations.forEach(rec => {
        console.log(`   - 💡 ${rec}`)
      })
    }
  } else {
    console.log('❌ Diagnostic failed')
    console.log(`   Error: ${diagnostic.error}`)
  }
  
  // Test 2: Check job scheduler status
  console.log('\n2️⃣ Checking Job Scheduler Status...')
  const schedulerStatus = await testEndpoint('/api/scheduler/status')
  
  if (schedulerStatus.success) {
    console.log(`   - Scheduler Running: ${schedulerStatus.data.isRunning ? '✅' : '❌'}`)
    console.log(`   - Message: ${schedulerStatus.data.message}`)
  } else {
    console.log('❌ Failed to check scheduler status')
    console.log(`   Error: ${schedulerStatus.error}`)
  }
  
  // Test 3: Start job scheduler if not running
  if (diagnostic.success && !diagnostic.data.scheduler.running) {
    console.log('\n3️⃣ Starting Job Scheduler...')
    const startScheduler = await testEndpoint('/api/scheduler/start', { method: 'POST' })
    
    if (startScheduler.success) {
      console.log('✅ Job scheduler started')
      console.log(`   - Running: ${startScheduler.data.isRunning}`)
    } else {
      console.log('❌ Failed to start job scheduler')
      console.log(`   Error: ${startScheduler.error}`)
    }
  } else {
    console.log('\n3️⃣ Job Scheduler already running - skipping start')
  }
  
  // Test 4: Check for products and trigger lead discovery
  if (diagnostic.success && diagnostic.data.products.count > 0) {
    console.log('\n4️⃣ Triggering Lead Discovery...')
    
    for (const product of diagnostic.data.products.products) {
      console.log(`   Triggering for product: ${product.name} (${product.subreddits} subreddits)`)
      
      const triggerDiscovery = await testEndpoint('/api/debug/trigger-lead-discovery', {
        method: 'POST',
        body: JSON.stringify({ productId: product.id })
      })
      
      if (triggerDiscovery.success) {
        console.log(`   ✅ Lead discovery triggered for ${product.name}`)
      } else {
        console.log(`   ❌ Failed to trigger lead discovery for ${product.name}`)
        console.log(`   Error: ${triggerDiscovery.error}`)
      }
    }
  } else {
    console.log('\n4️⃣ No products found - skipping lead discovery trigger')
  }
  
  // Test 5: Wait and check for new leads
  console.log('\n5️⃣ Waiting 30 seconds for lead discovery to complete...')
  await new Promise(resolve => setTimeout(resolve, 30000))
  
  console.log('   Checking for new leads...')
  const diagnosticAfter = await testEndpoint('/api/debug/reddit-leads-diagnostic')
  
  if (diagnosticAfter.success) {
    const newLeads = diagnosticAfter.data.leads.last24h
    console.log(`   - New leads found: ${newLeads}`)
    
    if (newLeads > 0) {
      console.log('   ✅ Lead discovery is working!')
      console.log('   Recent leads:')
      diagnosticAfter.data.leads.recentLeads.slice(0, 3).forEach(lead => {
        console.log(`   - ${lead.title} (r/${lead.subreddit}, Score: ${lead.relevanceScore})`)
      })
    } else {
      console.log('   ⚠️  No new leads found - this could be normal if:')
      console.log('   - No relevant posts in monitored subreddits')
      console.log('   - Search terms are too specific')
      console.log('   - Subreddits are not very active')
      console.log('   - Reddit API rate limits')
    }
  }
  
  // Summary
  console.log('\n📊 Reddit Leads Test Summary:')
  console.log('============================')
  
  if (diagnostic.success) {
    const health = diagnostic.data.health
    console.log(`Health Score: ${health.score}/100 (${health.status})`)
    
    if (health.score >= 80) {
      console.log('🎉 System is healthy - lead discovery should be working')
    } else if (health.score >= 60) {
      console.log('⚠️  System has some issues - check recommendations above')
    } else {
      console.log('🚨 System has critical issues - fix the problems above')
    }
    
    console.log('\nKey Metrics:')
    console.log(`- Reddit Connected: ${diagnostic.data.reddit.connected ? 'Yes' : 'No'}`)
    console.log(`- Products: ${diagnostic.data.products.count}`)
    console.log(`- Active Jobs: ${diagnostic.data.jobs.active}`)
    console.log(`- Scheduler Running: ${diagnostic.data.scheduler.running ? 'Yes' : 'No'}`)
    console.log(`- Leads Last 24h: ${diagnostic.data.leads.last24h}`)
  } else {
    console.log('❌ Could not run diagnostic - check authentication and server status')
  }
  
  console.log('\n🔧 Next Steps:')
  console.log('1. Check the diagnostic results above')
  console.log('2. Fix any issues identified')
  console.log('3. Monitor the leads page for new discoveries')
  console.log('4. Check Reddit API rate limits if no leads found')
  console.log('5. Verify subreddits are active and relevant')
}

// Run the test
runRedditLeadsTest().catch(console.error)
