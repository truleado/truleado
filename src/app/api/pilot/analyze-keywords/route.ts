import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Starting website keyword analysis...')
    
    const { website } = await request.json()
    
    if (!website) {
      return NextResponse.json({ error: 'Website URL is required' }, { status: 400 })
    }

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    console.log(`Analyzing website: ${website}`)

    // Fetch website content
    let websiteContent = ''
    try {
      const response = await fetch(website, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      })
      
      if (response.ok) {
        const html = await response.text()
        
        // Extract text content from HTML (basic extraction)
        websiteContent = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 8000) // Limit content length
      } else {
        throw new Error(`Failed to fetch website: ${response.status}`)
      }
    } catch (fetchError) {
      console.error('Error fetching website:', fetchError)
      return NextResponse.json({ 
        error: 'Failed to fetch website content',
        details: fetchError.message 
      }, { status: 400 })
    }

    if (!websiteContent || websiteContent.length < 100) {
      return NextResponse.json({ 
        error: 'Website content too short or empty',
        details: 'Could not extract meaningful content from the website'
      }, { status: 400 })
    }

    console.log(`Extracted ${websiteContent.length} characters of content`)

    // Create prompt for Gemini
    const prompt = `
Analyze the following website content and identify the 3 most relevant keywords that best define this website.

Website URL: ${website}
Website Content: ${websiteContent}

Please provide:
1. The 3 most relevant keywords (single words or short phrases)
2. Brief explanations for why each keyword is relevant
3. A short summary of what this website is about

Respond in the following JSON format:
{
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "explanations": ["explanation1", "explanation2", "explanation3"],
  "summary": "Brief summary of the website"
}

Focus on:
- Core business/product/service
- Main value proposition
- Target audience or industry
- Unique differentiators

Make sure the keywords are specific, relevant, and accurately represent the website's purpose.
`

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
        
        // Fallback: try to extract keywords manually
        const fallbackKeywords = extractKeywordsFallback(websiteContent, website)
        analysisData = {
          keywords: fallbackKeywords,
          explanations: [
            'Core business focus',
            'Main service offering', 
            'Target market or industry'
          ],
          summary: `Website analysis for ${website}`
        }
      }

      console.log('Analysis complete:', analysisData)

      return NextResponse.json({
        success: true,
        website: website,
        keywords: analysisData.keywords || [],
        explanations: analysisData.explanations || [],
        summary: analysisData.summary || 'Website analysis completed',
        contentLength: websiteContent.length
      })

    } catch (geminiError) {
      console.error('Gemini API error:', geminiError)
      
      // Fallback analysis
      const fallbackKeywords = extractKeywordsFallback(websiteContent, website)
      
      return NextResponse.json({
        success: true,
        website: website,
        keywords: fallbackKeywords,
        explanations: [
          'Primary business focus',
          'Main service or product',
          'Target audience or industry'
        ],
        summary: `Basic analysis of ${website}`,
        contentLength: websiteContent.length,
        note: 'Used fallback analysis due to AI service issues'
      })
    }

  } catch (error) {
    console.error('❌ Website analysis error:', error)
    return NextResponse.json({ 
      error: 'Analysis failed', 
      details: error.message 
    }, { status: 500 })
  }
}

// Fallback keyword extraction function
function extractKeywordsFallback(content: string, url: string): string[] {
  const words = content.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3)
  
  // Count word frequency
  const wordCount: { [key: string]: number } = {}
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1
  })
  
  // Get most common words
  const sortedWords = Object.entries(wordCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word)
  
  // Extract domain-based keyword
  const domain = url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
  const domainKeyword = domain.split('.')[0]
  
  // Return top 3 keywords
  return [
    domainKeyword || sortedWords[0] || 'business',
    sortedWords[0] || 'service',
    sortedWords[1] || 'platform'
  ].slice(0, 3)
}
