import { callOpenRouterJSON } from './openrouter-client'

export interface ProductData {
  name: string
  description: string
  features: string[]
  benefits: string[]
  painPoints: string[]
  idealCustomerProfile: string
}

export interface SearchStrategy {
  problemTerms: string[]
  solutionTerms: string[]
  industryTerms: string[]
  conversationTerms: string[]
  urgencyTerms: string[]
  toolTerms: string[]
}

export class AISearchGenerator {
  
  async generateSearchTerms(product: ProductData): Promise<SearchStrategy> {
    try {
      const openrouterApiKey = process.env.OPENROUTER_API_KEY
      
      if (openrouterApiKey) {
        try {
          console.log('Generating search terms with OpenRouter...')
          return await this.generateWithOpenRouter(product)
        } catch (error) {
          console.error('OpenRouter search generation failed:', error)
          // Continue to fallback
        }
      }
      
      console.log('Using fallback search term generation (no AI available)')
      return this.getFallbackSearchTerms(product)
      
    } catch (error) {
      console.error('AI search generation error:', error)
      return this.getFallbackSearchTerms(product)
    }
  }

  private async generateWithOpenRouter(product: ProductData): Promise<SearchStrategy> {
    const prompt = `You are an expert at generating highly targeted search terms for finding leads on Reddit. Your job is to analyze a product and create search terms that will find people actively discussing problems this product solves.

PRODUCT ANALYSIS:
- Name: ${product.name}
- Description: ${product.description}
- Features: ${product.features.join(', ')}
- Benefits: ${product.benefits.join(', ')}
- Pain Points: ${product.painPoints.join(', ')}
- Target Customers: ${product.idealCustomerProfile}

GENERATE SEARCH TERMS IN THESE CATEGORIES:

1. PROBLEM TERMS (8 terms): Words/phrases people use when complaining about or struggling with the problems this product solves
2. SOLUTION TERMS (8 terms): Words/phrases people use when seeking solutions or tools
3. INDUSTRY TERMS (6 terms): Industry-specific terminology and jargon
4. CONVERSATION TERMS (6 terms): Phrases that indicate someone is actively seeking help or recommendations
5. URGENCY TERMS (4 terms): Words that indicate immediate need or frustration
6. TOOL TERMS (6 terms): Specific tool names or categories people mention

GUIDELINES:
- Focus on how people actually talk, not marketing language
- Include misspellings and common variations
- Think about Reddit discussions, not formal business language
- Include both broad and specific terms
- Consider different experience levels (beginner to expert)
- Include terms from different perspectives (user, buyer, decision maker)

Return ONLY a valid JSON object with this exact structure:
{
  "problemTerms": ["term1", "term2", "term3", "term4", "term5", "term6", "term7", "term8"],
  "solutionTerms": ["term1", "term2", "term3", "term4", "term5", "term6", "term7", "term8"],
  "industryTerms": ["term1", "term2", "term3", "term4", "term5", "term6"],
  "conversationTerms": ["term1", "term2", "term3", "term4", "term5", "term6"],
  "urgencyTerms": ["term1", "term2", "term3", "term4"],
  "toolTerms": ["term1", "term2", "term3", "term4", "term5", "term6"]
}`

    try {
      const searchStrategy = await callOpenRouterJSON<SearchStrategy>(prompt, {
        model: 'openai/gpt-4o-mini',
        temperature: 0.3,
        max_tokens: 1000
      })
      
      console.log('OpenRouter search terms generated successfully')
      return searchStrategy
    } catch (error) {
      console.error('OpenRouter search generation error:', error)
      throw error
    }
  }

  private getFallbackSearchTerms(product: ProductData): SearchStrategy {
    console.log('Using fallback search term generation')
    
    // Generate basic search terms from product data
    const problemTerms = [
      ...product.painPoints.slice(0, 4),
      ...this.generateBasicProblemTerms(product)
    ].slice(0, 8)

    const solutionTerms = [
      product.name.toLowerCase(),
      ...product.benefits.slice(0, 4),
      ...this.generateBasicSolutionTerms(product)
    ].slice(0, 8)

    const industryTerms = this.generateBasicIndustryTerms(product).slice(0, 6)
    const conversationTerms = [
      'help with',
      'recommendations',
      'struggling with',
      'looking for',
      'advice on',
      'best practices'
    ].slice(0, 6)

    const urgencyTerms = ['urgent', 'asap', 'desperate', 'frustrated'].slice(0, 4)
    const toolTerms = [
      product.name.toLowerCase(),
      ...product.features.slice(0, 3),
      'software',
      'tool',
      'platform'
    ].slice(0, 6)

    return {
      problemTerms,
      solutionTerms,
      industryTerms,
      conversationTerms,
      urgencyTerms,
      toolTerms
    }
  }

  private generateBasicProblemTerms(product: ProductData): string[] {
    const terms = []
    
    // Extract key words from description that might indicate problems
    const descriptionWords = product.description.toLowerCase().split(' ')
    const problemKeywords = ['challenge', 'problem', 'issue', 'struggle', 'difficult', 'complex', 'overwhelming']
    
    for (const word of descriptionWords) {
      if (problemKeywords.some(keyword => word.includes(keyword))) {
        terms.push(word)
      }
    }
    
    return terms.slice(0, 4)
  }

  private generateBasicSolutionTerms(product: ProductData): string[] {
    const terms = []
    
    // Extract solution-related words
    const descriptionWords = product.description.toLowerCase().split(' ')
    const solutionKeywords = ['solution', 'tool', 'platform', 'software', 'system', 'help', 'improve', 'streamline']
    
    for (const word of descriptionWords) {
      if (solutionKeywords.some(keyword => word.includes(keyword))) {
        terms.push(word)
      }
    }
    
    return terms.slice(0, 4)
  }

  private generateBasicIndustryTerms(product: ProductData): string[] {
    const terms = []
    
    // Extract industry-related words from features and description
    const allText = `${product.description} ${product.features.join(' ')} ${product.benefits.join(' ')}`.toLowerCase()
    const industryKeywords = ['management', 'tracking', 'analytics', 'automation', 'integration', 'workflow', 'process', 'data']
    
    for (const word of industryKeywords) {
      if (allText.includes(word)) {
        terms.push(word)
      }
    }
    
    return terms.slice(0, 6)
  }
}

// Export singleton instance
export const aiSearchGenerator = new AISearchGenerator()