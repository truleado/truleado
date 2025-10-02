import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { name, description, features, benefits, painPoints, idealCustomerProfile } = await request.json()

    if (!name && !description) {
      return NextResponse.json({ error: 'Product information is required' }, { status: 400 })
    }

    // Find relevant subreddits based on product analysis (fast version)
    const subreddits = getDefaultSubreddits({
      name,
      description,
      features,
      benefits,
      painPoints,
      idealCustomerProfile,
    })

    return NextResponse.json({ subreddits })
  } catch (error) {
    console.error('Subreddit discovery error:', error)
    return NextResponse.json({ error: 'Failed to find subreddits' }, { status: 500 })
  }
}

async function findRelevantSubreddits(productInfo: {
  name: string
  description: string
  features: string[]
  benefits: string[]
  painPoints: string[]
  idealCustomerProfile: string
}) {
  const openaiApiKey = process.env.OPENAI_API_KEY
  
  if (!openaiApiKey) {
    // Return default subreddits if OpenAI key is not configured
    return getDefaultSubreddits(productInfo)
  }

  try {
    const productSummary = `
Product: ${productInfo.name}
Description: ${productInfo.description}
Features: ${productInfo.features.join(', ')}
Benefits: ${productInfo.benefits.join(', ')}
Pain Points: ${productInfo.painPoints.join(', ')}
Target Customers: ${productInfo.idealCustomerProfile}
    `.trim()

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a Reddit community expert. Based on the product information provided, suggest 6-8 relevant subreddits where potential customers might discuss problems this product solves.

Consider:
- Business/entrepreneurship subreddits for B2B products
- Industry-specific subreddits
- Problem-solving communities
- Professional development subreddits

Return ONLY a valid JSON array of subreddit names (without r/ prefix). Example: ["entrepreneur", "smallbusiness", "marketing"]`
          },
          {
            role: 'user',
            content: productSummary
          }
        ],
        temperature: 0.7,
        max_tokens: 200,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const subredditsText = data.choices[0]?.message?.content

    if (!subredditsText) {
      throw new Error('No subreddits returned from OpenAI')
    }

    // Parse JSON response - handle markdown code blocks
    let cleanText = subredditsText.trim()
    
    // Remove markdown code blocks if present
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }
    
    const subreddits = JSON.parse(cleanText)
    
    // Validate and clean the response
    if (Array.isArray(subreddits)) {
      return subreddits.slice(0, 8) // Limit to 8 subreddits
    }
    
    return getDefaultSubreddits(productInfo)
  } catch (error) {
    console.error('OpenAI subreddit discovery error:', error)
    return getDefaultSubreddits(productInfo)
  }
}

function getDefaultSubreddits(productInfo: any): string[] {
  const text = `${productInfo.name} ${productInfo.description} ${productInfo.features?.join(' ') || ''} ${productInfo.painPoints?.join(' ') || ''} ${productInfo.idealCustomerProfile || ''}`.toLowerCase()
  
  let subreddits: string[] = []

  // Proposal/Sales tools - Target sales professionals and agencies (check first for highest specificity)
  if (text.includes('proposal')) {
    subreddits = [
      'sales',              // Sales professionals struggling with proposals
      'freelance',          // Freelancers creating proposals for clients
      'consulting',         // Consultants needing professional proposals
      'entrepreneur',       // Business owners closing deals
      'smallbusiness',      // Small businesses improving sales processes
      'marketing',          // Marketing agencies creating client proposals
      'webdev',             // Web developers/agencies pitching projects
      'digitalnomad'        // Remote professionals winning clients
    ]
  }
  
  // Analytics/Data tools - Target data-driven businesses (but not project management tools)
  else if ((text.includes('mixpanel') || text.includes('amplitude') || text.includes('segment') || text.includes('tableau') || (text.includes('analytics') && !text.includes('proposal'))) && 
           !(text.includes('asana') || text.includes('trello') || text.includes('monday') || text.includes('notion'))) {
    subreddits = [
      'analytics',          // Analytics professionals seeking better tools
      'entrepreneur',       // Entrepreneurs needing business insights
      'smallbusiness',      // Small businesses tracking performance
      'marketing',          // Marketers measuring campaign ROI
      'saas',               // SaaS companies tracking metrics
      'startups',           // Startups making data-driven decisions
      'ecommerce',          // E-commerce businesses analyzing sales
      'webdev'              // Developers implementing analytics
    ]
  }
  
  
  // Payment/Finance tools - Target specific financial pain points
  else if (text.includes('payment') || text.includes('stripe') || text.includes('billing') || text.includes('subscription') || text.includes('checkout')) {
    subreddits = [
      'ecommerce',           // E-commerce store owners dealing with payments
      'shopify',             // Shopify merchants with payment issues
      'entrepreneur',        // Entrepreneurs struggling with payment setup
      'saas',               // SaaS founders dealing with subscription billing
      'smallbusiness',      // Small businesses needing payment solutions
      'webdev',             // Developers implementing payment systems
      'startups',           // Startups setting up payment infrastructure
      'digitalnomad'        // Online business owners needing global payments
    ]
  }
  
  // CRM/Marketing tools - Target marketing and sales teams
  else if (text.includes('crm') || (text.includes('marketing') && text.includes('lead')) || text.includes('pipeline')) {
    subreddits = [
      'marketing',          // Marketing professionals managing campaigns
      'sales',              // Sales teams tracking leads and customers
      'entrepreneur',       // Entrepreneurs building customer relationships
      'smallbusiness',      // Small businesses organizing customer data
      'b2bsales',           // B2B sales professionals using CRM
      'startups',           // Startups setting up sales processes
      'digitalmarketing',   // Digital marketers tracking attribution
      'saas'                // SaaS companies optimizing sales funnels
    ]
  }
  
  // Project Management tools - Target project managers and teams (check first for highest specificity)
  else if (text.includes('asana') || text.includes('trello') || text.includes('monday') || text.includes('notion') || text.includes('clickup') || text.includes('jira') ||
           (text.includes('project') && (text.includes('task') || text.includes('team') || text.includes('collaboration') || text.includes('workflow')))) {
    subreddits = [
      'projectmanagement',  // Project managers optimizing workflows
      'entrepreneur',       // Entrepreneurs managing multiple projects
      'startups',           // Startups coordinating team efforts
      'smallbusiness',      // Small businesses organizing projects
      'webdev',             // Development teams managing sprints
      'freelance',          // Freelancers juggling client projects
      'productivity',       // Teams improving collaboration
      'consulting'          // Consultants managing client work
    ]
  }

  // Design/Creative tools - Target designers and product teams
  else if ((text.includes('design') && !text.includes('project')) || text.includes('figma') || text.includes('ui') || text.includes('ux') || text.includes('prototype')) {
    subreddits = [
      'userexperience',     // UX designers improving workflows
      'web_design',         // Web designers collaborating on projects
      'graphic_design',     // Graphic designers managing projects
      'startups',           // Startups building product design teams
      'webdev',             // Developers working with designers
      'entrepreneur',       // Entrepreneurs needing design solutions
      'productivity',       // Teams optimizing design workflows
      'freelance'           // Freelance designers managing clients
    ]
  }
  
  // Default business automation tools
  else {
    subreddits = [
      'entrepreneur',       // Entrepreneurs automating operations
      'smallbusiness',      // Small businesses streamlining processes
      'productivity',       // Teams eliminating manual work
      'startups',           // Startups scaling operations
      'business',           // Business owners optimizing workflows
      'saas',               // SaaS companies improving efficiency
      'freelance',          // Freelancers automating admin tasks
      'digitalnomad'        // Remote workers optimizing processes
    ]
  }

  // Remove duplicates and return unique subreddits
  return [...new Set(subreddits)].slice(0, 8)
}
