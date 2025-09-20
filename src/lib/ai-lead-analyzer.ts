import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

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
    } catch (error) {
      console.error('AI lead analysis error:', error)
      return this.getFallbackAnalysis(lead, product)
    }
  }

  private buildAnalysisPrompt(lead: LeadData, product: ProductData): string {
    const leadContext = lead.leadType === 'comment' 
      ? `Comment on post: "${lead.parentPostTitle}"\nComment: "${lead.content}"`
      : `Post: "${lead.title}"\nContent: "${lead.content}"`

    return `
Analyze this Reddit ${lead.leadType} as a potential sales lead for ${product.name}.

PRODUCT INFORMATION:
- Name: ${product.name}
- Description: ${product.description}
- Features: ${product.features.join(', ')}
- Benefits: ${product.benefits.join(', ')}
- Pain Points We Solve: ${product.painPoints.join(', ')}
- Ideal Customer: ${product.idealCustomerProfile}

REDDIT ${lead.leadType.toUpperCase()}:
- Author: u/${lead.author}
- Subreddit: r/${lead.subreddit}
- Score: ${lead.score} upvotes
- Comments: ${lead.numComments}
- ${leadContext}

Please provide:
1. 3-5 specific reasons why this is a good lead (be specific about pain points, needs, or interests mentioned)
2. A sample reply that's helpful, non-salesy, and adds value to the conversation. The reply should:
   - Reference specific pain points or challenges mentioned in the ${lead.leadType}
   - Mention relevant features or benefits from the product that address those challenges
   - Offer genuine value or insights, not just promotion
   - Be conversational and helpful, like a knowledgeable peer
   - Include a subtle mention of how the product could help (without being pushy)
   - Use specific product features/benefits that match the user's needs
3. A quality score from 1-10 (10 being perfect fit)
4. Confidence level from 1-10

Format your response as JSON:
{
  "reasons": ["reason1", "reason2", "reason3"],
  "sampleReply": "Your helpful reply here...",
  "qualityScore": 8,
  "confidence": 7
}

Focus on:
- Specific pain points or needs mentioned
- Buying intent signals
- Authority and engagement level
- Relevance to your product
- Conversation context
- How product features directly address the user's challenges
`
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
