import OpenAI from 'openai'

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null

export interface LeadAnalysis {
  reasons: string[]
  sampleReply: string
  qualityScore: number
  confidence: number
}

export interface LeadData {
  title: string
  content: string
  author: string
  subreddit: string
  score: number
  numComments: number
  leadType: 'post' | 'comment'
  parentPostTitle?: string
}

export interface ProductData {
  name: string
  description: string
  features: string[]
  benefits: string[]
  painPoints: string[]
  idealCustomerProfile: string
}

export class AILeadAnalyzer {
  
  async analyzeLead(lead: LeadData, product: ProductData): Promise<LeadAnalysis> {
    try {
      // Try Gemini first (cheaper), then fallback to OpenAI
      const geminiApiKey = process.env.GOOGLE_GEMINI_API_KEY
      const openaiApiKey = process.env.OPENAI_API_KEY
      
      if (geminiApiKey) {
        try {
          console.log('Analyzing lead with Gemini...')
          return await this.analyzeWithGemini(lead, product)
        } catch (error) {
          console.error('Gemini lead analysis failed, trying OpenAI:', error)
          // Continue to OpenAI fallback
        }
      }
      
      if (openaiApiKey && openai) {
        try {
          console.log('Analyzing lead with OpenAI...')
          return await this.analyzeWithOpenAI(lead, product)
        } catch (error) {
          console.error('OpenAI lead analysis failed:', error)
          // Continue to fallback analysis
        }
      }
      
      console.log('Using fallback analysis (no AI available)')
      return this.getFallbackAnalysis(lead, product)
      
    } catch (error) {
      console.error('AI lead analysis error:', error)
      return this.getFallbackAnalysis(lead, product)
    }
  }

