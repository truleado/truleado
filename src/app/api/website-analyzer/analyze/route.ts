export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'
import { callOpenRouterJSON } from '@/lib/openrouter-client'

// Helper function to extract content from HTML
function extractContentFromHTML(html: string): { title: string, metaDescription: string, headings: string[], bodyText: string, links: number, images: number } {
  const $ = cheerio.load(html)
  
  // Remove irrelevant tags
  $('script, style, noscript, iframe, header, footer, nav').remove()
  
  // Extract SEO elements
  const title = $('title').text().trim()
  const metaDescription = $('meta[name="description"]').attr('content') || ''
  const h1Text = $('h1').map((_, el) => $(el).text().trim()).get()
  const h2Text = $('h2').map((_, el) => $(el).text().trim()).get()
  const h3Text = $('h3').map((_, el) => $(el).text().trim()).get()
  const headings = [...h1Text, ...h2Text, ...h3Text]
  const bodyText = $('body').text().replace(/\s\s+/g, ' ').trim()
  
  // Count links and images
  const links = $('a[href]').length
  const images = $('img[src]').length
  
  return {
    title,
    metaDescription,
    headings,
    bodyText: bodyText.substring(0, 15000),
    links,
    images
  }
}

/**
 * Follow all redirects until we reach the final destination.
 * Includes multiple fallbacks for sites that omit Location headers.
 */
async function followRedirects(
  url: string,
  maxRedirects: number = 10,
  visitedUrls: Set<string> = new Set()
): Promise<{ finalUrl: string; response: Response }> {
  if (visitedUrls.has(url)) {
    throw new Error(`Redirect loop detected: ${url} was already visited`)
  }

  if (maxRedirects <= 0) {
    throw new Error(`Maximum redirect limit (10) reached for ${url}`)
  }

  visitedUrls.add(url)

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
    },
    redirect: 'manual',
    signal: AbortSignal.timeout(30000),
  })

  if (response.status >= 300 && response.status < 400) {
    let location = response.headers.get('location') ||
                   response.headers.get('Location') ||
                   response.headers.get('LOCATION')

    if (!location) {
      const refresh = response.headers.get('refresh') ||
                      response.headers.get('Refresh') ||
                      response.headers.get('REFRESH')
      if (refresh) {
        const urlMatch = refresh.match(/url\s*=\s*([^\s;]+)/i)
        if (urlMatch) {
          location = urlMatch[1].trim()
          console.log(`Found redirect via Refresh header: ${location}`)
        }
      }
    }

    let responseText: string | null = null
    if (!location) {
      console.warn(`Redirect (${response.status}) detected but no location header found for ${url}. Trying fallback strategies...`)
      try {
        const cloned = response.clone()
        responseText = await cloned.text()
      } catch (bodyErr) {
        console.warn('Unable to read redirect body:', bodyErr)
      }

      if (responseText) {
        const metaRefreshMatch = responseText.match(/<meta[^>]*http-equiv\s*=\s*["']?refresh["']?[^>]*content\s*=\s*["'][^"']*url\s*=\s*([^\s"'>]+)/i)
        if (metaRefreshMatch) {
          location = metaRefreshMatch[1].trim()
          console.log(`Found redirect URL in meta refresh: ${location}`)
        } else {
          const jsRedirectMatch = responseText.match(/window\.location\s*=\s*["']([^"']+)["']/i) ||
                                  responseText.match(/location\.href\s*=\s*["']([^"']+)["']/i)
          if (jsRedirectMatch) {
            location = jsRedirectMatch[1].trim()
            console.log(`Found redirect URL in JavaScript: ${location}`)
          }
        }
      }

      if (!location) {
        try {
          const autoResponse = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.5',
            },
            redirect: 'follow',
            signal: AbortSignal.timeout(30000),
          })

          if (autoResponse.ok) {
            console.log(`Automatic redirect handling succeeded for ${url} -> ${autoResponse.url}`)
            return { finalUrl: autoResponse.url, response: autoResponse }
          }
        } catch (autoError) {
          console.warn('Automatic redirect following failed:', autoError)
        }
      }

      if (!location && (response.status === 307 || response.status === 308) && responseText && responseText.length > 100) {
        console.log(`Using redirect response body as content (${responseText.length} chars)`)
        return {
          finalUrl: url,
          response: new Response(responseText, {
            status: 200,
            statusText: 'OK',
            headers: response.headers,
          })
        }
      }

      if (!location) {
        throw new Error(`Redirect (${response.status}) detected but no location header found for ${url}. All fallback strategies failed.`)
      }
    }

    let redirectUrl = location
    try {
      const currentUrl = new URL(url)
      if (location.startsWith('/')) {
        redirectUrl = `${currentUrl.protocol}//${currentUrl.host}${location}`
      } else if (location.startsWith('http://') || location.startsWith('https://')) {
        redirectUrl = location
      } else {
        redirectUrl = new URL(location, url).href
      }
    } catch (urlError) {
      throw new Error(`Invalid redirect URL: ${location} from ${url}`)
    }

    console.log(`Following redirect ${response.status} from ${url} -> ${redirectUrl} (${maxRedirects - 1} left)`)
    return followRedirects(redirectUrl, maxRedirects - 1, visitedUrls)
  }

  return { finalUrl: url, response }
}

