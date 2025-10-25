const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkSubscriptionConstraint() {
  console.log('🔍 Checking current subscription_status constraint...')
  
  try {
    // Try to insert a test record with 'trial' status to see if it's allowed
    const { data: testInsert, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: '00000000-0000-0000-0000-000000000000', // Test UUID
        email: 'test@example.com',
        subscription_status: 'trial'
      })
      .select()

    if (insertError) {
      if (insertError.message.includes('check constraint')) {
        console.log('❌ Constraint Error:', insertError.message)
        console.log('📝 The subscription_status constraint does not allow "trial" status')
        console.log('🔧 Database migration needs to be applied!')
      } else {
        console.log('✅ "trial" status is allowed (or other error):', insertError.message)
      }
    } else {
      console.log('✅ "trial" status is allowed in the database')
      // Clean up test record
      await supabase.from('profiles').delete().eq('id', '00000000-0000-0000-0000-000000000000')
    }

    // Check what subscription statuses currently exist
    const { data: statuses, error: statusError } = await supabase
      .from('profiles')
      .select('subscription_status')
      .not('subscription_status', 'is', null)

    if (!statusError && statuses) {
      const uniqueStatuses = [...new Set(statuses.map(s => s.subscription_status))]
      console.log('📊 Current subscription statuses in database:', uniqueStatuses)
    }

  } catch (error) {
    console.error('❌ Error checking constraint:', error)
  }
}

checkSubscriptionConstraint()
