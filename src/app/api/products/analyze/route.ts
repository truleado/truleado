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

    // Fetch website content
    const websiteContent = await fetchWebsiteContent(website)
    
    if (!websiteContent) {
      return NextResponse.json({ error: 'Could not fetch website content' }, { status: 400 })
    }

    // Analyze with OpenAI
    const analysis = await analyzeWithOpenAI(websiteContent, website)

    return NextResponse.json(analysis)
  } catch (error) {
    console.error('Website analysis error:', error)
    return NextResponse.json({ error: 'Failed to analyze website' }, { status: 500 })
  }
}

async function fetchWebsiteContent(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TruleadoBot/1.0)',
      },
    })

    if (!response.ok) {
      return null
    }

    const html = await response.text()
    
    // Extract text content from HTML
    const textContent = extractTextFromHTML(html)
    return textContent
  } catch (error) {
    console.error('Error fetching website:', error)
    return null
  }
}

function extractTextFromHTML(html: string): string {
  // Remove script and style elements
  const cleanHtml = html
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<style[^>]*>.*?<\/style>/gi, '')
    .replace(/<noscript[^>]*>.*?<\/noscript>/gi, '')
  
  // Extract text from common content areas
  const contentSelectors = [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'div', 'span', 'section', 'article',
    'main', 'header', 'footer'
  ]
  
  let textContent = ''
  
  // Simple regex-based extraction
  const tagRegex = /<[^>]+>/g
  textContent = cleanHtml.replace(tagRegex, ' ')
  
  // Clean up whitespace
  textContent = textContent
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 8000) // Limit content length
  
  return textContent
}

async function analyzeWithOpenAI(content: string, url: string, retryCount = 0) {
  const openaiApiKey = process.env.OPENAI_API_KEY
  
  if (!openaiApiKey) {
    // Return mock data if OpenAI key is not configured
    return {
      name: extractNameFromUrl(url),
      description: 'AI analysis not available. Please configure OpenAI API key.',
      features: ['Feature 1', 'Feature 2', 'Feature 3'],
      benefits: ['Benefit 1', 'Benefit 2', 'Benefit 3'],
      painPoints: ['Pain Point 1', 'Pain Point 2'],
      idealCustomerProfile: 'Small to medium businesses looking for solutions',
    }
  }

  // Add exponential backoff delay
  const delay = Math.min(1000 * Math.pow(2, retryCount), 10000) // Max 10 seconds
  await new Promise(resolve => setTimeout(resolve, delay))

  try {
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
            content: `You are a SaaS product analyst. Analyze the provided website content and extract:
            1. Product name
            2. Product description (2-3 sentences)
            3. Key features (5-7 items)
            4. Main benefits (4-6 items)
            5. Pain points/problems it solves (3-5 items)
            6. Ideal customer profile (1-2 sentences)
            
            Return the response as a JSON object with these exact keys: name, description, features, benefits, painPoints, idealCustomerProfile`
          },
          {
            role: 'user',
            content: `Website URL: ${url}\n\nWebsite Content:\n${content}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    })

    if (!response.ok) {
      if (response.status === 429 && retryCount < 3) {
        // Retry with exponential backoff
        console.log(`Rate limited, retrying in ${delay}ms (attempt ${retryCount + 1}/3)`)
        return analyzeWithOpenAI(content, url, retryCount + 1)
      }
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please wait a moment and try again.')
      }
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const analysisText = data.choices[0]?.message?.content

    if (!analysisText) {
      throw new Error('No analysis returned from OpenAI')
    }

    // Parse JSON response
    const analysis = JSON.parse(analysisText)
    
    // Validate and clean the response
    return {
      name: analysis.name || extractNameFromUrl(url),
      description: analysis.description || 'No description available',
      features: Array.isArray(analysis.features) ? analysis.features : [],
      benefits: Array.isArray(analysis.benefits) ? analysis.benefits : [],
      painPoints: Array.isArray(analysis.painPoints) ? analysis.painPoints : [],
      idealCustomerProfile: analysis.idealCustomerProfile || 'Target customers not specified',
    }
  } catch (error) {
    console.error('OpenAI analysis error:', error)
    
    // Return fallback analysis
    return {
      name: extractNameFromUrl(url),
      description: 'AI analysis failed. Please manually enter product details.',
      features: ['Manual entry required'],
      benefits: ['Manual entry required'],
      painPoints: ['Manual entry required'],
      idealCustomerProfile: 'Manual entry required',
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
