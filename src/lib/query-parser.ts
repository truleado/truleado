interface ParsedQuery {
  productType: string
  searchTerms: string[]
  subreddits: string[]
  intent: 'find_leads' | 'find_discussions' | 'find_problems'
  confidence: number
  problemKeywords: string[]
  solutionKeywords: string[]
  conversationTriggers: string[]
  targetAudience: string
  industryContext: string
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
    const prompt = `You are an expert at analyzing user queries for lead discovery on Reddit. Your job is to deeply understand what the user wants and create highly targeted search parameters that will find people actively discussing problems and seeking solutions.

User Query: "${query}"

Analyze this query and provide a JSON response with this exact structure:
{
  "productType": "The main product/service category being discussed",
  "searchTerms": ["specific_term1", "specific_term2", "specific_term3", "specific_term4", "specific_term5"],
  "subreddits": ["most_relevant_sub1", "most_relevant_sub2", "most_relevant_sub3", "most_relevant_sub4", "most_relevant_sub5"],
  "intent": "find_leads",
  "confidence": 0.85,
  "problemKeywords": ["problem1", "problem2", "problem3"],
  "solutionKeywords": ["solution1", "solution2", "solution3"],
  "conversationTriggers": ["trigger1", "trigger2", "trigger3"],
  "targetAudience": "specific description of who they want to reach",
  "industryContext": "industry or domain context"
}

CRITICAL GUIDELINES:
1. PRODUCTTYPE: Extract the main product/service category the user is interested in
2. SEARCHTERMS: Generate 5 highly specific terms that people would actually use when discussing their problems or seeking solutions
3. SUBREDDITS: Choose 5 subreddits where this specific audience actively discusses these problems and seeks solutions
4. PROBLEMKEYWORDS: Focus on pain points, frustrations, and challenges people express (e.g., "struggling with", "overwhelmed", "frustrated")
5. SOLUTIONKEYWORDS: Include terms related to solutions, tools, services they might need
6. CONVERSATIONTRIGGERS: Words/phrases that indicate someone is actively seeking help or solutions (e.g., "need help", "recommendations", "best tool")
7. TARGETAUDIENCE: Identify the specific audience who would have these problems
8. INDUSTRYCONTEXT: Identify the specific industry or domain
9. CONFIDENCE: Rate 0.0-1.0 based on how clear the query is

EXAMPLES OF INTELLIGENT PARSING:

Query: "Find people looking for project management tools"
{
  "productType": "project management tools",
  "searchTerms": ["project management", "task tracking", "team collaboration", "deadline management", "workflow tools"],
  "subreddits": ["productivity", "projectmanagement", "entrepreneur", "freelance", "smallbusiness"],
  "intent": "find_leads",
  "confidence": 0.9,
  "problemKeywords": ["overwhelmed", "disorganized", "missed deadlines", "team chaos", "project tracking"],
  "solutionKeywords": ["project management", "task management", "collaboration tools", "workflow", "organization"],
  "conversationTriggers": ["need help", "recommendations", "best tool", "struggling with", "looking for"],
  "targetAudience": "Business owners, managers, freelancers struggling with project organization",
  "industryContext": "Business productivity and project management"
}

Query: "Show me discussions about CRM systems"
{
  "productType": "CRM systems",
  "searchTerms": ["CRM", "customer management", "sales tracking", "lead management", "contact database"],
  "subreddits": ["sales", "entrepreneur", "startups", "saas", "marketing"],
  "intent": "find_leads",
  "confidence": 0.85,
  "problemKeywords": ["losing leads", "disorganized contacts", "sales tracking", "customer data", "follow up"],
  "solutionKeywords": ["CRM", "customer management", "sales software", "lead tracking", "contact management"],
  "conversationTriggers": ["need a CRM", "recommendations", "best CRM", "help with", "looking for"],
  "targetAudience": "Sales professionals, business owners, entrepreneurs managing customer relationships",
  "industryContext": "Sales and customer relationship management"
}

Query: "I need leads for my email marketing software"
{
  "productType": "email marketing software",
  "searchTerms": ["email marketing", "email campaigns", "open rates", "email automation", "newsletter tools"],
  "subreddits": ["marketing", "entrepreneur", "smallbusiness", "ecommerce", "digitalmarketing"],
  "intent": "find_leads",
  "confidence": 0.9,
  "problemKeywords": ["low open rates", "spam folder", "unsubscribes", "email deliverability", "list building"],
  "solutionKeywords": ["email marketing", "automation", "segmentation", "personalization", "deliverability"],
  "conversationTriggers": ["help with email", "struggling", "not working", "advice needed", "recommendations"],
  "targetAudience": "Small business owners, marketers, e-commerce entrepreneurs struggling with email marketing",
  "industryContext": "Digital marketing and email marketing"
}

Focus on finding people who are ACTIVELY discussing problems and seeking solutions, not just mentioning keywords. The search terms should be what people actually say when they're frustrated or looking for help.`

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
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.7,
      problemKeywords: Array.isArray(parsed.problemKeywords) ? parsed.problemKeywords : [],
      solutionKeywords: Array.isArray(parsed.solutionKeywords) ? parsed.solutionKeywords : [],
      conversationTriggers: Array.isArray(parsed.conversationTriggers) ? parsed.conversationTriggers : [],
      targetAudience: parsed.targetAudience || 'General audience',
      industryContext: parsed.industryContext || 'General'
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
      confidence: 0.6,
      problemKeywords: ['struggling', 'need help', 'frustrated'],
      solutionKeywords: searchTerms,
      conversationTriggers: ['need help', 'recommendations', 'looking for'],
      targetAudience: 'General audience',
      industryContext: 'General'
    }
  }
}

export const queryParser = new QueryParser()
