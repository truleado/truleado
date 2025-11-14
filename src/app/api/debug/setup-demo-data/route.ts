export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Setting up demo data...')
    
    const supabase = await createClient()
    
    // Create a demo user profile
    const demoUserId = '00000000-0000-0000-0000-000000000000'
    const demoUser = {
      id: demoUserId,
      email: 'demo@truleado.com',
      full_name: 'Demo User',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      subscription_status: 'trial',
      subscription_plan: 'starter'
    }
    
    console.log('Creating demo user profile...')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert([demoUser])
      .select()
      .single()
    
    if (profileError) {
      console.error('Profile creation error:', profileError)
      return NextResponse.json({ 
        success: false,
        error: 'Failed to create demo profile',
        details: profileError.message 
      })
    }
    
    console.log('✅ Demo profile created:', profile.id)
    
    // Create demo products
    const demoProducts = [
      {
        user_id: demoUserId,
        name: 'CRM Pro',
        description: 'A comprehensive CRM solution for growing businesses',
        website_url: 'https://www.crmpro.com',
        features: ['Lead Management', 'Contact Tracking', 'Sales Pipeline', 'Email Integration'],
        benefits: ['Increase sales by 30%', 'Save 10+ hours weekly', 'Better customer relationships'],
        pain_points: ['Lost leads in spreadsheets', 'Poor follow-up processes', 'Manual data entry'],
        ideal_customer_profile: 'Small to medium businesses, sales teams, entrepreneurs',
        subreddits: ['entrepreneur', 'smallbusiness', 'startups', 'sales'],
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        user_id: demoUserId,
        name: 'TaskMaster',
        description: 'Project management and task tracking for remote teams',
        website_url: 'https://www.taskmaster.com',
        features: ['Task Management', 'Team Collaboration', 'Progress Tracking', 'Deadline Alerts'],
        benefits: ['Complete projects 40% faster', 'Reduce missed deadlines by 60%', 'Improve team coordination'],
        pain_points: ['Projects running over deadline', 'Poor team coordination', 'Lack of project visibility'],
        ideal_customer_profile: 'Project managers, remote teams, growing businesses',
        subreddits: ['productivity', 'projectmanagement', 'remotework', 'startups'],
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]
    
    console.log('Creating demo products...')
    const { data: products, error: productsError } = await supabase
      .from('products')
      .upsert(demoProducts)
      .select()
    
    if (productsError) {
      console.error('Products creation error:', productsError)
      return NextResponse.json({ 
        success: false,
        error: 'Failed to create demo products',
        details: productsError.message 
      })
    }
    
    console.log(`✅ Created ${products?.length || 0} demo products`)
    
    // Create demo leads
    const demoLeads = [
      {
        user_id: demoUserId,
        product_id: products?.[0]?.id,
        reddit_post_id: 'demo1',
        reddit_post_url: 'https://www.reddit.com/r/entrepreneur/comments/demo1',
        title: 'Looking for a CRM solution for my small business',
        content: 'Our current spreadsheet system is a nightmare. Need something to track leads and customer interactions. Any recommendations?',
        subreddit: 'entrepreneur',
        author: 'smallbizowner',
        score: 15,
        num_comments: 8,
        status: 'new',
        ai_analysis: {
          qualityScore: 9,
          confidence: 9,
          reasons: ['Explicitly looking for CRM', 'Mentions pain point (spreadsheet nightmare)', 'Asking for recommendations'],
          sampleReply: 'Hey u/smallbizowner! I totally get the spreadsheet struggle. CRM Pro is designed to streamline lead tracking and customer interactions, helping you ditch the manual work. Would you be open to a quick chat about how it could fit your needs?',
          painPoints: ['spreadsheet system is a nightmare'],
          buyingSignals: ['looking for a CRM solution', 'need something to track leads'],
          suggestedApproach: 'Offer a demo focusing on CRM and lead tracking benefits.'
        },
        created_at: new Date().toISOString()
      },
      {
        user_id: demoUserId,
        product_id: products?.[0]?.id,
        reddit_post_id: 'demo2',
        reddit_post_url: 'https://www.reddit.com/r/smallbusiness/comments/demo2',
        title: 'Struggling with lead management - any tools that help?',
        content: 'My sales team is drowning in leads and we\'re missing follow-ups. Need a better system to organize everything.',
        subreddit: 'smallbusiness',
        author: 'salesmanager',
        score: 22,
        num_comments: 12,
        status: 'new',
        ai_analysis: {
          qualityScore: 8,
          confidence: 8,
          reasons: ['Explicitly struggling with lead management', 'Seeking tools for better system', 'High engagement (22 upvotes)'],
          sampleReply: 'Hi u/salesmanager! It sounds like your team is facing a common challenge. CRM Pro offers robust lead management features that ensure no follow-up is missed and your team stays organized. We\'ve helped many businesses like yours improve their sales process. Let me know if you\'d like to learn more!',
          painPoints: ['drowning in leads', 'missing follow-ups'],
          buyingSignals: ['struggling with lead management', 'any tools that help?', 'need a better system'],
          suggestedApproach: 'Highlight lead management and follow-up automation features.'
        },
        created_at: new Date().toISOString()
      },
      {
        user_id: demoUserId,
        product_id: products?.[1]?.id,
        reddit_post_id: 'demo3',
        reddit_post_url: 'https://www.reddit.com/r/productivity/comments/demo3',
        title: 'What project management tools do you use for remote teams?',
        content: 'Just started managing a remote team and need better project visibility. What tools have worked well for you?',
        subreddit: 'productivity',
        author: 'newmanager',
        score: 18,
        num_comments: 15,
        status: 'new',
        ai_analysis: {
          qualityScore: 7,
          confidence: 7,
          reasons: ['Directly asking for project management tools', 'Needs better project visibility', 'Active discussion (15 comments)'],
          sampleReply: 'Hey u/newmanager! Congrats on the new role! For remote teams, TaskMaster has been a game-changer for project visibility and team coordination. It helps you track progress, set deadlines, and keep everyone aligned. Happy to share more if you\'re interested!',
          painPoints: ['need better project visibility'],
          buyingSignals: ['what project management tools do you use?', 'what tools have worked well for you?'],
          suggestedApproach: 'Emphasize project visibility and remote team coordination features.'
        },
        created_at: new Date().toISOString()
      }
    ]
    
    console.log('Creating demo leads...')
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .upsert(demoLeads)
      .select()
    
    if (leadsError) {
      console.error('Leads creation error:', leadsError)
      return NextResponse.json({ 
        success: false,
        error: 'Failed to create demo leads',
        details: leadsError.message 
      })
    }
    
    console.log(`✅ Created ${leads?.length || 0} demo leads`)
    
    return NextResponse.json({
      success: true,
      message: 'Demo data setup completed successfully',
      data: {
        profile: profile,
        products: products,
        leads: leads
      },
      counts: {
        profiles: 1,
        products: products?.length || 0,
        leads: leads?.length || 0
      }
    })
    
  } catch (error) {
    console.error('❌ Demo data setup error:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Demo data setup failed', 
      details: error.message 
    })
  }
}
