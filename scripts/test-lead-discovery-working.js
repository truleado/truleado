#!/usr/bin/env node

/**
 * Test Lead Discovery Working Script
 * 
 * This script tests if lead discovery is actually working 24/7
 * and identifies why leads might not be found consistently.
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

async function testLeadDiscoveryWorking() {
  console.log('🔍 Testing if Lead Discovery is Actually Working 24/7...\n')
  
  // Test 1: Check lead monitoring
  console.log('1️⃣ Checking Lead Monitoring...')
  const monitoring = await testEndpoint('/api/debug/lead-monitoring')
  
  if (monitoring.success) {
    console.log('✅ Lead monitoring data retrieved')
    console.log(`   - Health Score: ${monitoring.data.analysis.healthScore}/100 (${monitoring.data.analysis.status})`)
    console.log(`   - Scheduler Running: ${monitoring.data.scheduler.running ? '✅' : '❌'}`)
    console.log(`   - Reddit Connected: ${monitoring.data.reddit.connected ? '✅' : '❌'}`)
    console.log(`   - Active Jobs: ${monitoring.data.jobs.active}`)
    console.log(`   - Due Jobs: ${monitoring.data.jobs.due}`)
    console.log(`   - Leads Last 7 Days: ${monitoring.data.leads.last7Days}`)
    console.log(`   - Days with Leads: ${monitoring.data.leads.daysWithLeads}/7`)
    
    console.log('\n   📊 Leads by Day (Last 7 Days):')
    Object.entries(monitoring.data.leads.leadsByDay).forEach(([date, count]) => {
      const status = count > 0 ? '✅' : '❌'
      console.log(`   ${date}: ${count} leads ${status}`)
    })
    
    if (monitoring.data.analysis.issues.length > 0) {
      console.log('\n   🚨 Issues Found:')
      monitoring.data.analysis.issues.forEach(issue => {
        console.log(`   - ❌ ${issue}`)
      })
    }
    
    if (monitoring.data.analysis.recommendations.length > 0) {
      console.log('\n   💡 Recommendations:')
      monitoring.data.analysis.recommendations.forEach(rec => {
        console.log(`   - ${rec}`)
      })
    }
  } else {
    console.log('❌ Failed to get lead monitoring data')
    console.log(`   Error: ${monitoring.error}`)
  }
  
  // Test 2: Check job scheduler status
  console.log('\n2️⃣ Checking Job Scheduler Status...')
  const schedulerStatus = await testEndpoint('/api/scheduler/status')
  
  if (schedulerStatus.success) {
    console.log(`   - Scheduler Running: ${schedulerStatus.data.isRunning ? '✅' : '❌'}`)
    console.log(`   - Message: ${schedulerStatus.data.message}`)
  } else {
    console.log('❌ Failed to check scheduler status')
  }
  
  // Test 3: Start scheduler if not running
  if (monitoring.success && !monitoring.data.scheduler.running) {
    console.log('\n3️⃣ Starting Job Scheduler...')
    const startScheduler = await testEndpoint('/api/scheduler/start', { method: 'POST' })
    
    if (startScheduler.success) {
      console.log('✅ Job scheduler started')
    } else {
      console.log('❌ Failed to start job scheduler')
    }
  }
  
  // Test 4: Ensure daily leads are working
  if (monitoring.success && monitoring.data.products.count > 0) {
    console.log('\n4️⃣ Ensuring Daily Lead Discovery...')
    const ensureDailyLeads = await testEndpoint('/api/debug/ensure-daily-leads', {
      method: 'POST'
    })
    
    if (ensureDailyLeads.success) {
      console.log('✅ Daily lead discovery ensured')
      console.log(`   - Jobs Created: ${ensureDailyLeads.data.results.jobsCreated}`)
      console.log(`   - Jobs Reactivated: ${ensureDailyLeads.data.results.jobsReactivated}`)
      console.log(`   - Active Jobs: ${ensureDailyLeads.data.results.activeJobs}`)
    } else {
      console.log('❌ Failed to ensure daily lead discovery')
    }
  }
  
  // Test 5: Trigger immediate lead discovery
  if (monitoring.success && monitoring.data.products.count > 0) {
    console.log('\n5️⃣ Triggering Immediate Lead Discovery...')
    
    for (const product of monitoring.data.products.products) {
      console.log(`   Triggering for: ${product.name}`)
      
      const triggerDiscovery = await testEndpoint('/api/debug/trigger-lead-discovery', {
        method: 'POST',
        body: JSON.stringify({ productId: product.id })
      })
      
      if (triggerDiscovery.success) {
        console.log(`   ✅ Triggered for ${product.name}`)
      } else {
        console.log(`   ❌ Failed for ${product.name}`)
      }
    }
  }
  
  // Test 6: Wait and check for new leads
  console.log('\n6️⃣ Waiting 60 seconds for lead discovery to complete...')
  await new Promise(resolve => setTimeout(resolve, 60000))
  
  console.log('   Checking for new leads...')
  const monitoringAfter = await testEndpoint('/api/debug/lead-monitoring')
  
  if (monitoringAfter.success) {
    const newLeads = monitoringAfter.data.leads.last7Days
    console.log(`   - Total leads last 7 days: ${newLeads}`)
    
    if (newLeads > (monitoring.data?.leads?.last7Days || 0)) {
      console.log('   ✅ New leads found! Lead discovery is working.')
    } else {
      console.log('   ⚠️  No new leads found. This could indicate:')
      console.log('   - Reddit API rate limits')
      console.log('   - No relevant posts in monitored subreddits')
      console.log('   - Search terms too specific')
      console.log('   - Subreddits not very active')
    }
  }
  
  // Summary
  console.log('\n📊 Lead Discovery Test Summary:')
  console.log('================================')
  
  if (monitoring.success) {
    const health = monitoring.data.analysis
    console.log(`Health Score: ${health.healthScore}/100 (${health.status})`)
    
    if (health.healthScore >= 80) {
      console.log('🎉 Lead discovery system is healthy and should be working!')
    } else if (health.healthScore >= 60) {
      console.log('⚠️  Lead discovery system has some issues - check recommendations above')
    } else {
      console.log('🚨 Lead discovery system has critical issues - fix immediately!')
    }
    
    console.log('\nKey Findings:')
    console.log(`- Scheduler Running: ${monitoring.data.scheduler.running ? 'Yes' : 'No'}`)
    console.log(`- Reddit Connected: ${monitoring.data.reddit.connected ? 'Yes' : 'No'}`)
    console.log(`- Active Jobs: ${monitoring.data.jobs.active}`)
    console.log(`- Leads Last 7 Days: ${monitoring.data.leads.last7Days}`)
    console.log(`- Days with Leads: ${monitoring.data.leads.daysWithLeads}/7`)
    
    if (monitoring.data.leads.last7Days === 0) {
      console.log('\n🚨 CRITICAL: No leads found in 7 days!')
      console.log('This means the system is NOT working properly.')
    } else if (monitoring.data.leads.daysWithLeads < 3) {
      console.log('\n⚠️  WARNING: Lead discovery is inconsistent!')
      console.log('Only finding leads on some days, not 24/7.')
    } else {
      console.log('\n✅ Lead discovery appears to be working consistently!')
    }
  } else {
    console.log('❌ Could not test lead discovery - check authentication and server status')
  }
  
  console.log('\n🔧 Next Steps:')
  console.log('1. Fix any critical issues identified above')
  console.log('2. Set up daily cron job: /api/cron/start-scheduler')
  console.log('3. Monitor leads page for new discoveries')
  console.log('4. Check server logs for job scheduler activity')
  console.log('5. Verify Reddit API is not rate limited')
}

// Run the test
testLeadDiscoveryWorking().catch(console.error)
