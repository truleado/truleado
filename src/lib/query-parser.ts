interface ParsedQuery {
  productType: string
  searchTerms: string[]
  subreddits: string[]
  intent: 'find_leads' | 'find_discussions' | 'find_problems'
  confidence: number
}

export class QueryParser {
  private geminiApiKey: string

  constructor() {
    this.geminiApiKey = process.env.GOOGLE_GEMINI_API_KEY || ''
  }

  async parseQuery(query: string): Promise<ParsedQuery> {
    if (!this.geminiApiKey) {
      return this.getFallbackParse(query)
    }

    try {
      return await this.parseWithGemini(query)
    } catch (error) {
      console.error('Gemini query parsing failed:', error)
      return this.getFallbackParse(query)
    }
  }

  private async parseWithGemini(query: string): Promise<ParsedQuery> {
    const prompt = `You are an expert at analyzing user queries for lead discovery on Reddit. Parse this user query and extract the key information needed to find relevant leads.

User Query: "${query}"

Analyze the query and provide a JSON response with this exact structure:
{
  "productType": "The main product/service category being discussed (e.g., 'project management tools', 'CRM systems', 'email marketing software')",
  "searchTerms": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "subreddits": ["subreddit1", "subreddit2", "subreddit3", "subreddit4", "subreddit5"],
  "intent": "find_leads",
  "confidence": 0.85
}

GUIDELINES:
1. ProductType: Extract the main product/service category the user is interested in
2. SearchTerms: Generate 5 relevant keywords that would appear in Reddit discussions about this topic
3. Subreddits: Suggest 5 relevant subreddits where people discuss this type of product/service
4. Intent: Always use "find_leads" for lead discovery
5. Confidence: Rate 0.0-1.0 based on how clear the query is

EXAMPLES:
- "Find people looking for project management tools" → productType: "project management tools", searchTerms: ["project management", "task management", "team collaboration", "workflow", "productivity"]
- "Show me discussions about CRM systems" → productType: "CRM systems", searchTerms: ["CRM", "customer management", "sales software", "lead tracking", "contact management"]
- "I need leads for my email marketing software" → productType: "email marketing software", searchTerms: ["email marketing", "email campaigns", "newsletter", "email automation", "email tools"]

Focus on extracting the most relevant information for finding Reddit discussions where people are actively seeking or discussing these types of solutions.`

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.geminiApiKey}`, {
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
          topP: 0.9,
          maxOutputTokens: 1024,
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!responseText) {
      throw new Error('No response from Gemini API')
    }

    // Extract JSON from markdown code blocks if present
    let jsonText = responseText
    if (jsonText.includes('```json')) {
      const jsonMatch = jsonText.match(/```json\s*([\s\S]*?)\s*```/)
      if (jsonMatch) {
        jsonText = jsonMatch[1]
      }
    } else if (jsonText.includes('```')) {
      const jsonMatch = jsonText.match(/```\s*([\s\S]*?)\s*```/)
      if (jsonMatch) {
        jsonText = jsonMatch[1]
      }
    }

    const parsed = JSON.parse(jsonText)
    
    return {
      productType: parsed.productType || 'general software',
      searchTerms: Array.isArray(parsed.searchTerms) ? parsed.searchTerms : [],
      subreddits: Array.isArray(parsed.subreddits) ? parsed.subreddits : [],
      intent: parsed.intent || 'find_leads',
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.7
    }
  }

  private getFallbackParse(query: string): ParsedQuery {
    // Simple fallback parsing when AI is not available
    const lowerQuery = query.toLowerCase()
    
    // Extract common product types
    let productType = 'general software'
    if (lowerQuery.includes('project management') || lowerQuery.includes('task management')) {
      productType = 'project management tools'
    } else if (lowerQuery.includes('crm') || lowerQuery.includes('customer management')) {
      productType = 'CRM systems'
    } else if (lowerQuery.includes('email marketing') || lowerQuery.includes('email campaign')) {
      productType = 'email marketing software'
    } else if (lowerQuery.includes('accounting') || lowerQuery.includes('bookkeeping')) {
      productType = 'accounting software'
    } else if (lowerQuery.includes('marketing') || lowerQuery.includes('advertising')) {
      productType = 'marketing tools'
    }

    // Generate basic search terms from the query
    const words = query.toLowerCase().split(/\s+/).filter(word => 
      word.length > 3 && 
      !['find', 'people', 'looking', 'for', 'show', 'me', 'discussions', 'about', 'need', 'leads', 'my'].includes(word)
    )
    
    const searchTerms = words.slice(0, 5)
    
    // Default subreddits based on product type
    let subreddits = ['entrepreneur', 'startups', 'saas', 'marketing', 'smallbusiness']
    if (productType.includes('project management')) {
      subreddits = ['productivity', 'entrepreneur', 'startups', 'freelance', 'smallbusiness']
    } else if (productType.includes('CRM')) {
      subreddits = ['sales', 'entrepreneur', 'startups', 'saas', 'marketing']
    } else if (productType.includes('email marketing')) {
      subreddits = ['marketing', 'entrepreneur', 'emailmarketing', 'saas', 'smallbusiness']
    }

    return {
      productType,
      searchTerms,
      subreddits,
      intent: 'find_leads',
      confidence: 0.6
    }
  }
}

export const queryParser = new QueryParser()
