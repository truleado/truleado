const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function updateTrialTo7Days() {
  console.log('🔄 Updating trial period to 7 days...')
  
  try {
    // Update existing users who have 1-day trials to 7-day trials
    const { data: update1, error: error1 } = await supabase
      .from('profiles')
      .update({
        trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('subscription_status', 'trial')
      .not('trial_ends_at', 'is', null)
      .lt('trial_ends_at', new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString())

    if (error1) {
      console.error('Error updating active trials:', error1)
    } else {
      console.log(`✅ Updated ${update1?.length || 0} active trials to 7 days`)
    }

    // Update users who have no trial_ends_at but have trial status
    const { data: update2, error: error2 } = await supabase
      .from('profiles')
      .update({
        trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('subscription_status', 'trial')
      .is('trial_ends_at', null)

    if (error2) {
      console.error('Error updating null trial dates:', error2)
    } else {
      console.log(`✅ Updated ${update2?.length || 0} users with null trial dates`)
    }

    // Update the trigger function for new users
    const { error: functionError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION public.handle_new_user()
        RETURNS TRIGGER AS $$
        BEGIN
          INSERT INTO public.profiles (id, email, full_name, subscription_status, trial_ends_at, trial_count, last_trial_at)
          VALUES (
            NEW.id, 
            NEW.email, 
            COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
            'trial',
            NOW() + INTERVAL '7 days',
            1,
            NOW()
          );
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    })

    if (functionError) {
      console.error('Error updating trigger function:', functionError)
    } else {
      console.log('✅ Updated trigger function for 7-day trials')
    }

    console.log('🎉 Migration completed successfully!')
    console.log('📝 All new users will now get 7-day trials')
    console.log('📝 Existing trial users have been updated to 7-day trials')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

updateTrialTo7Days()