  private async analyzeWithGemini(lead: LeadData, product: ProductData): Promise<LeadAnalysis> {
    const geminiApiKey = process.env.GOOGLE_GEMINI_API_KEY
    
    if (!geminiApiKey) {
      throw new Error('Google Gemini API key not configured')
    }

    const prompt = this.buildAnalysisPrompt(lead, product)
    
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
            maxOutputTokens: 1024,
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
      const analysisText = data.candidates?.[0]?.content?.parts?.[0]?.text
      const finishReason = data.candidates?.[0]?.finishReason

      if (!analysisText) {
        console.error('Gemini response structure:', data)
        throw new Error('No analysis returned from Gemini')
      }
      
      if (finishReason === 'MAX_TOKENS') {
        console.warn('Gemini response was truncated due to token limit, using partial response')
        // Try to extract what we can from the truncated response
        if (analysisText && analysisText.length > 50) {
          // Use the partial response as fallback
          return this.parsePartialGeminiResponse(analysisText)
        }
        throw new Error('Gemini response truncated - trying OpenAI fallback')
      }

      // Parse JSON response
      let cleanText = analysisText.trim()
      
      // Remove markdown code blocks if present
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '')
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '')
      }
      
      let analysis
      try {
        analysis = JSON.parse(cleanText)
      } catch (parseError) {
        console.error('JSON parse error:', parseError)
        console.error('Raw text:', cleanText)
        throw new Error('Invalid JSON response from Gemini')
      }
      
      // Validate the response structure
      if (!analysis.reasons || !analysis.sampleReply || !analysis.qualityScore || !analysis.confidence) {
        throw new Error('Invalid analysis structure from Gemini')
      }
      
      return {
        reasons: Array.isArray(analysis.reasons) ? analysis.reasons : [analysis.reasons],
        sampleReply: analysis.sampleReply,
        qualityScore: Math.min(Math.max(analysis.qualityScore || 5, 1), 10),
        confidence: Math.min(Math.max(analysis.confidence || 5, 1), 10)
      }
      
    } catch (error) {
      console.error('Gemini lead analysis error:', error)
      throw error
    }
  }

  private async analyzeWithOpenAI(lead: LeadData, product: ProductData): Promise<LeadAnalysis> {
    if (!openai) {
      throw new Error('OpenAI not configured')
    }

    const prompt = this.buildAnalysisPrompt(lead, product)
    
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert sales and marketing analyst specializing in Reddit lead qualification. Analyze Reddit posts and comments to identify high-quality sales opportunities."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    })

    const analysis = this.parseAIResponse(response.choices[0].message.content || '')
    return analysis
  }

  private buildAnalysisPrompt(lead: LeadData, product: ProductData): string {
    const leadContext = lead.leadType === 'comment' 
      ? `Comment: "${lead.content}"`
      : `Post: "${lead.title}" - ${lead.content}`

    // Truncate long content to fit token limits
    const maxContentLength = 800
    const truncatedContext = leadContext.length > maxContentLength 
      ? leadContext.substring(0, maxContentLength) + "..."
      : leadContext

    return `Analyze this Reddit ${lead.leadType} for sales opportunity with ${product.name}:

PRODUCT: ${product.name} - ${product.description}
FEATURES: ${product.features.slice(0, 3).join(', ')}
PAIN POINTS: ${product.painPoints.slice(0, 3).join(', ')}

${lead.leadType.toUpperCase()}: ${truncatedContext}

Find pain points, buying intent, urgency. Return JSON:
{
  "reasons": ["reason1", "reason2"],
  "sampleReply": "Helpful reply referencing their situation",
  "qualityScore": 8,
  "confidence": 7
}`
  }

  private parseAIResponse(response: string): LeadAnalysis {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          reasons: parsed.reasons || [],
          sampleReply: parsed.sampleReply || '',
          qualityScore: Math.min(Math.max(parsed.qualityScore || 5, 1), 10),
          confidence: Math.min(Math.max(parsed.confidence || 5, 1), 10)
        }
      }
    } catch (error) {
      console.error('Error parsing AI response:', error)
    }

    // Fallback parsing
    return this.parseFallbackResponse(response)
  }

  private parseFallbackResponse(response: string): LeadAnalysis {
    const reasons: string[] = []
    const lines = response.split('\n')
    
    for (const line of lines) {
      if (line.includes('reason') || line.includes('•') || line.includes('-')) {
        const cleanLine = line.replace(/^[•\-\d\.\s]+/, '').trim()
        if (cleanLine.length > 10) {
          reasons.push(cleanLine)
        }
      }
    }

    return {
      reasons: reasons.slice(0, 5),
      sampleReply: 'Thanks for sharing! I\'d be happy to help you with this. Feel free to reach out if you have any questions.',
      qualityScore: 6,
      confidence: 5
    }
  }

  private getFallbackAnalysis(lead: LeadData, product: ProductData): LeadAnalysis {
    const reasons: string[] = []
    const leadContent = lead.content.toLowerCase()
    const leadTitle = lead.title.toLowerCase()
    const fullText = `${leadTitle} ${leadContent}`
    
    // Enhanced analysis without AI
    let qualityScore = 0
    let confidence = 5
    
    // Direct product mention (highest priority)
    if (fullText.includes(product.name.toLowerCase())) {
      reasons.push('Directly mentions your product')
      qualityScore += 3
      confidence += 2
    }
    
    // Pain point analysis
    const painPointMatches = product.painPoints.filter(painPoint => 
      fullText.includes(painPoint.toLowerCase()) ||
      this.hasSimilarWords(fullText, painPoint.toLowerCase())
    )
    
    if (painPointMatches.length > 0) {
      reasons.push(`Mentions pain points: ${painPointMatches.slice(0, 2).join(', ')}`)
      qualityScore += painPointMatches.length * 2
      confidence += painPointMatches.length
    }
    
    // Feature/benefit relevance
    const featureMatches = product.features.filter(feature => 
      fullText.includes(feature.toLowerCase()) ||
      this.hasSimilarWords(fullText, feature.toLowerCase())
    )
    
    const benefitMatches = product.benefits.filter(benefit => 
      fullText.includes(benefit.toLowerCase()) ||
      this.hasSimilarWords(fullText, benefit.toLowerCase())
    )
    
    if (featureMatches.length > 0) {
      reasons.push(`Relevant features mentioned: ${featureMatches.slice(0, 2).join(', ')}`)
      qualityScore += featureMatches.length
    }
    
    if (benefitMatches.length > 0) {
      reasons.push(`Relevant benefits mentioned: ${benefitMatches.slice(0, 2).join(', ')}`)
      qualityScore += benefitMatches.length
    }
    
    // Buying intent signals
    const buyingIntentTerms = [
      'looking for', 'need', 'want', 'recommend', 'suggest', 'help with', 
      'struggling', 'problem', 'issue', 'best way to', 'how to', 
      'anyone know', 'suggestions', 'alternatives', 'budget', 'cost', 
      'price', 'trial', 'demo', 'evaluate', 'compare'
    ]
    
    const intentMatches = buyingIntentTerms.filter(term => fullText.includes(term))
    if (intentMatches.length > 0) {
      reasons.push(`Shows buying intent: ${intentMatches.slice(0, 3).join(', ')}`)
      qualityScore += intentMatches.length
      confidence += 1
    }
    
    // Question indicators (people asking for help)
    if (fullText.includes('?') && (fullText.includes('how') || fullText.includes('what') || fullText.includes('where') || fullText.includes('which'))) {
      reasons.push('Asking specific questions (high engagement potential)')
      qualityScore += 2
    }
    
    // Engagement quality
    if (lead.score > 20) {
      reasons.push('High engagement (20+ upvotes)')
      qualityScore += 2
    } else if (lead.score > 10) {
      reasons.push('Good engagement (10+ upvotes)')
      qualityScore += 1
    }
    
    if (lead.numComments > 10) {
      reasons.push('Active discussion (10+ comments)')
      qualityScore += 2
    } else if (lead.numComments > 3) {
      reasons.push('Some discussion (3+ comments)')
      qualityScore += 1
    }
    
    // Recent activity bonus
    const postAge = Date.now() / 1000 - (lead as any).created_utc
    if (postAge < 24 * 3600) { // Within 24 hours
      reasons.push('Very recent post (high urgency)')
      qualityScore += 2
    } else if (postAge < 7 * 24 * 3600) { // Within 7 days
      reasons.push('Recent post')
      qualityScore += 1
    }
    
    // Generate contextual reply
    let sampleReply = this.generateContextualReply(lead, product, painPointMatches, featureMatches, benefitMatches)

    return {
      reasons: reasons.length > 0 ? reasons : ['Potential lead based on subreddit relevance'],
      sampleReply,
      qualityScore: Math.min(Math.max(qualityScore, 1), 10),
      confidence: Math.min(Math.max(confidence, 1), 10)
    }
  }
  
  private hasSimilarWords(text: string, target: string): boolean {
    const targetWords = target.split(' ').filter(word => word.length > 3)
    const textWords = text.split(' ')
    
    return targetWords.some(targetWord => 
      textWords.some(textWord => 
        textWord.includes(targetWord) || targetWord.includes(textWord)
      )
    )
  }

  // Parse partial Gemini response when truncated
  private parsePartialGeminiResponse(partialText: string): LeadAnalysis {
    console.log('Parsing partial Gemini response:', partialText.substring(0, 200) + '...')
    
    // Try to extract basic information from the partial response
    const reasons = []
    const sampleReply = "I understand your situation. Let me help you with some insights that might be useful."
    
    // Look for any mention of pain points or features
    if (partialText.toLowerCase().includes('pain') || partialText.toLowerCase().includes('struggle')) {
      reasons.push('Mentions pain points or struggles')
    }
    if (partialText.toLowerCase().includes('need') || partialText.toLowerCase().includes('looking')) {
      reasons.push('Shows buying intent or need')
    }
    if (partialText.toLowerCase().includes('help') || partialText.toLowerCase().includes('advice')) {
      reasons.push('Asks for help or advice')
    }
    
    return {
      reasons: reasons.length > 0 ? reasons : ['Relevant content found'],
      sampleReply: sampleReply,
      qualityScore: 7, // Medium quality for partial response
      confidence: 6, // Lower confidence due to truncation
      painPoints: [],
      features: [],
      benefits: []
    }
  }
  
  private generateContextualReply(lead: LeadData, product: ProductData, painPointMatches: string[], featureMatches: string[], benefitMatches: string[]): string {
    const leadContent = lead.content.toLowerCase()
    const isComment = lead.leadType === 'comment'
    const context = isComment ? 'comment' : 'post'
    
    let reply = `Hey u/${lead.author}! `
    
    // Reference their specific situation
    if (painPointMatches.length > 0) {
      const painPoint = painPointMatches[0]
      reply += `I noticed you mentioned ${painPoint} in your ${context}. `
      
      if (featureMatches.length > 0) {
        reply += `${product.name} actually has ${featureMatches[0]} that could help with that specific issue. `
      } else {
        reply += `${product.name} is designed to help with exactly that kind of problem. `
      }
    } else if (featureMatches.length > 0) {
      reply += `I saw your ${context} about ${featureMatches[0]}. `
      reply += `${product.name} has some really solid ${featureMatches[0]} capabilities that might be worth checking out. `
    } else if (benefitMatches.length > 0) {
      reply += `Based on your ${context}, it sounds like you're looking for ${benefitMatches[0]}. `
      reply += `${product.name} might be a good fit since it's built for exactly that. `
    } else {
      reply += `I came across your ${context} and thought ${product.name} might be relevant to what you're working on. `
    }
    
    // Add value proposition
    if (product.benefits.length > 0) {
      reply += `It's helped a lot of people with ${product.benefits[0].toLowerCase()}, `
      if (product.benefits.length > 1) {
        reply += `plus ${product.benefits[1].toLowerCase()}. `
      } else {
        reply += `which seems like it could be useful for your situation. `
      }
    }
    
    // Add engagement
    reply += `Would love to hear your thoughts on it! `
    
    // Add specific question based on context
    if (leadContent.includes('budget') || leadContent.includes('cost') || leadContent.includes('price')) {
      reply += `Feel free to DM me if you want to chat about pricing or have any questions!`
    } else if (leadContent.includes('how') || leadContent.includes('best way')) {
      reply += `Happy to share more details about how it works if you're interested!`
    } else {
      reply += `Let me know if you'd like to learn more!`
    }
    
    return reply
  }
}

export const aiLeadAnalyzer = new AILeadAnalyzer()
