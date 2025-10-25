const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkUserStatuses() {
  console.log('🔍 Checking user subscription statuses...')
  
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, email, subscription_status, trial_ends_at, subscription_ends_at')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('❌ Error fetching profiles:', error)
      return
    }

    console.log('📊 Recent user profiles:')
    profiles?.forEach((profile, index) => {
      console.log(`${index + 1}. ${profile.email}`)
      console.log(`   Status: ${profile.subscription_status}`)
      console.log(`   Trial ends: ${profile.trial_ends_at || 'N/A'}`)
      console.log(`   Subscription ends: ${profile.subscription_ends_at || 'N/A'}`)
      console.log('')
    })

    // Check for any users with 'expired' status
    const { data: expiredUsers, error: expiredError } = await supabase
      .from('profiles')
      .select('id, email, subscription_status')
      .eq('subscription_status', 'expired')

    if (!expiredError && expiredUsers?.length > 0) {
      console.log(`⚠️  Found ${expiredUsers.length} users with 'expired' status:`)
      expiredUsers.forEach(user => {
        console.log(`   - ${user.email}`)
      })
    } else {
      console.log('✅ No users with "expired" status found')
    }

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkUserStatuses()
