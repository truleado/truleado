export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'
import { callOpenRouterJSON } from '@/lib/openrouter-client'

// Helper function to extract content from HTML
function extractContentFromHTML(html: string): string {
  const $ = cheerio.load(html)
  
  // Remove irrelevant tags
  $('script, style, noscript, iframe, header, footer, nav').remove()
  
  // Extract meaningful text content
  const title = $('title').text().trim()
  const metaDescription = $('meta[name="description"]').attr('content') || ''
  const h1Text = $('h1').map((_, el) => $(el).text().trim()).get().join(' ')
  const h2Text = $('h2').map((_, el) => $(el).text().trim()).get().join(' ')
  const bodyText = $('body').text().replace(/\s\s+/g, ' ').trim()
  
  // Combine all meaningful content
  return [
    title,
    metaDescription,
    h1Text,
    h2Text,
    bodyText
  ].filter(Boolean).join(' ').substring(0, 12000)
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Starting website keyword analysis...')
    
    const { website } = await request.json()
    
    if (!website) {
      return NextResponse.json({ error: 'Website URL is required' }, { status: 400 })
    }

    // Validate and normalize URL
    let normalizedUrl = website.trim()
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl
    }

    console.log(`Analyzing website: ${normalizedUrl}`)

    // Fetch website content with proper headers
    let websiteContent = ''
    try {
      const response = await fetch(normalizedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        redirect: 'manual', // Handle redirects manually to avoid loops
        signal: AbortSignal.timeout(30000), // 30 second timeout
      })
      
      // Handle redirects manually to avoid loops
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location')
        if (location) {
          console.log(`Redirect detected to: ${location}`)
          
          // Handle relative URLs
          let redirectUrl = location
          if (location.startsWith('/')) {
            const url = new URL(normalizedUrl)
            redirectUrl = `${url.protocol}//${url.host}${location}`
          } else if (!location.startsWith('http')) {
            redirectUrl = `${normalizedUrl}/${location}`
          }
          
          console.log(`Resolved redirect URL: ${redirectUrl}`)
          
          // Try the redirect URL
          const redirectResponse = await fetch(redirectUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.5',
            },
            signal: AbortSignal.timeout(30000),
          })
          
          if (redirectResponse.ok) {
            const html = await redirectResponse.text()
            websiteContent = extractContentFromHTML(html)
            console.log(`Extracted ${websiteContent.length} characters of content from redirect`)
          } else {
            throw new Error(`Failed to fetch redirected website: ${redirectResponse.status} ${redirectResponse.statusText}`)
          }
        } else {
          throw new Error(`Redirect detected but no location header found`)
        }
      } else if (response.ok) {
        const html = await response.text()
        websiteContent = extractContentFromHTML(html)
        console.log(`Extracted ${websiteContent.length} characters of content`)
      } else {
        throw new Error(`Failed to fetch website: ${response.status} ${response.statusText}`)
      }
    } catch (fetchError: any) {
      console.error('Error fetching website:', fetchError)
      
      let errorMessage = 'Failed to fetch website content'
      let details = fetchError.message
      
      if (fetchError.message.includes('redirect count exceeded')) {
        errorMessage = 'Website has too many redirects'
        details = 'This website has redirect loops or too many redirects. Please try a different URL or check if the website is accessible.'
      } else if (fetchError.message.includes('fetch failed')) {
        errorMessage = 'Network error'
        details = 'Unable to connect to the website. Please check the URL and try again.'
      } else if (fetchError.message.includes('timeout')) {
        errorMessage = 'Request timeout'
        details = 'The website took too long to respond. Please try again.'
      }
      
      return NextResponse.json({ 
        error: errorMessage,
        details: details,
        website: normalizedUrl
      }, { status: 400 })
    }

    if (!websiteContent || websiteContent.length < 100) {
      return NextResponse.json({ 
        error: 'Website content too short or empty',
        details: 'Could not extract meaningful content from the website'
      }, { status: 400 })
    }

    console.log(`Extracted ${websiteContent.length} characters of content`)

    // Check if OpenRouter API key is available
    const apiKey = process.env.OPENROUTER_API_KEY
    console.log('API Key status:', apiKey ? 'Present' : 'Missing')
    console.log('API Key length:', apiKey ? apiKey.length : 0)
    
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'OpenRouter API key not configured',
        details: 'To use this feature, you need to set up an OpenRouter API key. Please add OPENROUTER_API_KEY to your environment variables. You can get an API key from https://openrouter.ai'
      }, { status: 500 })
    }

    // Create enhanced prompt for Gemini to extract detailed product insights and keyword groups
    const prompt = `You are a GTM strategist helping a SaaS founder find relevant Reddit conversations. Analyze the website content and output structured JSON.

Website URL: ${normalizedUrl}
Website Content (truncated): ${websiteContent}

Return ONLY valid JSON with this exact structure:
{
  "productName": "Actual product/service name from the site",
  "description": "2-3 sentences explaining what the product does and the outcome it delivers",
  "features": ["Feature name (2-4 words)", "..."],
  "benefits": ["Quantified benefit (e.g. 'Save 10+ hours weekly')", "..."],
  "painPoints": ["Specific problem customers complain about", "..."],
  "idealCustomerProfile": "Job titles, industries, company size that would care",
  "keywordGroups": [
    {
      "type": "core",
      "label": "Core product terms",
      "purpose": "Used to find posts about the product category itself",
      "keywords": ["keyword", "keyword", "keyword"]
    },
    {
      "type": "problem",
      "label": "Problem phrases",
      "purpose": "Used to find users complaining about the pain points",
      "keywords": ["pain keyword", "pain keyword", "pain keyword"]
    },
    {
      "type": "persona",
      "label": "Persona & context",
      "purpose": "Used to find posts from the target persona",
      "keywords": ["persona keyword", "persona keyword"]
    },
    {
      "type": "solution",
      "label": "Alternatives & solutions",
      "purpose": "Used to find 'what tool should I use' threads",
      "keywords": ["solution keyword", "competitor keyword"]
    }
  ]
}

Guidelines:
- Keep keyword lists concise (3-5 items per group)
- Keywords should be multi-word phrases people might actually type/post on Reddit
- Pain points must be phrased as the customer would complain (“support tickets piling up”, “inventory never syncs”)
- Persona keywords should combine role + context (e.g. "Shopify CX lead", "B2B SaaS founder")
- If information is missing, make a best guess consistent with the site content.`

    try {
      const analysisData = await callOpenRouterJSON<{
        productName: string
        description: string
        features: string[]
        benefits: string[]
        painPoints: string[]
        idealCustomerProfile: string
        keywordGroups: Array<{
          type: string
          label: string
          purpose: string
          keywords: string[]
        }>
      }>(prompt, {
        model: 'google/gemini-2.0-flash-exp:free',
        temperature: 0.7,
        max_tokens: 2000
      })
      
      console.log('OpenRouter response:', analysisData)

      console.log('Analysis complete:', analysisData)

      const keywordGroups = Array.isArray(analysisData.keywordGroups) ? analysisData.keywordGroups : []
      const flattenedKeywords = keywordGroups.flatMap(group => group.keywords || []).filter(Boolean)

      return NextResponse.json({
        productName: analysisData.productName || 'Unknown Product',
        description: analysisData.description || 'No description available',
        features: analysisData.features || [],
        benefits: analysisData.benefits || [],
        painPoints: analysisData.painPoints || [],
        idealCustomerProfile: analysisData.idealCustomerProfile || '',
        keywordGroups,
        keywords: flattenedKeywords.length > 0 ? flattenedKeywords : []
      })

    } catch (openrouterError: any) {
      console.error('OpenRouter API error:', openrouterError)
      
      return NextResponse.json({
        error: 'AI analysis failed',
        details: openrouterError.message || 'Failed to analyze website with AI',
        website: normalizedUrl
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ Website analysis error:', error)
    return NextResponse.json({ 
      error: 'Analysis failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

