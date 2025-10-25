import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Manually populating leads for testing...')

    // Get user's products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', user.id)

    if (productsError || !products || products.length === 0) {
      return NextResponse.json({ error: 'No products found' }, { status: 400 })
    }

    // Create some sample leads for testing
    const sampleLeads = [
      {
        user_id: user.id,
        product_id: products[0].id,
        reddit_post_id: 'sample_lead_1',
        reddit_post_url: 'https://reddit.com/r/entrepreneur/sample_lead_1',
        title: 'Looking for a CRM solution for my small business',
        content: 'I run a small consulting business and need a CRM to track my clients. Currently using spreadsheets but it\'s getting messy. Any recommendations?',
        subreddit: 'entrepreneur',
        author: 'smallbizowner123',
        score: 15,
        num_comments: 8,
        status: 'new',
        ai_analysis: {
          qualityScore: 8,
          confidence: 7,
          reasons: ['Asks for CRM recommendations', 'Small business owner', 'Active discussion'],
          sampleReply: 'Hey! I\'ve been using a great CRM that might help with your client tracking. It\'s been a game-changer for organizing my business.',
          painPoints: ['disorganized client data', 'manual tracking'],
          buyingSignals: ['looking for', 'recommendations', 'need'],
          suggestedApproach: 'Offer a helpful response about CRM solutions and mention your product as a potential fit.'
        }
      },
      {
        user_id: user.id,
        product_id: products[0].id,
        reddit_post_id: 'sample_lead_2',
        reddit_post_url: 'https://reddit.com/r/smallbusiness/sample_lead_2',
        title: 'Struggling with lead management - any tools that help?',
        content: 'I\'m drowning in leads from different sources and can\'t keep track of follow-ups. Lost a big client last week because I forgot to follow up. Need something to help me stay organized.',
        subreddit: 'smallbusiness',
        author: 'busyentrepreneur',
        score: 23,
        num_comments: 12,
        status: 'new',
        ai_analysis: {
          qualityScore: 9,
          confidence: 8,
          reasons: ['Explicit pain point about lead management', 'Lost business due to poor tracking', 'High engagement'],
          sampleReply: 'I totally understand that feeling! I was in the same boat until I found a tool that automated my lead tracking. It\'s saved me so much time.',
          painPoints: ['drowning in leads', 'forgot to follow up', 'lost business'],
          buyingSignals: ['struggling', 'need', 'help'],
          suggestedApproach: 'Share your experience with lead management tools and offer to help with their specific situation.'
        }
      },
      {
        user_id: user.id,
        product_id: products[0].id,
        reddit_post_id: 'sample_lead_3',
        reddit_post_url: 'https://reddit.com/r/startups/sample_lead_3',
        title: 'What CRM do you use for your startup?',
        content: 'We\'re a 5-person startup and need to get our sales process organized. Currently using free tools but they\'re not cutting it. Budget is tight but willing to invest in something that works.',
        subreddit: 'startups',
        author: 'startupfounder',
        score: 18,
        num_comments: 15,
        status: 'new',
        ai_analysis: {
          qualityScore: 7,
          confidence: 6,
          reasons: ['Startup looking for CRM', 'Budget conscious but willing to invest', 'Active discussion'],
          sampleReply: 'We went through the same thing! Found a great solution that\'s affordable for startups. Happy to share what worked for us.',
          painPoints: ['unorganized sales process', 'free tools not working'],
          buyingSignals: ['need', 'willing to invest', 'budget'],
          suggestedApproach: 'Focus on the startup-friendly pricing and features that help small teams scale.'
        }
      }
    ]

    // Insert sample leads
    const { error: insertError } = await supabase
      .from('leads')
      .insert(sampleLeads)

    if (insertError) {
      console.error('Error inserting sample leads:', insertError)
      return NextResponse.json({ error: 'Failed to insert leads', details: insertError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Successfully created ${sampleLeads.length} sample leads for testing`,
      leads: sampleLeads.map(lead => ({
        title: lead.title,
        subreddit: lead.subreddit,
        score: lead.ai_analysis.qualityScore,
        url: lead.reddit_post_url
      }))
    })

  } catch (error) {
    console.error('Error in populate-leads:', error)
    return NextResponse.json({ error: 'Failed to populate leads' }, { status: 500 })
  }
}
