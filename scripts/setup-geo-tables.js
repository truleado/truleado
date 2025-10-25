// Simple script to create GEO tables using Supabase client
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
    // Create geo_content_optimization table
    console.log('Creating geo_content_optimization table...')
    const { error: contentError } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    })
    
    if (contentError) {
      console.error('Error creating geo_content_optimization:', contentError)
    } else {
      console.log('✅ geo_content_optimization table created')
    }

    // Create geo_metrics table
    console.log('Creating geo_metrics table...')
    const { error: metricsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS geo_metrics (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          content_id UUID REFERENCES geo_content_optimization(id) ON DELETE CASCADE,
          test_query TEXT NOT NULL,
          chatgpt_response TEXT,
          visibility_rank INTEGER,
          response_quality_score INTEGER CHECK (response_quality_score >= 0 AND response_quality_score <= 100),
          response_length INTEGER,
          mentions_count INTEGER DEFAULT 0,
          sentiment_score DECIMAL(3,2),
          test_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          test_duration_ms INTEGER,
          model_version VARCHAR(50) DEFAULT 'gpt-4'
        );
      `
    })
    
    if (metricsError) {
      console.error('Error creating geo_metrics:', metricsError)
    } else {
      console.log('✅ geo_metrics table created')
    }

    // Create geo_competitors table
    console.log('Creating geo_competitors table...')
    const { error: competitorsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS geo_competitors (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          competitor_domain VARCHAR(255) NOT NULL,
          competitor_name VARCHAR(255),
          industry VARCHAR(100),
          description TEXT,
          chatgpt_visibility_data JSONB DEFAULT '{}'::jsonb,
          last_analyzed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          analysis_frequency VARCHAR(20) DEFAULT 'weekly' CHECK (analysis_frequency IN ('daily', 'weekly', 'monthly')),
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })
    
    if (competitorsError) {
      console.error('Error creating geo_competitors:', competitorsError)
    } else {
      console.log('✅ geo_competitors table created')
    }

    // Create geo_trends table
    console.log('Creating geo_trends table...')
    const { error: trendsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS geo_trends (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          trend_keyword VARCHAR(255) NOT NULL,
          industry VARCHAR(100),
          search_volume INTEGER,
          competition_level VARCHAR(20) CHECK (competition_level IN ('low', 'medium', 'high')),
          opportunity_score INTEGER CHECK (opportunity_score >= 0 AND opportunity_score <= 100),
          chatgpt_mentions INTEGER DEFAULT 0,
          related_queries TEXT[] DEFAULT '{}',
          trend_data JSONB DEFAULT '{}'::jsonb,
          discovered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })
    
    if (trendsError) {
      console.error('Error creating geo_trends:', trendsError)
    } else {
      console.log('✅ geo_trends table created')
    }

    // Create geo_settings table
    console.log('Creating geo_settings table...')
    const { error: settingsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS geo_settings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
          default_content_type VARCHAR(50) DEFAULT 'website',
          target_industry VARCHAR(100),
          optimization_goals JSONB DEFAULT '{"visibility": true, "quality": true, "engagement": true}'::jsonb,
          notification_preferences JSONB DEFAULT '{"visibility_alerts": true, "competitor_updates": true, "trend_alerts": false}'::jsonb,
          api_limits JSONB DEFAULT '{"monthly_tests": 100, "content_optimizations": 50}'::jsonb,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })
    
    if (settingsError) {
      console.error('Error creating geo_settings:', settingsError)
    } else {
      console.log('✅ geo_settings table created')
    }

    // Enable RLS
    console.log('Enabling Row Level Security...')
    const tables = ['geo_content_optimization', 'geo_metrics', 'geo_competitors', 'geo_trends', 'geo_settings']
    
    for (const table of tables) {
      const { error: rlsError } = await supabase.rpc('exec_sql', {
        sql: `ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`
      })
      
      if (rlsError) {
        console.error(`Error enabling RLS for ${table}:`, rlsError)
      } else {
        console.log(`✅ RLS enabled for ${table}`)
      }
    }

    console.log('🎉 GEO tables setup completed!')
    console.log('You can now use the GEO features in your application.')
    
  } catch (error) {
    console.error('❌ Setup failed:', error)
    process.exit(1)
  }
}

createGeoTables()
