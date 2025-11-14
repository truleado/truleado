export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { callOpenRouterJSON } from '@/lib/openrouter-client'

export async function POST(request: NextRequest) {
  try {
    const { name, description, features, benefits, painPoints, idealCustomerProfile } = await request.json()

    if (!name && !description) {
      return NextResponse.json({ error: 'Product information is required' }, { status: 400 })
    }

    // Find relevant subreddits using AI analysis
    const subreddits = await findRelevantSubreddits({
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
  name?: string
  description?: string
  features?: string[]
  benefits?: string[]
  painPoints?: string[]
  idealCustomerProfile?: string
}) {
  try {
    const openrouterApiKey = process.env.OPENROUTER_API_KEY
    
    if (openrouterApiKey) {
      try {
        console.log('Finding subreddits with OpenRouter...')
        return await findSubredditsWithOpenRouter(productInfo)
      } catch (error) {
        console.error('OpenRouter subreddit discovery failed:', error)
        // Continue to fallback
      }
    }
    
    console.log('No AI API key available, using fallback subreddit suggestions')
    return getDefaultSubreddits(productInfo)
    
  } catch (error) {
    console.error('Subreddit discovery error:', error)
    return getDefaultSubreddits(productInfo)
  }
}

async function findSubredditsWithOpenRouter(productInfo: {
  name?: string
  description?: string
  features?: string[]
  benefits?: string[]
  painPoints?: string[]
  idealCustomerProfile?: string
}) {
  const productSummary = `
Product: ${productInfo.name || 'Unknown'}
Description: ${productInfo.description || 'No description provided'}
Features: ${(productInfo.features || []).join(', ') || 'No features specified'}
Benefits: ${(productInfo.benefits || []).join(', ') || 'No benefits specified'}
Pain Points: ${(productInfo.painPoints || []).join(', ') || 'No pain points specified'}
Target Customers: ${productInfo.idealCustomerProfile || 'No target customer profile specified'}
  `.trim()

  const prompt = `You are a Reddit community expert and lead generation specialist. Analyze this product and suggest 8-12 highly targeted subreddits where potential customers actively discuss the EXACT problems this product solves.

CRITICAL ANALYSIS APPROACH:
1. IDENTIFY THE CORE PROBLEM: What specific pain points does this product solve?
2. FIND THE SUFFERERS: Who experiences these problems most acutely?
3. LOCATE THE COMMUNITIES: Where do these people go to discuss their problems and seek solutions?
4. PRIORITIZE BY RELEVANCE: Focus on communities where the product would provide genuine value

INDUSTRY-SPECIFIC MAPPING:
- HR/Recruiting: r/recruiting, r/humanresources, r/jobs, r/careerguidance, r/HR, r/talentacquisition
- E-commerce: r/ecommerce, r/shopify, r/dropship, r/amazon, r/onlinebusiness, r/entrepreneur
- Marketing: r/marketing, r/digitalmarketing, r/socialmedia, r/PPC, r/content_marketing, r/SEO
- Sales: r/sales, r/salesforce, r/CRM, r/entrepreneur, r/smallbusiness
- Project Management: r/projectmanagement, r/productivity, r/agile, r/scrum, r/entrepreneur
- Communication: r/productivity, r/remotework, r/digitalnomad, r/entrepreneur, r/smallbusiness
- Design: r/userexperience, r/web_design, r/graphic_design, r/design, r/entrepreneur
- Development: r/webdev, r/programming, r/saas, r/startups, r/entrepreneur
- Finance: r/personalfinance, r/accounting, r/investing, r/smallbusiness, r/entrepreneur
- Healthcare: r/healthcare, r/medicine, r/nursing, r/pharmacy, r/healthcareIT
- Education: r/teachers, r/education, r/college, r/studying, r/edtech
- Real Estate: r/realestate, r/realestateinvesting, r/firsttimehomebuyer, r/realestateagent

PAIN POINT-BASED SELECTION:
- "Manual processes" → Productivity, automation, efficiency communities
- "Disconnected systems" → Integration, workflow, management communities  
- "Poor tracking" → Analytics, data, reporting communities
- "Team collaboration" → Remote work, productivity, management communities
- "Customer management" → CRM, sales, customer service communities
- "Hiring challenges" → HR, recruiting, jobs communities
- "E-commerce setup" → E-commerce, online business, entrepreneurship communities

AUDIENCE-SPECIFIC TARGETING:
- Small Business Owners: r/smallbusiness, r/entrepreneur, r/startups
- Enterprise Users: r/business, r/consulting, r/enterprise
- Technical Users: r/programming, r/webdev, r/sysadmin, r/technology
- Non-Technical Users: r/entrepreneur, r/smallbusiness, r/productivity
- Industry Professionals: Use industry-specific subreddits
- Freelancers/Consultants: r/freelance, r/consulting, r/digitalnomad

QUALITY CRITERIA:
- Active communities with regular discussions
- People seeking help, advice, or solutions
- Professional or semi-professional tone
- Relevant to the specific problems this product solves
- Mix of broad and niche communities
- Avoid promotional or spammy subreddits

Return ONLY a valid JSON array of 8-12 subreddit names (without r/ prefix). 
Example: ["recruiting", "humanresources", "jobs", "entrepreneur", "smallbusiness", "careerguidance", "HR", "talentacquisition"]

Product Analysis:
${productSummary}`

  try {
    const subreddits = await callOpenRouterJSON<string[]>(prompt, {
        model: 'google/gemini-2.5-pro-exp-03-25',
      temperature: 0.3,
      max_tokens: 1000
    })
    
    console.log('OpenRouter subreddit suggestions:', subreddits)
    return subreddits
  } catch (error) {
    console.error('OpenRouter subreddit discovery error:', error)
    throw error
  }
}

function getDefaultSubreddits(productInfo: any): string[] {
  // Enhanced fallback subreddit selection with industry-specific mapping
  const text = `${productInfo.name} ${productInfo.description} ${productInfo.features?.join(' ') || ''} ${productInfo.painPoints?.join(' ') || ''} ${productInfo.idealCustomerProfile || ''}`.toLowerCase()
  
  // Industry-specific subreddit categories with better targeting
  const subredditCategories = {
    // HR & Recruiting
    hr_recruiting: ['recruiting', 'humanresources', 'jobs', 'careerguidance', 'HR', 'talentacquisition', 'hiring'],
    
    // E-commerce & Online Business
    ecommerce: ['ecommerce', 'shopify', 'dropship', 'amazon', 'onlinebusiness', 'entrepreneur', 'smallbusiness'],
    
    // Sales & CRM
    sales: ['sales', 'salesforce', 'CRM', 'entrepreneur', 'smallbusiness', 'marketing'],
    
    // Marketing & Advertising
    marketing: ['marketing', 'digitalmarketing', 'socialmedia', 'PPC', 'content_marketing', 'SEO', 'entrepreneur'],
    
    // Project Management & Productivity
    project_management: ['projectmanagement', 'productivity', 'agile', 'scrum', 'entrepreneur', 'smallbusiness'],
    
    // Communication & Collaboration
    communication: ['productivity', 'remotework', 'digitalnomad', 'entrepreneur', 'smallbusiness', 'freelance'],
    
    // Design & UX
    design: ['userexperience', 'web_design', 'graphic_design', 'design', 'entrepreneur', 'webdev'],
    
    // Development & Technology
    development: ['webdev', 'programming', 'saas', 'startups', 'entrepreneur', 'technology', 'software'],
    
    // Finance & Accounting
    finance: ['personalfinance', 'accounting', 'investing', 'smallbusiness', 'entrepreneur', 'financialindependence'],
    
    // Healthcare
    healthcare: ['healthcare', 'medicine', 'nursing', 'pharmacy', 'healthcareIT', 'medical'],
    
    // Education
    education: ['teachers', 'education', 'college', 'studying', 'edtech', 'academia'],
    
    // Real Estate
    realestate: ['realestate', 'realestateinvesting', 'firsttimehomebuyer', 'realestateagent', 'property'],
    
    // Consulting & Freelance
    consulting: ['consulting', 'freelance', 'entrepreneur', 'smallbusiness', 'digitalnomad'],
    
    // Analytics & Data
    analytics: ['analytics', 'datascience', 'businessintelligence', 'excel', 'data', 'entrepreneur'],
    
    // Core Business (always included)
    business: ['entrepreneur', 'smallbusiness', 'startups', 'business']
  }
  
  let selectedSubreddits: string[] = []
  
  // Pain point-based keyword analysis for better targeting
  const painPointMappings = {
    // HR & Recruiting pain points
    hr_recruiting: {
      keywords: ['recruiting', 'hiring', 'hr', 'human resources', 'talent', 'candidate', 'applicant', 'staffing', 'ats', 'crm'],
      painPoints: ['manual recruitment', 'hiring process', 'candidate tracking', 'talent acquisition', 'staffing challenges']
    },
    
    // E-commerce pain points
    ecommerce: {
      keywords: ['ecommerce', 'online store', 'shopify', 'selling', 'retail', 'dropship', 'amazon', 'marketplace'],
      painPoints: ['ecommerce setup', 'online selling', 'payment processing', 'inventory management', 'shipping']
    },
    
    // Sales & CRM pain points
    sales: {
      keywords: ['sales', 'crm', 'lead', 'pipeline', 'conversion', 'revenue', 'client', 'customer', 'salesforce'],
      painPoints: ['losing leads', 'disorganized contacts', 'sales tracking', 'customer management', 'lead generation']
    },
    
    // Marketing pain points
    marketing: {
      keywords: ['marketing', 'advertising', 'promotion', 'brand', 'social', 'content', 'seo', 'ppc', 'campaigns'],
      painPoints: ['marketing challenges', 'low engagement', 'advertising costs', 'content creation', 'brand awareness']
    },
    
    // Project Management pain points
    project_management: {
      keywords: ['project', 'management', 'task', 'deadline', 'workflow', 'team', 'collaboration', 'planning'],
      painPoints: ['project chaos', 'missed deadlines', 'team coordination', 'task management', 'workflow issues']
    },
    
    // Communication pain points
    communication: {
      keywords: ['communication', 'team', 'collaboration', 'remote', 'messaging', 'slack', 'meetings', 'coordination'],
      painPoints: ['team communication', 'remote work', 'information scattered', 'meeting overload', 'collaboration issues']
    },
    
    // Design pain points
    design: {
      keywords: ['design', 'ui', 'ux', 'user experience', 'interface', 'visual', 'branding', 'creative'],
      painPoints: ['design challenges', 'user experience', 'branding issues', 'visual design', 'interface problems']
    },
    
    // Development pain points
    development: {
      keywords: ['development', 'programming', 'coding', 'software', 'app', 'platform', 'saas', 'tech'],
      painPoints: ['development challenges', 'technical issues', 'software problems', 'integration issues', 'coding problems']
    },
    
    // Finance pain points
    finance: {
      keywords: ['finance', 'accounting', 'bookkeeping', 'tax', 'budget', 'money', 'financial', 'investment'],
      painPoints: ['financial management', 'accounting challenges', 'budget tracking', 'tax issues', 'money management']
    },
    
    // Analytics pain points
    analytics: {
      keywords: ['analytics', 'data', 'metrics', 'tracking', 'reporting', 'dashboard', 'kpi', 'insights'],
      painPoints: ['data scattered', 'no insights', 'tracking issues', 'reporting challenges', 'metrics problems']
    }
  }
  
  // Analyze product characteristics using pain point mapping
  Object.entries(painPointMappings).forEach(([category, mapping]) => {
    const hasKeywords = mapping.keywords.some(keyword => text.includes(keyword))
    const hasPainPoints = mapping.painPoints.some(painPoint => text.includes(painPoint))
    
    if (hasKeywords || hasPainPoints) {
      selectedSubreddits.push(...(subredditCategories[category as keyof typeof subredditCategories] || []))
    }
  })
  
  // If no specific matches, analyze the ideal customer profile
  if (selectedSubreddits.length === 0) {
    const customerProfile = (productInfo.idealCustomerProfile || '').toLowerCase()
    
    if (customerProfile.includes('small business') || customerProfile.includes('startup')) {
      selectedSubreddits.push(...subredditCategories.business)
    } else if (customerProfile.includes('enterprise') || customerProfile.includes('large')) {
      selectedSubreddits.push('business', 'consulting', 'entrepreneur')
    } else if (customerProfile.includes('developer') || customerProfile.includes('technical')) {
      selectedSubreddits.push(...subredditCategories.development)
    } else {
    selectedSubreddits.push(...subredditCategories.business)
    }
  }
  
  // Always include core business subreddits as a baseline
  selectedSubreddits.push('entrepreneur', 'smallbusiness')
  
  // Remove duplicates and return unique subreddits (max 12)
  return [...new Set(selectedSubreddits)].slice(0, 12)
}