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

/**
 * Follow all redirects until we reach the final destination
 * Handles multiple redirects (301, 302, 307, 308, etc.)
 */
async function followRedirects(
  url: string,
  maxRedirects: number = 10,
  visitedUrls: Set<string> = new Set()
): Promise<{ finalUrl: string; response: Response }> {
  // Prevent infinite loops
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
    redirect: 'manual', // Handle redirects manually
    signal: AbortSignal.timeout(30000),
  })

  // Check if it's a redirect status (3xx)
  if (response.status >= 300 && response.status < 400) {
    // Try to get location from various headers (case-insensitive)
    let location = response.headers.get('location') || 
                   response.headers.get('Location') ||
                   response.headers.get('LOCATION')
    
    // If no location header, try Refresh header (some servers use this)
    if (!location) {
      const refresh = response.headers.get('refresh') || 
                      response.headers.get('Refresh') ||
                      response.headers.get('REFRESH')
      if (refresh) {
        // Extract URL from Refresh header (format: "0; url=https://example.com" or "5; URL=https://example.com")
        const urlMatch = refresh.match(/url\s*=\s*([^\s;]+)/i)
        if (urlMatch) {
          location = urlMatch[1].trim()
          console.log(`Found redirect URL in Refresh header: ${location}`)
        }
      }
    }
    
    // If still no location, try multiple fallback strategies
    if (!location) {
      console.warn(`Redirect (${response.status}) detected but no location header found for ${url}. Trying fallback strategies...`)
      
      // Read response body once for multiple uses
      let responseText: string | null = null
      try {
        const clonedResponse = response.clone()
        responseText = await clonedResponse.text()
      } catch (bodyError) {
        console.warn('Could not read response body:', bodyError)
      }
      
      // Strategy 1: Try to extract redirect from response body (HTML meta refresh)
      if (responseText) {
        // Check for meta refresh tag
        const metaRefreshMatch = responseText.match(/<meta[^>]*http-equiv\s*=\s*["']?refresh["']?[^>]*content\s*=\s*["']?[^"']*url\s*=\s*([^\s"'>]+)/i)
        if (metaRefreshMatch) {
          location = metaRefreshMatch[1].trim()
          console.log(`Found redirect URL in meta refresh tag: ${location}`)
        } else {
          // Check for JavaScript redirect
          const jsRedirectMatch = responseText.match(/window\.location\s*=\s*["']([^"']+)["']/i) ||
                                 responseText.match(/location\.href\s*=\s*["']([^"']+)["']/i)
          if (jsRedirectMatch) {
            location = jsRedirectMatch[1].trim()
            console.log(`Found redirect URL in JavaScript: ${location}`)
          }
        }
      }
      
      // Strategy 2: Try URL variations (remove/add trailing slash)
      if (!location) {
        try {
          const urlObj = new URL(url)
          const variations = [
            url.endsWith('/') ? url.slice(0, -1) : url + '/',
            urlObj.pathname === '/' ? url : urlObj.origin,
          ]
          
          for (const variation of variations) {
            if (variation !== url && !visitedUrls.has(variation)) {
              console.log(`Trying URL variation: ${variation}`)
              try {
                const { finalUrl: varFinalUrl, response: varResponse } = await followRedirects(variation, maxRedirects - 1, visitedUrls)
                if (varResponse.ok) {
                  console.log(`URL variation succeeded: ${variation} -> ${varFinalUrl}`)
                  return { finalUrl: varFinalUrl, response: varResponse }
                }
              } catch (varError) {
                console.warn(`URL variation ${variation} failed:`, varError)
              }
            }
          }
        } catch (urlVarError) {
          console.warn('URL variation strategy failed:', urlVarError)
        }
      }
      
      // Strategy 3: Try with automatic redirect following
      if (!location) {
        try {
          const autoResponse = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.5',
            },
            redirect: 'follow', // Let fetch handle redirects automatically
            signal: AbortSignal.timeout(30000),
          })
          
          if (autoResponse.ok) {
            console.log(`Automatic redirect following succeeded for ${url} -> ${autoResponse.url}`)
            return { finalUrl: autoResponse.url, response: autoResponse }
          } else {
            console.warn(`Automatic redirect returned status ${autoResponse.status}`)
          }
        } catch (autoError: any) {
          console.warn('Automatic redirect following failed:', autoError.message || autoError)
        }
      }
      
      // Strategy 4: For 307/308, try to use the response body as content if it exists
      if (!location && (response.status === 307 || response.status === 308) && responseText) {
        if (responseText.length > 100) {
          console.log(`Using redirect response body as content (${responseText.length} chars)`)
          // Create a new Response object with the text content
          const textResponse = new Response(responseText, {
            status: 200,
            statusText: 'OK',
            headers: response.headers,
          })
          return { finalUrl: url, response: textResponse }
        }
      }
      
      // If all strategies fail, throw error
      if (!location) {
        throw new Error(`Redirect (${response.status}) detected but no location header found for ${url}. All fallback strategies failed.`)
      }
    }

    // Resolve relative URLs
    let redirectUrl = location
    try {
      const currentUrl = new URL(url)
      if (location.startsWith('/')) {
        // Absolute path on same domain
        redirectUrl = `${currentUrl.protocol}//${currentUrl.host}${location}`
      } else if (location.startsWith('http://') || location.startsWith('https://')) {
        // Absolute URL
        redirectUrl = location
      } else {
        // Relative path
        redirectUrl = new URL(location, url).href
      }
    } catch (urlError) {
      throw new Error(`Invalid redirect URL: ${location} from ${url}`)
    }

    console.log(`Following redirect ${response.status} from ${url} to ${redirectUrl} (${maxRedirects - 1} redirects remaining)`)
    
    // Recursively follow the redirect
    return followRedirects(redirectUrl, maxRedirects - 1, visitedUrls)
  }

  // Not a redirect, return the response
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
    console.log(`Readable proxy extracted ${cleaned.length} characters`)
    return cleaned.substring(0, 20000)
  } catch (error) {
    console.error('Readable proxy fetch failed:', error)
    return null
  }
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

    // Fetch website content with proper headers, following all redirects
    let websiteContent = ''
    let contentSource: 'primary' | 'redirect' | 'readable-fallback' = 'primary'
    let finalUrl = normalizedUrl
    
    try {
      // Follow all redirects until we reach the final destination
      const { finalUrl: resolvedUrl, response } = await followRedirects(normalizedUrl)
      finalUrl = resolvedUrl
      
      if (resolvedUrl !== normalizedUrl) {
        contentSource = 'redirect'
        console.log(`Followed redirects from ${normalizedUrl} to final URL: ${resolvedUrl}`)
      }
      
      if (!response.ok) {
        throw new Error(`Failed to fetch website: ${response.status} ${response.statusText}`)
      }
      
      const html = await response.text()
      websiteContent = extractContentFromHTML(html)
      console.log(`Extracted ${websiteContent.length} characters of content from ${resolvedUrl}`)
    } catch (fetchError: any) {
      console.error('Error fetching website:', fetchError)
      
      let errorMessage = 'Failed to fetch website content'
      let details = fetchError.message
      
      if (fetchError.message.includes('Redirect loop')) {
        errorMessage = 'Redirect loop detected'
        details = 'The website has a redirect loop. Please try a different URL or check if the website is accessible.'
      } else if (fetchError.message.includes('Maximum redirect limit')) {
        errorMessage = 'Too many redirects'
        details = 'The website has more than 10 redirects. Please try accessing the final URL directly.'
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
        website: normalizedUrl,
        finalUrl: finalUrl !== normalizedUrl ? finalUrl : undefined
      }, { status: 400 })
    }

    // Fallback 1: Use readable proxy if content is too short
    if (!websiteContent || websiteContent.length < 300) {
      console.warn(`Primary extraction returned ${websiteContent?.length || 0} characters. Trying readability fallback...`)
      const readableContent = await fetchReadableContent(finalUrl)
      if (readableContent && readableContent.length > (websiteContent?.length || 0)) {
        websiteContent = readableContent
        contentSource = 'readable-fallback'
        console.log(`Readable fallback succeeded with ${websiteContent.length} characters`)
      } else {
        console.warn('Readable fallback did not improve content length')
      }
    }

    // Fallback 2: Try with non-https (some sites block https scraping)
    if ((!websiteContent || websiteContent.length < 120) && normalizedUrl.startsWith('https://')) {
      try {
        const httpUrl = normalizedUrl.replace('https://', 'http://')
        console.log(`Trying HTTP version for additional content: ${httpUrl}`)
        
        // Follow redirects for HTTP version too
        const { finalUrl: httpFinalUrl, response: httpResponse } = await followRedirects(httpUrl)
        
        if (httpResponse.ok) {
          const httpHtml = await httpResponse.text()
          const httpContent = extractContentFromHTML(httpHtml)
          if (httpContent.length > (websiteContent?.length || 0)) {
            websiteContent = httpContent
            finalUrl = httpFinalUrl
            contentSource = 'primary'
            console.log(`HTTP fallback extracted ${websiteContent.length} characters from ${httpFinalUrl}`)
          }
        }
      } catch (httpError) {
        console.warn('HTTP fallback attempt failed:', httpError)
      }
    }

    if (!websiteContent || websiteContent.length < 60) {
      return NextResponse.json({ 
        error: 'Website content too short or empty',
        details: 'Could not extract meaningful content from the website after multiple attempts. Please verify the URL or try a different page.'
      }, { status: 400 })
    }

    if (websiteContent.length < 150) {
      console.warn(`Proceeding with limited content (${websiteContent.length} characters) extracted from ${contentSource}`)
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

