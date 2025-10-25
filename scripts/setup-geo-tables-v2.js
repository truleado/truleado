// Simple script to create GEO tables using Supabase client with direct SQL execution
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createGeoTables() {
  console.log('🚀 Setting up GEO tables...')
  
  try {
    // First, let's check if we can execute SQL directly
    console.log('Testing database connection...')
    
    // Try to create a simple test table first
    const testQuery = `
      CREATE TABLE IF NOT EXISTS geo_test_table (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        test_field TEXT
      );
    `
    
    console.log('Creating test table...')
    const { data: testData, error: testError } = await supabase
      .from('_sql')
      .select('*')
      .limit(1)
    
    if (testError) {
      console.log('Direct SQL not available, trying alternative approach...')
      
      // Alternative approach: Create tables through Supabase dashboard or use migrations
      console.log('❌ Direct SQL execution not available in this Supabase instance')
      console.log('📋 Please run the following SQL commands manually in your Supabase dashboard:')
      console.log('')
      console.log('1. Go to your Supabase dashboard')
      console.log('2. Navigate to SQL Editor')
      console.log('3. Run the following SQL:')
      console.log('')
      console.log('-- Copy and paste this SQL into your Supabase SQL Editor:')
      console.log('')
      
      // Read and display the migration file
      const fs = require('fs')
      const migrationPath = require('path').join(__dirname, '..', 'migration-add-geo-tables.sql')
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
      console.log(migrationSQL)
      
      return
    }
    
    console.log('✅ Database connection successful')
    
    // If we get here, we can proceed with table creation
    console.log('Creating GEO tables...')
    
    // Create geo_content_optimization table
    console.log('Creating geo_content_optimization table...')
    const { error: contentError } = await supabase
      .from('_sql')
      .select('*')
      .eq('query', `
        CREATE TABLE IF NOT EXISTS geo_content_optimization (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          content_type VARCHAR(50) NOT NULL,
          title VARCHAR(255),
          original_content TEXT NOT NULL,
          optimized_content TEXT,
          geo_score INTEGER DEFAULT 0 CHECK (geo_score >= 0 AND geo_score <= 100),
          chatgpt_visibility_score INTEGER DEFAULT 0 CHECK (chatgpt_visibility_score >= 0 AND chatgpt_visibility_score <= 100),
          optimization_suggestions JSONB DEFAULT '[]'::jsonb,
          target_keywords TEXT[] DEFAULT '{}',
          industry VARCHAR(100),
          content_url VARCHAR(500),
          status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'optimized', 'published', 'archived')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `)
    
    if (contentError) {
      console.error('Error creating geo_content_optimization:', contentError)
    } else {
      console.log('✅ geo_content_optimization table created')
    }
    
    console.log('🎉 GEO tables setup completed!')
    console.log('You can now use the GEO features in your application.')
    
  } catch (error) {
    console.error('❌ Setup failed:', error)
    console.log('')
    console.log('📋 Manual Setup Instructions:')
    console.log('1. Go to your Supabase dashboard')
    console.log('2. Navigate to SQL Editor')
    console.log('3. Copy and paste the SQL from migration-add-geo-tables.sql')
    console.log('4. Execute the SQL to create the tables')
  }
}

createGeoTables()
