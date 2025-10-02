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
            maxOutputTokens: 2048,
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
        console.warn('Gemini response was truncated due to token limit')
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
    const maxContentLength = 500
    const truncatedContext = leadContext.length > maxContentLength 
      ? leadContext.substring(0, maxContentLength) + "..."
      : leadContext

    return `Analyze this Reddit ${lead.leadType} for ${product.name} (${product.description.substring(0, 100)}...).

REDDIT: u/${lead.author} in r/${lead.subreddit} (${lead.score} upvotes)
${truncatedContext}

PRODUCT SOLVES: ${product.painPoints.slice(0, 2).join('; ')}
BENEFITS: ${product.benefits.slice(0, 2).join('; ')}

Return JSON only:
{
  "reasons": ["reason1", "reason2", "reason3"],
  "sampleReply": "Helpful reply mentioning ${product.name}",
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
    
    // Basic analysis without AI
    if (lead.content.toLowerCase().includes(product.name.toLowerCase())) {
      reasons.push('Directly mentions your product')
    }
    
    if (lead.content.toLowerCase().includes('looking for') || lead.content.toLowerCase().includes('need')) {
      reasons.push('Shows clear buying intent')
    }
    
    if (lead.score > 5) {
      reasons.push('High engagement indicates active discussion')
    }
    
    if (lead.numComments > 3) {
      reasons.push('Active conversation with multiple participants')
    }

    // Generate a more relevant fallback reply
    const leadContent = lead.content.toLowerCase()
    const relevantFeatures = product.features.filter(feature => 
      leadContent.includes(feature.toLowerCase()) || 
      leadContent.includes(feature.split(' ')[0].toLowerCase())
    )
    
    const relevantBenefits = product.benefits.filter(benefit => 
      leadContent.includes(benefit.toLowerCase()) || 
      leadContent.includes(benefit.split(' ')[0].toLowerCase())
    )

    let sampleReply = `Hi u/${lead.author}! I saw your ${lead.leadType} about this topic. `
    
    if (relevantFeatures.length > 0) {
      sampleReply += `${product.name} has ${relevantFeatures[0]} that might help with what you're looking for. `
    } else if (relevantBenefits.length > 0) {
      sampleReply += `${product.name} can help with ${relevantBenefits[0].toLowerCase()}, which seems relevant to your situation. `
    } else {
      sampleReply += `${product.name} might be helpful for what you're looking for. `
    }
    
    sampleReply += `Feel free to check it out and let me know if you have any questions!`

    return {
      reasons: reasons.length > 0 ? reasons : ['Potential lead based on subreddit relevance'],
      sampleReply,
      qualityScore: reasons.length > 2 ? 7 : 5,
      confidence: 6
    }
  }
}

export const aiLeadAnalyzer = new AILeadAnalyzer()
