import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const { website } = await request.json()

    if (!website) {
      return NextResponse.json({ error: 'Website URL is required' }, { status: 400 })
    }

    // Validate URL format
    try {
      new URL(website)
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
    }

    // Try to fetch and analyze real website content
    const analysis = await analyzeRealWebsite(website)

    return NextResponse.json(analysis)
  } catch (error) {
    console.error('Website analysis error:', error)
    return NextResponse.json({ error: 'Failed to analyze website' }, { status: 500 })
  }
}

async function analyzeRealWebsite(url: string) {
  try {
    // First try to fetch website content
    const content = await fetchWebsiteContent(url)
    
  // If we have AI API keys, use AI analysis
  const geminiApiKey = process.env.GOOGLE_GEMINI_API_KEY
  const openaiApiKey = process.env.OPENAI_API_KEY
  if ((geminiApiKey || openaiApiKey) && content) {
    return await analyzeWithAI(content, url)
  }
    
    // Fallback to intelligent analysis based on URL and basic content
    const name = extractNameFromUrl(url)
    return getIntelligentAnalysis(name, url.toLowerCase(), content)
    
  } catch (error) {
    console.error('Real website analysis failed:', error)
    // Fallback to basic analysis
    const name = extractNameFromUrl(url)
    return getIntelligentAnalysis(name, url.toLowerCase(), '')
  }
}

async function fetchWebsiteContent(url: string): Promise<string> {
  try {
    console.log(`Fetching content from: ${url}`)
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Connection': 'keep-alive'
      },
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)

    if (!response.ok) {
      console.error(`HTTP error: ${response.status} for ${url}`)
      throw new Error(`HTTP ${response.status}`)
    }

    const html = await response.text()
    console.log(`Fetched ${html.length} characters from ${url}`)
    
    // Extract text content from HTML
    const textContent = extractTextFromHTML(html)
    console.log(`Extracted ${textContent.length} characters of text content`)
    
    // Limit content size to avoid token limits
    const limitedContent = textContent.slice(0, 8000)
    console.log(`Limited content to ${limitedContent.length} characters`)
    
    return limitedContent
    
  } catch (error) {
    console.error(`Failed to fetch website content from ${url}:`, error)
    return ''
  }
}

function extractTextFromHTML(html: string): string {
  // Remove script and style elements
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
  text = text.replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
  
  // Extract title and meta description first
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i)
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i)
  
  let priorityContent = ''
  if (titleMatch) priorityContent += titleMatch[1] + '. '
  if (descMatch) priorityContent += descMatch[1] + '. '
  
  // Extract headings (h1, h2, h3) for key features
  const headings = html.match(/<h[1-6][^>]*>([^<]*)<\/h[1-6]>/gi) || []
  const headingText = headings.map(h => h.replace(/<[^>]*>/g, '')).join('. ')
  
  // Extract button and link text for actions/features
  const buttons = html.match(/<(button|a)[^>]*>([^<]*)<\/(button|a)>/gi) || []
  const buttonText = buttons.map(b => b.replace(/<[^>]*>/g, '')).filter(t => t.length > 2 && t.length < 50).join('. ')
  
  // Focus on main content areas with better selectors
  const contentSelectors = [
    /<main[^>]*>([\s\S]*?)<\/main>/gi,
    /<article[^>]*>([\s\S]*?)<\/article>/gi,
    /<section[^>]*class[^>]*(?:hero|landing|about|features|benefits)[^>]*>([\s\S]*?)<\/section>/gi,
    /<div[^>]*class[^>]*(?:content|main|hero|landing|about|features|benefits)[^>]*>([\s\S]*?)<\/div>/gi
  ]
  
  let mainContent = ''
  for (const regex of contentSelectors) {
    let match
    while ((match = regex.exec(html)) !== null) {
      mainContent += match[1] + ' '
    }
  }
  
  // If no main content found, use body
  if (!mainContent) {
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
    mainContent = bodyMatch ? bodyMatch[1] : html
  }
  
  // Combine all content with priority
  const fullContent = priorityContent + headingText + '. ' + buttonText + '. ' + mainContent
  
  // Remove HTML tags
  text = fullContent.replace(/<[^>]*>/g, ' ')
  
  // Decode HTML entities
  text = text.replace(/&nbsp;/g, ' ')
  text = text.replace(/&amp;/g, '&')
  text = text.replace(/&lt;/g, '<')
  text = text.replace(/&gt;/g, '>')
  text = text.replace(/&quot;/g, '"')
  text = text.replace(/&#39;/g, "'")
  text = text.replace(/&mdash;/g, '—')
  text = text.replace(/&ndash;/g, '–')
  
  // Clean up whitespace and remove common noise
  text = text.replace(/\s+/g, ' ')
  text = text.replace(/\b(cookie|privacy|terms|subscribe|newsletter|footer|header|menu|navigation|login|signup|sign up|sign in)\b/gi, '')
  text = text.trim()
  
  return text
}

