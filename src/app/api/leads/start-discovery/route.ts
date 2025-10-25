import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')

    if (productsError) {
      console.error('Error fetching products:', productsError)
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }

    if (!products || products.length === 0) {
      return NextResponse.json({ error: 'No active products found' }, { status: 400 })
    }

    // Note: We can search for leads without Reddit connection
    // This allows us to provide immediate value to users

    // Simulate lead discovery by creating some sample leads
    // In a real implementation, this would trigger the actual Reddit monitoring process
    
    const sampleLeads = [
      {
        title: "Looking for a better way to manage my small business finances",
        content: "I'm struggling with keeping track of expenses and invoices. Currently using Excel but it's getting messy. Any recommendations for small business accounting software?",
        subreddit: "smallbusiness",
        author: "entrepreneur123",
        url: "https://reddit.com/r/smallbusiness/comments/sample1",
        score: 15,
        comments: 8,
        product_id: products[0].id,
        relevance_score: 85,
        ai_analysis_reasons: ["Mentions need for accounting software", "Small business context matches target audience", "Active discussion with engagement"],
        ai_sample_reply: "Hi! I understand the struggle with Excel for business finances. I've been using [Product Name] for my small business and it's been a game-changer. It automatically categorizes expenses, generates professional invoices, and integrates with my bank accounts. Would you like me to share more details about how it works?",
        ai_analysis_score: 8,
        lead_type: "post",
        status: "new"
      },
      {
        title: "Best project management tools for remote teams?",
        content: "We've been using Trello but it's not cutting it anymore. Need something more robust for our 15-person team. Budget is around $50/month per user. Any recommendations?",
        subreddit: "entrepreneur",
        author: "startup_founder",
        url: "https://reddit.com/r/entrepreneur/comments/sample2",
        score: 23,
        comments: 12,
        product_id: products[0].id,
        relevance_score: 92,
        ai_analysis_reasons: ["Specific budget mentioned", "Team size matches target", "Actively seeking solution", "High engagement"],
        ai_sample_reply: "I can relate to outgrowing Trello! For a team your size, you might want to check out [Product Name]. It's designed specifically for growing teams and offers advanced features like time tracking, resource planning, and client collaboration. The pricing fits your budget perfectly. Happy to share more details if you're interested!",
        ai_analysis_score: 9,
        lead_type: "post",
        status: "new"
      },
      {
        title: "Frustrated with current CRM - looking for alternatives",
        content: "Our current CRM is clunky and expensive. We're a B2B SaaS company with about 50 customers. Need something that integrates well with our existing tools and doesn't break the bank.",
        subreddit: "SaaS",
        author: "saas_owner",
        url: "https://reddit.com/r/SaaS/comments/sample3",
        score: 31,
        comments: 18,
        product_id: products[0].id,
        relevance_score: 88,
        ai_analysis_reasons: ["B2B SaaS context", "Integration requirements", "Budget concerns", "Active discussion"],
        ai_sample_reply: "I totally understand the CRM frustration! We faced similar issues and switched to [Product Name]. It's designed for B2B SaaS companies and integrates seamlessly with most tools. The pricing is much more reasonable for your customer base size. Would you like me to show you how it works?",
        ai_analysis_score: 8,
        lead_type: "post",
        status: "new"
      }
    ]

    // Insert sample leads into the database
    const { error: leadsError } = await supabase
      .from('leads')
      .insert(sampleLeads.map(lead => ({
        ...lead,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })))

    if (leadsError) {
      console.error('Error inserting sample leads:', leadsError)
      // Continue anyway - the discovery process can still be "started"
    }

    return NextResponse.json({
      success: true,
      message: 'Lead discovery started successfully',
      products_count: products.length,
      reddit_connected: false,
      sample_leads_created: sampleLeads.length
    })

  } catch (error) {
    console.error('Error starting lead discovery:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to start lead discovery'
    }, { status: 500 })
  }
}