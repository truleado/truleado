import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import * as cheerio from 'cheerio'

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

    // Check if Gemini API key is available
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY
    console.log('API Key status:', apiKey ? 'Present' : 'Missing')
    console.log('API Key length:', apiKey ? apiKey.length : 0)
    
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'Google Gemini API key not configured',
        details: 'To use this feature, you need to set up a Google Gemini API key. Please add GOOGLE_GEMINI_API_KEY to your environment variables. You can get a free API key from https://makersuite.google.com/app/apikey'
      }, { status: 500 })
    }

    // Initialize Gemini AI with correct model
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

    // Create enhanced prompt for Gemini to extract product name, description, and keywords
    const prompt = `Analyze the following website content and identify:
1. The main product or service name that this website offers
2. A brief description (2-3 sentences) of what this product/service is about and what it does
3. The 3 most relevant keywords that best represent this website

Website URL: ${normalizedUrl}
Website Content: ${websiteContent}

Return ONLY a valid JSON object with this exact structure:
{
  "productName": "Main product or service name",
  "description": "Brief description of what the product/service is about and what it does",
  "keywords": ["keyword1", "keyword2", "keyword3"]
}`

    try {
      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      console.log('Gemini response:', text)

      // Parse JSON response
      let analysisData
      try {
        // Clean the response text
        let cleanText = text.trim()
        
        // Remove markdown code blocks if present
        if (cleanText.startsWith('```json')) {
          cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '')
        } else if (cleanText.startsWith('```')) {
          cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '')
        }

        analysisData = JSON.parse(cleanText)
      } catch (parseError) {
        console.error('JSON parse error:', parseError)
        console.error('Raw response:', text)
        
        return NextResponse.json({
          error: 'AI response parsing failed',
          details: 'The AI returned invalid JSON format',
          website: normalizedUrl
        }, { status: 500 })
      }

      console.log('Analysis complete:', analysisData)

      return NextResponse.json({
        productName: analysisData.productName || 'Unknown Product',
        description: analysisData.description || 'No description available',
        keywords: analysisData.keywords || []
      })

    } catch (geminiError: any) {
      console.error('Gemini API error:', geminiError)
      
      return NextResponse.json({
        error: 'AI analysis failed',
        details: geminiError.message || 'Failed to analyze website with AI',
        website: normalizedUrl
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ Website analysis error:', error)
    return NextResponse.json({ 
      error: 'Analysis failed', 
      details: error.message 
    }, { status: 500 })
  }
}

