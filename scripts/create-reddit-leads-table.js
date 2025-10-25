const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function createRedditLeadsTable() {
  try {
    console.log('🔧 Creating reddit_leads table...')
    
    // Create the table
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS reddit_leads (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          selftext TEXT,
          subreddit TEXT NOT NULL,
          score INTEGER DEFAULT 0,
          num_comments INTEGER DEFAULT 0,
          url TEXT NOT NULL,
          created_utc BIGINT,
          author TEXT,
          reasoning TEXT,
          sample_pitch TEXT,
          keyword TEXT,
          product_name TEXT,
          product_description TEXT,
          saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })

    if (createError) {
      console.error('❌ Error creating table:', createError)
      return
    }

    console.log('✅ Table created successfully')

    // Create indexes
    console.log('🔧 Creating indexes...')
    
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_reddit_leads_user_id ON reddit_leads(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_reddit_leads_saved_at ON reddit_leads(saved_at DESC);',
      'CREATE INDEX IF NOT EXISTS idx_reddit_leads_subreddit ON reddit_leads(subreddit);',
      'CREATE INDEX IF NOT EXISTS idx_reddit_leads_keyword ON reddit_leads(keyword);'
    ]

    for (const indexSql of indexes) {
      const { error: indexError } = await supabase.rpc('exec_sql', { sql: indexSql })
      if (indexError) {
        console.error('❌ Error creating index:', indexError)
      }
    }

    console.log('✅ Indexes created successfully')

    // Enable RLS
    console.log('🔧 Enabling Row Level Security...')
    
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE reddit_leads ENABLE ROW LEVEL SECURITY;'
    })

    if (rlsError) {
      console.error('❌ Error enabling RLS:', rlsError)
    } else {
      console.log('✅ RLS enabled successfully')
    }

    // Create RLS policies
    console.log('🔧 Creating RLS policies...')
    
    const policies = [
      `CREATE POLICY "Users can view their own reddit leads" ON reddit_leads
        FOR SELECT USING (auth.uid() = user_id);`,
      `CREATE POLICY "Users can insert their own reddit leads" ON reddit_leads
        FOR INSERT WITH CHECK (auth.uid() = user_id);`,
      `CREATE POLICY "Users can update their own reddit leads" ON reddit_leads
        FOR UPDATE USING (auth.uid() = user_id);`,
      `CREATE POLICY "Users can delete their own reddit leads" ON reddit_leads
        FOR DELETE USING (auth.uid() = user_id);`
    ]

    for (const policySql of policies) {
      const { error: policyError } = await supabase.rpc('exec_sql', { sql: policySql })
      if (policyError) {
        console.error('❌ Error creating policy:', policyError)
      }
    }

    console.log('✅ RLS policies created successfully')

    // Create updated_at trigger
    console.log('🔧 Creating updated_at trigger...')
    
    const triggerFunction = `
      CREATE OR REPLACE FUNCTION update_reddit_leads_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `

    const { error: functionError } = await supabase.rpc('exec_sql', { sql: triggerFunction })
    if (functionError) {
      console.error('❌ Error creating trigger function:', functionError)
    }

    const trigger = `
      CREATE TRIGGER update_reddit_leads_updated_at
        BEFORE UPDATE ON reddit_leads
        FOR EACH ROW
        EXECUTE FUNCTION update_reddit_leads_updated_at();
    `

    const { error: triggerError } = await supabase.rpc('exec_sql', { sql: trigger })
    if (triggerError) {
      console.error('❌ Error creating trigger:', triggerError)
    } else {
      console.log('✅ Trigger created successfully')
    }

    console.log('🎉 Reddit leads table setup completed successfully!')

  } catch (error) {
    console.error('❌ Migration failed:', error)
  }
}

createRedditLeadsTable()