async function fetchReadableContent(url: string): Promise<string | null> {
  try {
    const proxyUrl = `https://r.jina.ai/${url}`
    const response = await fetch(proxyUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
        'Accept': 'text/plain,text/html;q=0.9,*/*;q=0.8'
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(20000)
    })

    if (!response.ok) {
      console.warn(`Readable proxy request failed (${response.status}) for ${url}`)
      return null
    }

    const text = await response.text()
    const cleaned = text.replace(/\s\s+/g, ' ').trim()
    return cleaned.substring(0, 20000)
  } catch (error) {
    console.error('Readable proxy fetch failed:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Starting website analysis...')
    
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

    // Fetch website content with robust redirect/fallback handling
    let websiteContent: { title: string, metaDescription: string, headings: string[], bodyText: string, links: number, images: number } | null = null
    let finalUrl = normalizedUrl
    let contentSource: 'primary' | 'redirect' | 'readable-fallback' = 'primary'
    
    try {
      const { finalUrl: resolvedUrl, response } = await followRedirects(normalizedUrl)
      finalUrl = resolvedUrl
      
      if (resolvedUrl !== normalizedUrl) {
        contentSource = 'redirect'
        console.log(`Followed redirects from ${normalizedUrl} to ${resolvedUrl}`)
      }
      
      if (!response.ok) {
        throw new Error(`Failed to fetch website: ${response.status} ${response.statusText}`)
      }
      
      const html = await response.text()
      websiteContent = extractContentFromHTML(html)
      console.log(`Extracted ${websiteContent.bodyText.length} characters from ${resolvedUrl}`)
    } catch (fetchError: any) {
      console.error('Error fetching website:', fetchError)
      
      let errorMessage = 'Failed to fetch website content'
      let details = fetchError.message
      
      if (fetchError.message.includes('Redirect loop')) {
        errorMessage = 'Redirect loop detected'
        details = 'The website keeps redirecting to itself. Please try the final URL directly.'
      } else if (fetchError.message.includes('Maximum redirect limit')) {
        errorMessage = 'Too many redirects'
        details = 'The website has more than 10 redirects. Please try accessing the final URL directly.'
      } else if (fetchError.message.includes('no location header')) {
        errorMessage = 'Redirect missing location'
        details = 'The website returned a redirect without a Location header. Please try the final destination URL.'
      } else if (fetchError.message.includes('timeout')) {
        errorMessage = 'Request timeout'
        details = 'The website took too long to respond. Please try again.'
      }
      
      return NextResponse.json({ 
        error: errorMessage,
        details,
        website: normalizedUrl,
        finalUrl: finalUrl !== normalizedUrl ? finalUrl : undefined
      }, { status: 400 })
    }

    // If body text is too short, attempt readable proxy fallback
    if (!websiteContent || !websiteContent.bodyText || websiteContent.bodyText.length < 200) {
      console.warn(`Primary extraction returned ${websiteContent?.bodyText.length || 0} characters. Trying readability fallback...`)
      const readableContent = await fetchReadableContent(finalUrl)
      if (readableContent && readableContent.length > (websiteContent?.bodyText.length || 0)) {
        websiteContent = {
          title: websiteContent?.title || '',
          metaDescription: websiteContent?.metaDescription || '',
          headings: websiteContent?.headings || [],
          bodyText: readableContent,
          links: websiteContent?.links || 0,
          images: websiteContent?.images || 0,
        }
        contentSource = 'readable-fallback'
        console.log(`Readable fallback succeeded with ${readableContent.length} characters`)
      }
    }

    // Try HTTP version if HTTPS content still short
    if ((!websiteContent || websiteContent.bodyText.length < 120) && normalizedUrl.startsWith('https://')) {
      try {
        const httpUrl = normalizedUrl.replace('https://', 'http://')
        console.log(`Trying HTTP version for additional content: ${httpUrl}`)
        const { finalUrl: httpFinalUrl, response: httpResponse } = await followRedirects(httpUrl)
        if (httpResponse.ok) {
          const httpHtml = await httpResponse.text()
          const httpContent = extractContentFromHTML(httpHtml)
          if (httpContent.bodyText.length > (websiteContent?.bodyText.length || 0)) {
            websiteContent = httpContent
            finalUrl = httpFinalUrl
            contentSource = 'primary'
            console.log(`HTTP fallback extracted ${httpContent.bodyText.length} characters from ${httpFinalUrl}`)
          }
        }
      } catch (httpError) {
        console.warn('HTTP fallback attempt failed:', httpError)
      }
    }

    if (!websiteContent || !websiteContent.bodyText || websiteContent.bodyText.length < 100) {
      return NextResponse.json({ 
        error: 'Website content too short or empty',
        details: 'Could not extract meaningful content from the website after multiple attempts.'
      }, { status: 400 })
    }

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'OpenRouter API key not configured',
        details: 'Please set up your OpenRouter API key to use this feature'
      }, { status: 500 })
    }

    // Create comprehensive analysis prompt
    const prompt = `You are an expert website analyst and AI search optimization strategist. Analyze the following website and provide a comprehensive report that includes how ChatGPT (and other AI crawlers) interpret the page plus concrete steps to rank better inside AI answers.

Website URL: ${finalUrl}
Title: ${websiteContent.title || 'Not found'}
Meta Description: ${websiteContent.metaDescription || 'Not found'}
Headings: ${websiteContent.headings.slice(0, 20).join(', ') || 'None found'}
Content Length: ${websiteContent.bodyText.length} characters
Links: ${websiteContent.links}
Images: ${websiteContent.images}

Website Content (truncated):
${websiteContent.bodyText.substring(0, 12000)}

Analyze the website and return ONLY valid JSON with this exact structure:
{
  "overallScore": 85,
  "copyAnalysis": {
    "score": 80,
    "strengths": ["Clear value proposition", "Compelling headlines"],
    "weaknesses": ["Unclear call-to-action", "Too much jargon"],
    "recommendations": ["Add more specific benefits", "Simplify language"]
  },
  "seoAnalysis": {
    "score": 75,
    "strengths": ["Good title tag", "Meta description present"],
    "weaknesses": ["Missing alt text on images", "No structured data"],
    "recommendations": ["Add meta keywords", "Improve heading structure"]
  },
  "contentAnalysis": {
    "score": 90,
    "strengths": ["Comprehensive content", "Well-structured"],
    "weaknesses": ["Could use more examples", "Missing FAQ section"],
    "recommendations": ["Add case studies", "Include testimonials"]
  },
  "summary": "Overall, this is a well-designed website with strong content but needs SEO improvements.",
  "chatgptInsights": {
    "crawlerView": "In 2-3 sentences explain what ChatGPT or other AI crawlers understand about this page right now",
    "coreUnderstanding": ["Bullet list of the key value props ChatGPT extracts", "..."],
    "priorityFixes": ["List the most urgent fixes blocking AI rankings", "..."],
    "optimizationIdeas": ["Tactical improvements that help ChatGPT rank/mention the site more", "..."],
    "rankingChecklist": ["Checklist items owners can complete to improve AI visibility", "..."]
  }
}

Guidelines:
- Scores should be 0-100
- Be specific and actionable in recommendations
- Focus on what matters for conversion and SEO
- Overall score should be a weighted average (copy 30%, SEO 30%, content 40%)
- ChatGPT insights must be practical, punchy, and immediately actionable`

    try {
      const analysisData = await callOpenRouterJSON<{
        overallScore: number
        copyAnalysis: {
          score: number
          strengths: string[]
          weaknesses: string[]
          recommendations: string[]
        }
        seoAnalysis: {
          score: number
          strengths: string[]
          weaknesses: string[]
          recommendations: string[]
        }
        contentAnalysis: {
          score: number
          strengths: string[]
          weaknesses: string[]
          recommendations: string[]
        }
        summary: string
        chatgptInsights: {
          crawlerView: string
          coreUnderstanding: string[]
          priorityFixes: string[]
          optimizationIdeas: string[]
          rankingChecklist: string[]
        }
      }>(prompt, {
        model: 'google/gemini-2.0-flash-exp:free',
        temperature: 0.3,
        max_tokens: 2000
      })
      
      return NextResponse.json({
        success: true,
        website: finalUrl,
        analysis: analysisData,
        metadata: {
          title: websiteContent.title,
          metaDescription: websiteContent.metaDescription,
          contentLength: websiteContent.bodyText.length,
          headingsCount: websiteContent.headings.length,
          linksCount: websiteContent.links,
          imagesCount: websiteContent.images,
          contentSource
        }
      })

    } catch (openrouterError: any) {
      console.error('OpenRouter API error:', openrouterError)
      
      return NextResponse.json({
        error: 'AI analysis failed',
        details: openrouterError.message || 'Failed to analyze website with AI',
        website: finalUrl
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

