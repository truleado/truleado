import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Creating test user and data...')
    
    const supabase = await createClient()
    
    // Create a test user using Supabase Auth
    const testEmail = 'test@truleado.com'
    const testPassword = 'testpassword123'
    
    console.log('Creating test user account...')
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Test User'
        }
      }
    })
    
    if (authError) {
      console.error('Auth creation error:', authError)
      return NextResponse.json({ 
        success: false,
        error: 'Failed to create test user',
        details: authError.message 
      })
    }
    
    console.log('✅ Test user created:', authData.user?.id)
    
    // Wait a moment for the user to be fully created
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Now create products and leads for this user
    const userId = authData.user?.id
    if (!userId) {
      return NextResponse.json({ 
        success: false,
        error: 'No user ID returned from auth creation'
      })
    }
    
    // Create test products
    const testProducts = [
      {
        user_id: userId,
        name: 'CRM Pro',
        description: 'A comprehensive CRM solution for growing businesses',
        website_url: 'https://www.crmpro.com',
        features: ['Lead Management', 'Contact Tracking', 'Sales Pipeline', 'Email Integration'],
        benefits: ['Increase sales by 30%', 'Save 10+ hours weekly', 'Better customer relationships'],
        pain_points: ['Lost leads in spreadsheets', 'Poor follow-up processes', 'Manual data entry'],
        ideal_customer_profile: 'Small to medium businesses, sales teams, entrepreneurs',
        subreddits: ['entrepreneur', 'smallbusiness', 'startups', 'sales'],
        status: 'active'
      },
      {
        user_id: userId,
        name: 'TaskMaster',
        description: 'Project management and task tracking for remote teams',
        website_url: 'https://www.taskmaster.com',
        features: ['Task Management', 'Team Collaboration', 'Progress Tracking', 'Deadline Alerts'],
        benefits: ['Complete projects 40% faster', 'Reduce missed deadlines by 60%', 'Improve team coordination'],
        pain_points: ['Projects running over deadline', 'Poor team coordination', 'Lack of project visibility'],
        ideal_customer_profile: 'Project managers, remote teams, growing businesses',
        subreddits: ['productivity', 'projectmanagement', 'remotework', 'startups'],
        status: 'active'
      }
    ]
    
    console.log('Creating test products...')
    const { data: products, error: productsError } = await supabase
      .from('products')
      .insert(testProducts)
      .select()
    
    if (productsError) {
      console.error('Products creation error:', productsError)
      return NextResponse.json({ 
        success: false,
        error: 'Failed to create test products',
        details: productsError.message 
      })
    }
    
    console.log(`✅ Created ${products?.length || 0} test products`)
    
    // Create test leads
    const testLeads = [
      {
        user_id: userId,
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
        }
      },
      {
        user_id: userId,
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
        }
      },
      {
        user_id: userId,
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
        }
      }
    ]
    
    console.log('Creating test leads...')
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .insert(testLeads)
      .select()
    
    if (leadsError) {
      console.error('Leads creation error:', leadsError)
      return NextResponse.json({ 
        success: false,
        error: 'Failed to create test leads',
        details: leadsError.message 
      })
    }
    
    console.log(`✅ Created ${leads?.length || 0} test leads`)
    
    return NextResponse.json({
      success: true,
      message: 'Test user and data created successfully',
      user: {
        id: userId,
        email: testEmail,
        password: testPassword
      },
      data: {
        products: products,
        leads: leads
      },
      counts: {
        products: products?.length || 0,
        leads: leads?.length || 0
      },
      instructions: {
        login: `Use email: ${testEmail} and password: ${testPassword}`,
        nextSteps: 'Go to /auth/signin to login with these credentials'
      }
    })
    
  } catch (error) {
    console.error('❌ Test user creation error:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Test user creation failed', 
      details: error.message 
    })
  }
}