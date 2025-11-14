// Script to find users with high Gemini API usage
// Run with: node find-gemini-users.js

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function findHeavyUsers() {
  try {
    // Get products created in last 30 days (each uses Gemini API)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('user_id, created_at')
      .gte('created_at', thirtyDaysAgo)

    if (productsError) {
      console.error('Error fetching products:', productsError)
      return
    }

    // Get leads with AI analysis in last 30 days (each uses Gemini API)
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('user_id, created_at')
      .not('ai_analysis', 'is', null)
      .gte('created_at', thirtyDaysAgo)

    if (leadsError) {
      console.error('Error fetching leads:', leadsError)
      return
    }

    // Count usage per user
    const usageMap = new Map()

    products?.forEach(product => {
      const current = usageMap.get(product.user_id) || { products: 0, leads: 0, total: 0 }
      current.products++
      current.total++
      usageMap.set(product.user_id, current)
    })

    leads?.forEach(lead => {
      const current = usageMap.get(lead.user_id) || { products: 0, leads: 0, total: 0 }
      current.leads++
      current.total++
      usageMap.set(lead.user_id, current)
    })

    // Sort by total usage and get top users
    const sortedUsers = Array.from(usageMap.entries())
      .filter(([_, usage]) => usage.total >= 10) // Users with 10+ calls
      .sort(([_, a], [__, b]) => b.total - a.total)
      .slice(0, 50)

    if (sortedUsers.length === 0) {
      console.log('No users found with high Gemini API usage (10+ calls in last 30 days)')
      return
    }

    // Get user profiles
    const userIds = sortedUsers.map(([userId]) => userId)
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, full_name, subscription_status')
      .in('id', userIds)

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      return
    }

    // Map profiles to usage
    const results = profiles.map(profile => {
      const usage = usageMap.get(profile.id) || { products: 0, leads: 0, total: 0 }
      return {
        email: profile.email,
        full_name: profile.full_name,
        subscription_status: profile.subscription_status,
        product_analyses: usage.products,
        lead_analyses: usage.leads,
        total_calls: usage.total
      }
    }).sort((a, b) => b.total_calls - a.total_calls)

    // Print just user names/emails as requested
    console.log('\nUsers with high Gemini API usage (last 30 days):\n')
    results.forEach(user => {
      const name = user.full_name || user.email || 'Unknown'
      console.log(name)
    })

    console.log(`\nTotal: ${results.length} users`)
    console.log('\nDetailed breakdown:')
    results.forEach(user => {
      const name = user.full_name || user.email || 'Unknown'
      console.log(`${name}: ${user.total_calls} calls (${user.product_analyses} products, ${user.lead_analyses} leads)`)
    })

  } catch (error) {
    console.error('Error:', error)
  }
}

findHeavyUsers()



