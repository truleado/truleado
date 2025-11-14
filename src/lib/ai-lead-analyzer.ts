import { ErrorHandler } from './error-handler'
import { callOpenRouterJSON } from './openrouter-client'

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
      const openrouterApiKey = process.env.OPENROUTER_API_KEY
      
      if (openrouterApiKey) {
        try {
          console.log('Analyzing lead with OpenRouter...')
          return await this.analyzeWithOpenRouter(lead, product)
        } catch (error) {
          ErrorHandler.handleAiError(error, 'OpenRouter')
          console.error('OpenRouter lead analysis failed:', error)
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

  private async analyzeWithOpenRouter(lead: LeadData, product: ProductData): Promise<LeadAnalysis> {
    const prompt = this.buildAnalysisPrompt(lead, product)
    
    try {
      const analysis = await callOpenRouterJSON<{
        reasons: string[] | string
        sampleReply: string
        qualityScore: number
        confidence: number
      }>(prompt, {
        model: 'google/gemini-2.5-pro-exp',
        temperature: 0.7,
        max_tokens: 1000
      })
      
      // Validate the response structure
      if (!analysis.reasons || !analysis.sampleReply || !analysis.qualityScore || !analysis.confidence) {
        throw new Error('Invalid analysis structure from OpenRouter')
      }
      
      return {
        reasons: Array.isArray(analysis.reasons) ? analysis.reasons : [analysis.reasons],
        sampleReply: analysis.sampleReply,
        qualityScore: Math.min(Math.max(analysis.qualityScore || 5, 1), 10),
        confidence: Math.min(Math.max(analysis.confidence || 5, 1), 10)
      }
      
    } catch (error) {
      ErrorHandler.handleAiError(error, 'OpenRouter')
      throw error
    }
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
    
    // Enhanced analysis without AI - start with base score
    let qualityScore = 3  // Base score for any post
    let confidence = 5
    
    // Give every post a base reason
    reasons.push('Found in relevant subreddit')
    
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
      confidence: Math.min(Math.max(confidence, 1), 10),
      painPoints: painPointMatches,
      buyingSignals: intentMatches,
      suggestedApproach: `Engage with this post by offering helpful advice related to ${featureMatches.slice(0, 2).join(' and ')}.`
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

  // Parse partial response when truncated (kept for compatibility)
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