async function analyzeWithAI(content: string, url: string): Promise<any> {
  // Try Gemini first (cheaper), then fallback to OpenAI
  const geminiApiKey = process.env.GOOGLE_GEMINI_API_KEY
  const openaiApiKey = process.env.OPENAI_API_KEY
  
  if (geminiApiKey) {
    try {
      return await analyzeWithGemini(content, url)
    } catch (error) {
      console.error('Gemini analysis failed, trying OpenAI:', error)
      // Continue to OpenAI fallback
    }
  }
  
  if (openaiApiKey) {
    return await analyzeWithOpenAI(content, url)
  }
  
  throw new Error('No AI API keys configured')
}

async function analyzeWithGemini(content: string, url: string): Promise<any> {
  const geminiApiKey = process.env.GOOGLE_GEMINI_API_KEY
  
  if (!geminiApiKey) {
    throw new Error('Google Gemini API key not configured')
  }

  const name = extractNameFromUrl(url)
  
  const prompt = `You are a product analyst specializing in Reddit lead discovery. Analyze this website and extract information to help identify prospects on Reddit who would be interested in this product.

Website: ${url}
Content: ${content}

Provide a JSON response with this exact structure:
{
  "name": "Extract the actual product name from the website",
  "description": "1-2 sentence description of what this product actually does based on the website content",
  "features": ["Short feature 1", "Short feature 2", "Short feature 3", "Short feature 4", "Short feature 5"],
  "benefits": ["Quantified benefit with % or number", "Quantified benefit with % or number", "Quantified benefit with % or number"],
  "painPoints": ["Specific pain point this solves", "Specific pain point this solves", "Specific pain point this solves"],
  "idealCustomerProfile": "Specific description of who uses this product (job titles, company types, industries)"
}

CRITICAL REQUIREMENTS:
- Features: Keep each feature to 2-4 words maximum (e.g., "Real-time collaboration", "Automated workflows")
- Benefits: MUST include numbers/percentages (e.g., "Reduce costs by 40%", "Save 10+ hours weekly")
- Pain Points: Exactly 3 main problems this product solves (be specific, not generic)
- Customer Profile: Focus on job titles, company sizes, and industries that would discuss this on Reddit

Base everything on the actual website content provided. If the website is about project management, don't make it about payments. Extract what the product ACTUALLY does.`

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096,
        }
      }),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      console.error(`Gemini API error ${response.status}:`, errorText)
      
      if (response.status === 429) {
        throw new Error('Gemini API rate limit exceeded. Please try again in a moment.')
      } else if (response.status === 400) {
        throw new Error('Gemini API request invalid. Please check your API key.')
      } else {
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`)
      }
    }

    const data = await response.json()
    console.log('Gemini API response:', JSON.stringify(data, null, 2))
    
    const analysisText = data.candidates?.[0]?.content?.parts?.[0]?.text
    const finishReason = data.candidates?.[0]?.finishReason

    if (!analysisText) {
      console.error('Gemini response structure:', data)
      throw new Error('No analysis returned from Gemini')
    }
    
    if (finishReason === 'MAX_TOKENS') {
      console.warn('Gemini response was truncated due to token limit')
      throw new Error('Gemini response truncated - trying OpenAI fallback')
    }
    
    console.log('Gemini analysis text:', analysisText)

    // Parse JSON response
    let cleanText = analysisText.trim()
    
    // Remove markdown code blocks if present
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }
    
    const analysis = JSON.parse(cleanText)
    
    // Validate the response structure
    if (!analysis.name || !analysis.description || !analysis.features || !analysis.benefits || !analysis.painPoints || !analysis.idealCustomerProfile) {
      throw new Error('Invalid analysis structure from Gemini')
    }
    
    return analysis
    
  } catch (error) {
    console.error('Gemini analysis error:', error)
    // Return a more helpful error for rate limits
    if (error instanceof Error && error.message.includes('rate limit')) {
      throw error // Re-throw rate limit errors so user sees them
    }
    // Re-throw other errors to be handled by the caller
    throw error
  }
}

async function analyzeWithOpenAI(content: string, url: string): Promise<any> {
  const openaiApiKey = process.env.OPENAI_API_KEY
  
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured')
  }
  
  const name = extractNameFromUrl(url)
  
  const prompt = `You are a product analyst specializing in Reddit lead discovery. Analyze this website and extract information to help identify prospects on Reddit who would be interested in this product.

Website: ${url}
Content: ${content}

Provide a JSON response with this exact structure:
{
  "name": "Extract the actual product name from the website",
  "description": "1-2 sentence description of what this product actually does based on the website content",
  "features": ["Short feature 1", "Short feature 2", "Short feature 3", "Short feature 4", "Short feature 5"],
  "benefits": ["Quantified benefit with % or number", "Quantified benefit with % or number", "Quantified benefit with % or number"],
  "painPoints": ["Specific pain point this solves", "Specific pain point this solves", "Specific pain point this solves"],
  "idealCustomerProfile": "Specific description of who uses this product (job titles, company types, industries)"
}

CRITICAL REQUIREMENTS:
- Features: Keep each feature to 2-4 words maximum (e.g., "Real-time collaboration", "Automated workflows")
- Benefits: MUST include numbers/percentages (e.g., "Reduce costs by 40%", "Save 10+ hours weekly")
- Pain Points: Exactly 3 main problems this product solves (be specific, not generic)
- Customer Profile: Focus on job titles, company sizes, and industries that would discuss this on Reddit

Base everything on the actual website content provided. If the website is about project management, don't make it about payments. Extract what the product ACTUALLY does.`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert product analyst who creates detailed, impactful product analyses for lead generation. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      console.error(`OpenAI API error ${response.status}:`, errorText)
      
      if (response.status === 429) {
        throw new Error('OpenAI API rate limit exceeded. Please try again in a moment.')
      } else if (response.status === 401) {
        throw new Error('OpenAI API key is invalid or expired.')
      } else {
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`)
      }
    }

    const data = await response.json()
    const analysisText = data.choices[0]?.message?.content

    if (!analysisText) {
      throw new Error('No analysis returned from OpenAI')
    }

    // Parse JSON response
    let cleanText = analysisText.trim()
    
    // Remove markdown code blocks if present
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }
    
    const analysis = JSON.parse(cleanText)
    
    // Validate the response structure
    if (!analysis.name || !analysis.description || !analysis.features || !analysis.benefits || !analysis.painPoints || !analysis.idealCustomerProfile) {
      throw new Error('Invalid analysis structure from OpenAI')
    }
    
    return analysis
    
  } catch (error) {
    console.error('OpenAI analysis error:', error)
    // Return a more helpful error for rate limits
    if (error instanceof Error && error.message.includes('rate limit')) {
      throw error // Re-throw rate limit errors so user sees them
    }
    // Fallback to intelligent analysis for other errors
    return getIntelligentAnalysis(name, url.toLowerCase(), content)
  }
}

function getFastAnalysis(url: string) {
  const name = extractNameFromUrl(url)
  const domain = url.toLowerCase()
  
  // Analyze domain and name to provide relevant details
  const analysis = getIntelligentAnalysis(name, domain, '')
  
  return {
    name,
    description: analysis.description,
    features: analysis.features,
    benefits: analysis.benefits,
    painPoints: analysis.painPoints,
    idealCustomerProfile: analysis.idealCustomerProfile
  }
}

function getIntelligentAnalysis(name: string, domain: string, content: string = '') {
  console.log(`Analyzing ${name} with content length: ${content.length}`)
  
  // If we have substantial content, do content-based analysis
  if (content && content.length > 100) {
    return analyzeContentIntelligently(name, domain, content)
  }
  
  // Otherwise fall back to domain/name based analysis
  return analyzeDomainBasedFallback(name, domain)
}

function analyzeContentIntelligently(name: string, domain: string, content: string) {
  const textToAnalyze = `${name} ${domain} ${content}`.toLowerCase()
  
  // Extract actual features from content
  const features = extractFeaturesFromContent(content)
  const benefits = extractBenefitsFromContent(content)
  const painPoints = extractPainPointsFromContent(content)
  const description = generateDescriptionFromContent(name, content)
  const customerProfile = generateCustomerProfileFromContent(content)
  
  return {
    name: name,
    description: description,
    features: features.slice(0, 5),
    benefits: benefits.slice(0, 3),
    painPoints: painPoints.slice(0, 3),
    idealCustomerProfile: customerProfile
  }
}

function extractFeaturesFromContent(content: string): string[] {
  const features: string[] = []
  
  // Extract headings as potential features
  const headings = content.match(/(?:^|\n)([A-Z][^.!?\n]{10,60})(?=\n|$)/g) || []
  headings.forEach(heading => {
    const clean = heading.trim().replace(/[^\w\s-]/g, '').substring(0, 40)
    if (clean.length > 5 && clean.length < 40) {
      features.push(clean)
    }
  })
  
  // Look for feature-indicating patterns
  const featurePatterns = [
    /(?:features?|capabilities?|tools?)[:\s]*([^.!?\n]{10,50})/gi,
    /(?:you can|able to|allows? you to|helps? you)[:\s]*([^.!?\n]{10,50})/gi,
    /(?:built-in|includes?|comes with|offers?)[:\s]*([^.!?\n]{10,50})/gi,
    /(?:real-time|automated?|instant|smart|ai-powered)[:\s]*([^.!?\n]{5,40})/gi
  ]
  
  for (const pattern of featurePatterns) {
    let match
    while ((match = pattern.exec(content)) !== null && features.length < 8) {
      const feature = match[1].trim().replace(/[^\w\s-]/g, '').substring(0, 40)
      if (feature.length > 5 && !features.some(f => f.toLowerCase().includes(feature.toLowerCase().substring(0, 8)))) {
        features.push(feature)
      }
    }
  }
  
  // Extract action words as features
  if (features.length < 3) {
    const actionWords = content.match(/\b(manage|create|build|track|monitor|analyze|automate|integrate|collaborate|share|sync|deploy|optimize|scale|secure)\s+[\w\s]{5,30}/gi) || []
    actionWords.slice(0, 5).forEach(action => {
      const cleanAction = action.replace(/[^\w\s]/g, '').substring(0, 30).trim()
      if (cleanAction.length > 5 && !features.some(f => f.toLowerCase().includes(cleanAction.toLowerCase().substring(0, 8)))) {
        features.push(cleanAction)
      }
    })
  }
  
  return features.length > 0 ? features : ['Core functionality', 'User management', 'Data analytics', 'API access', 'Team collaboration']
}

function extractBenefitsFromContent(content: string): string[] {
  const benefits: string[] = []
  
  // Look for quantified benefits
  const benefitPatterns = [
    /(?:save|reduce|increase|improve|boost|grow|cut|eliminate)[\s\w]*?(\d+(?:\.\d+)?%?[\s\w]*(?:time|cost|revenue|efficiency|productivity|speed|faster|slower|more|less))/gi,
    /(\d+(?:\.\d+)?%?\s*(?:faster|quicker|more efficient|less time|cost savings|revenue increase|productivity gain))/gi,
    /(?:up to|over|more than|less than|reduce by|increase by)\s*(\d+(?:\.\d+)?%?[\s\w]*)/gi
  ]
  
  for (const pattern of benefitPatterns) {
    let match
    while ((match = pattern.exec(content)) !== null && benefits.length < 5) {
      const benefit = match[1].trim()
      if (benefit.length > 3 && !benefits.some(b => b.toLowerCase().includes(benefit.toLowerCase().substring(0, 8)))) {
        benefits.push(`Achieve ${benefit}`)
      }
    }
  }
  
  // Look for time-saving benefits
  const timePatterns = /(?:save|reduce)[\s\w]*?(\d+\s*(?:hours?|minutes?|days?|weeks?))/gi
  let timeMatch
  while ((timeMatch = timePatterns.exec(content)) !== null && benefits.length < 5) {
    benefits.push(`Save ${timeMatch[1]} weekly`)
  }
  
  return benefits.length > 0 ? benefits : ['Increase productivity by 35%', 'Reduce manual work by 50%', 'Save 8+ hours weekly']
}

function extractPainPointsFromContent(content: string): string[] {
  const painPoints: string[] = []
  
  // Look for problem-indicating phrases
  const problemPatterns = [
    /(?:problem|issue|challenge|struggle|difficult|hard|frustrating|annoying|time-consuming|manual|tedious)[\s\w]*?([^.!?\n]{15,80})/gi,
    /(?:without|can't|cannot|unable to|difficult to|hard to|struggle to)[\s\w]*?([^.!?\n]{15,60})/gi,
    /(?:waste|wasting|losing|lost)[\s\w]*?([^.!?\n]{10,60})/gi
  ]
  
  for (const pattern of problemPatterns) {
    let match
    while ((match = pattern.exec(content)) !== null && painPoints.length < 5) {
      const painPoint = match[1].trim().replace(/[^\w\s-]/g, '').substring(0, 60)
      if (painPoint.length > 10 && !painPoints.some(p => p.toLowerCase().includes(painPoint.toLowerCase().substring(0, 15)))) {
        painPoints.push(painPoint)
      }
    }
  }
  
  return painPoints.length > 0 ? painPoints : ['Manual repetitive tasks', 'Disconnected team workflows', 'Lack of real-time collaboration']
}

function generateDescriptionFromContent(name: string, content: string): string {
  // Try to extract a description from the first meaningful sentences
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20)
  
  for (const sentence of sentences.slice(0, 5)) {
    const clean = sentence.trim()
    if (clean.toLowerCase().includes(name.toLowerCase()) && clean.length > 30 && clean.length < 200) {
      return clean + '.'
    }
  }
  
  // Look for description patterns
  const descPatterns = [
    new RegExp(`${name}\\s+(?:is|helps|enables|allows|provides)\\s+([^.!?]{20,150})`, 'i'),
    /(?:platform|tool|service|solution)\\s+(?:that|to)\\s+([^.!?]{20,150})/i,
    /(?:helps?|enables?|allows?)\\s+(?:you|users?|teams?|businesses?)\\s+(?:to\\s+)?([^.!?]{20,150})/i
  ]
  
  for (const pattern of descPatterns) {
    const match = content.match(pattern)
    if (match && match[1]) {
      return `${name} ${match[1].trim()}.`
    }
  }
  
  return `${name} is a platform that helps teams work more efficiently and collaborate better.`
}

function generateCustomerProfileFromContent(content: string): string {
  // Look for mentions of target users
  const userPatterns = [
    /(?:for|designed for|built for|helps|perfect for)[\s\w]*?(developers?|designers?|teams?|businesses?|companies?|startups?|enterprises?|agencies?|freelancers?|managers?|engineers?)/gi,
    /(?:developers?|designers?|teams?|businesses?|companies?|startups?|enterprises?|agencies?|freelancers?|managers?|engineers?)[\s\w]*?(?:use|love|choose|prefer|need)/gi
  ]
  
  const mentionedUsers = new Set<string>()
  for (const pattern of userPatterns) {
    let match
    while ((match = pattern.exec(content)) !== null) {
      mentionedUsers.add(match[1].toLowerCase())
    }
  }
  
  if (mentionedUsers.size > 0) {
    const users = Array.from(mentionedUsers).slice(0, 3).join(', ')
    return `${users} looking to improve their workflows and productivity`
  }
  
  return 'Growing businesses, remote teams, and professionals seeking better collaboration tools'
}

function analyzeDomainBasedFallback(name: string, domain: string) {
  const nameLower = name.toLowerCase()
  const textToAnalyze = `${nameLower} ${domain}`
  
  // Simple category-based analysis for when we don't have content
  if (textToAnalyze.includes('payment') || textToAnalyze.includes('stripe') || textToAnalyze.includes('billing')) {
    return {
      name: name,
      description: `${name} is a payment processing platform that helps businesses handle online transactions.`,
      features: ['Payment processing', 'Subscription billing', 'Fraud detection', 'Multi-currency support', 'API integration'],
      benefits: ['Reduce payment failures by 25%', 'Increase conversion by 15%', 'Save 10+ hours on reconciliation'],
      painPoints: ['Payment failures losing revenue', 'Complex billing reconciliation', 'High cart abandonment rates'],
      idealCustomerProfile: 'E-commerce businesses, SaaS companies, and online merchants processing payments'
    }
  } else if (textToAnalyze.includes('design') || textToAnalyze.includes('figma') || textToAnalyze.includes('ui')) {
    return {
      name: name,
      description: `${name} is a design collaboration platform that helps teams create digital products.`,
      features: ['Design collaboration', 'Prototyping tools', 'Component libraries', 'Version control', 'Real-time editing'],
      benefits: ['Reduce design time by 40%', 'Improve team efficiency by 60%', 'Cut feedback cycles by 50%'],
      painPoints: ['Design feedback scattered across tools', 'Version control conflicts', 'Slow design handoff'],
      idealCustomerProfile: 'Design teams, product managers, and creative agencies building digital products'
    }
  } else if (textToAnalyze.includes('code') || textToAnalyze.includes('github') || textToAnalyze.includes('git')) {
    return {
      name: name,
      description: `${name} is a development platform that helps teams build and manage software projects.`,
      features: ['Version control', 'Code collaboration', 'Pull requests', 'Issue tracking', 'CI/CD integration'],
      benefits: ['Deploy 3x faster', 'Reduce bugs by 45%', 'Save 15+ hours weekly'],
      painPoints: ['Manual deployment processes', 'Code review bottlenecks', 'Lack of development visibility'],
      idealCustomerProfile: 'Software developers, engineering teams, and tech companies building applications'
    }
  } else {
    return {
      name: name,
      description: `${name} is a business platform that helps teams collaborate and work more efficiently.`,
      features: ['Team collaboration', 'Project management', 'Data analytics', 'API access', 'User management'],
      benefits: ['Increase productivity by 35%', 'Reduce manual work by 50%', 'Save 8+ hours weekly'],
      painPoints: ['Manual repetitive tasks', 'Disconnected team workflows', 'Lack of real-time collaboration'],
      idealCustomerProfile: 'Growing businesses, remote teams, and professionals seeking better collaboration tools'
    }
  }
}

function extractNameFromUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname
    const domain = hostname.replace('www.', '')
    return domain.split('.')[0].replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  } catch {
    return 'Product Name'
  }
}
