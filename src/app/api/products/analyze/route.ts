import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const { website } = await request.json()

    if (!website) {
      return NextResponse.json({ error: 'Website URL is required' }, { status: 400 })
    }

    // Validate URL format
    try {
      new URL(website)
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
    }

    // Return fast mock analysis for now
    const analysis = getFastAnalysis(website)

    return NextResponse.json(analysis)
  } catch (error) {
    console.error('Website analysis error:', error)
    return NextResponse.json({ error: 'Failed to analyze website' }, { status: 500 })
  }
}

function getFastAnalysis(url: string) {
  const name = extractNameFromUrl(url)
  const domain = url.toLowerCase()
  
  // Analyze domain and name to provide relevant details
  const analysis = getIntelligentAnalysis(name, domain)
  
  return {
    name,
    description: analysis.description,
    features: analysis.features,
    benefits: analysis.benefits,
    painPoints: analysis.painPoints,
    idealCustomerProfile: analysis.idealCustomerProfile
  }
}

function getIntelligentAnalysis(name: string, domain: string) {
  const nameLower = name.toLowerCase()
  
  // Payment/Finance tools
  if (domain.includes('stripe') || domain.includes('paypal') || domain.includes('payment') || 
      nameLower.includes('pay') || nameLower.includes('stripe') || nameLower.includes('billing')) {
    return {
      description: `${name} is a payment processing platform that helps businesses accept online payments, manage subscriptions, and handle complex billing scenarios with enterprise-grade security and compliance.`,
      features: [
        'One-click checkout optimization that reduces cart abandonment by 35%',
        'Smart retry logic for failed payments with ML-powered recovery',
        'Dynamic 3D Secure authentication based on risk assessment',
        'Real-time fraud scoring with 99.9% accuracy',
        'Automated dunning management for subscription renewals',
        'Multi-party payment splits for marketplaces',
        'Instant payouts to bank accounts in 40+ countries',
        'Revenue recognition automation for SaaS metrics'
      ],
      benefits: [
        'Recover 23% more revenue from failed subscription payments',
        'Reduce checkout abandonment from 70% to 45% industry average',
        'Save 15+ hours per week on manual payment reconciliation',
        'Increase international conversion rates by 18% with local payment methods',
        'Achieve PCI DSS compliance without internal security overhead'
      ],
      painPoints: [
        'Losing $50K+ annually to failed subscription payments and involuntary churn',
        'Spending 20+ hours per week manually reconciling payments across platforms',
        'Cart abandonment rates above 65% due to complex checkout flows',
        'Unable to expand internationally due to local payment method limitations',
        'Constant worry about payment security breaches and compliance violations',
        'High-value transactions getting falsely declined, losing enterprise customers',
        'Marketplace sellers complaining about delayed payouts affecting cash flow'
      ],
      idealCustomerProfile: 'SaaS companies with $100K+ MRR struggling with payment failures, e-commerce stores losing revenue to cart abandonment, and marketplaces needing complex payment routing'
    }
  }
  
  // Proposal/Sales tools
  if (domain.includes('proposal') || nameLower.includes('proposal') || domain.includes('quote') ||
      domain.includes('sales') || nameLower.includes('better')) {
    return {
      description: `${name} is a proposal automation platform that transforms how service businesses create, send, and close deals with interactive, trackable proposals that convert 3x better than traditional PDFs.`,
      features: [
        'AI-powered proposal content generation based on client industry and pain points',
        'Interactive pricing calculators that let clients customize packages in real-time',
        'Video testimonials and case studies embedded directly in proposals',
        'Real-time notification when prospects view, share, or comment on proposals',
        'One-click e-signature with automated contract generation',
        'ROI calculators that show prospects exact value and payback period',
        'Proposal analytics showing time spent on each section and drop-off points',
        'CRM integration that auto-updates deal stages based on proposal engagement'
      ],
      benefits: [
        'Increase proposal win rates from 20% to 65% with interactive content',
        'Reduce proposal creation time from 8 hours to 45 minutes per proposal',
        'Close deals 40% faster with real-time engagement tracking and follow-up triggers',
        'Eliminate 90% of back-and-forth emails during the proposal process',
        'Increase average deal size by 35% with dynamic pricing and upsell suggestions'
      ],
      painPoints: [
        'Spending 2-3 days creating each proposal only to get ghosted by prospects',
        'Losing deals to competitors who present more professional, interactive proposals',
        'No visibility into whether prospects actually read proposals or where they lose interest',
        'Constantly recreating similar proposals from scratch, wasting 10+ hours per week',
        'Prospects asking for revisions that require starting over with formatting and design',
        'Missing follow-up opportunities because you don\'t know when prospects view proposals',
        'Losing enterprise deals because proposals look unprofessional compared to competitors'
      ],
      idealCustomerProfile: 'Agencies billing $500K+ annually frustrated with low proposal win rates, consultants charging $10K+ per project, and service businesses losing deals to better-presented competitors'
    }
  }
  
  // CRM/Marketing tools
  if (domain.includes('crm') || domain.includes('hubspot') || domain.includes('salesforce') ||
      domain.includes('marketing') || nameLower.includes('customer')) {
    return {
      description: `${name} is an intelligent CRM platform that uses AI to predict which leads will convert, automates personalized outreach at scale, and identifies the exact moment prospects are ready to buy.`,
      features: [
        'AI lead scoring that predicts conversion probability with 87% accuracy',
        'Behavioral trigger automation that sends personalized messages based on website activity',
        'Intent data integration showing when prospects research competitors or solutions',
        'Conversation intelligence that analyzes sales calls and suggests next best actions',
        'Predictive pipeline forecasting with deal risk assessment',
        'Automated lead nurturing sequences based on industry, company size, and behavior',
        'Revenue attribution tracking across all touchpoints and campaigns',
        'Account-based marketing orchestration for enterprise prospects'
      ],
      benefits: [
        'Increase qualified lead conversion rates from 2% to 12% with AI scoring',
        'Reduce sales cycle length by 35% with predictive timing insights',
        'Generate 4x more pipeline with automated, personalized outreach sequences',
        'Improve forecast accuracy from 60% to 92% with predictive analytics',
        'Save 25+ hours per week on manual lead research and data entry'
      ],
      painPoints: [
        'Sales team wasting time on leads that will never convert, missing quota by 30%+',
        'Losing $200K+ in potential revenue because prospects go cold without proper nurturing',
        'Unable to scale personalized outreach beyond 50 prospects per rep per week',
        'No visibility into which marketing activities actually drive closed revenue',
        'Reps spending 4+ hours daily on CRM data entry instead of selling',
        'Missing buying signals from prospects who are actively researching solutions',
        'Enterprise deals stalling because you can\'t engage all decision makers effectively'
      ],
      idealCustomerProfile: 'B2B companies with $1M+ revenue struggling to scale sales, marketing teams unable to prove ROI, and sales organizations missing quota due to poor lead quality'
    }
  }
  
  // Design/Creative tools
  if (domain.includes('design') || domain.includes('figma') || domain.includes('canva') ||
      nameLower.includes('design') || domain.includes('creative') || nameLower.includes('figma') ||
      nameLower.includes('sketch') || nameLower.includes('adobe') || nameLower.includes('invision') ||
      nameLower.includes('framer') || nameLower.includes('miro')) {
    return {
      description: `${name} is a collaborative design platform that transforms how product teams build user experiences, with AI-powered design assistance and real-time collaboration that eliminates the handoff between design and development.`,
      features: [
        'AI-powered design suggestions that generate layouts based on user behavior data',
        'Component libraries with automatic design system enforcement across teams',
        'Real-time multiplayer editing with voice chat and cursor tracking',
        'Design-to-code automation that generates production-ready React/Vue components',
        'User testing integration with heatmaps and session recordings built into prototypes',
        'Advanced prototyping with micro-interactions and realistic data simulation',
        'Version control with branching, merging, and conflict resolution for design files',
        'Stakeholder review workflows with approval gates and automated handoff to developers'
      ],
      benefits: [
        'Reduce design-to-development handoff time from 2 weeks to 2 days',
        'Increase design consistency by 85% with automated component library enforcement',
        'Cut prototype creation time from 3 days to 4 hours with AI assistance',
        'Improve user experience metrics by 40% with integrated user testing feedback',
        'Eliminate 90% of design revision cycles with real-time stakeholder collaboration'
      ],
      painPoints: [
        'Developers constantly asking for design specs, slowing down product launches by weeks',
        'Design inconsistencies across products because teams use different component variations',
        'Spending 60% of design time on repetitive tasks instead of creative problem-solving',
        'Stakeholders requesting changes after development has started, causing expensive rework',
        'No way to validate designs with real users before spending months building features',
        'Design files becoming outdated the moment development begins, creating confusion',
        'Junior designers struggling to maintain brand consistency without constant senior oversight'
      ],
      idealCustomerProfile: 'Product teams at tech companies building user-facing applications, design systems teams at enterprises, and startups needing to move fast without sacrificing design quality'
    }
  }
  
  // Analytics/Data tools
  if (domain.includes('analytics') || domain.includes('data') || domain.includes('insight') ||
      nameLower.includes('analytic') || domain.includes('metric') || nameLower.includes('mixpanel') ||
      nameLower.includes('amplitude') || nameLower.includes('segment') || nameLower.includes('tableau') ||
      nameLower.includes('looker') || nameLower.includes('datadog')) {
    return {
      description: `${name} is an AI-powered analytics platform that automatically discovers hidden revenue opportunities, predicts customer behavior, and provides actionable recommendations that directly impact business growth.`,
      features: [
        'Automated anomaly detection that alerts you to revenue leaks within 5 minutes',
        'Predictive customer lifetime value modeling with 94% accuracy',
        'AI-generated insights that identify specific actions to increase revenue by 15-30%',
        'Real-time cohort analysis showing exactly which user segments are most profitable',
        'Automated A/B test analysis with statistical significance and business impact scoring',
        'Cross-platform attribution that tracks customer journeys across 50+ touchpoints',
        'Natural language query interface - ask questions in plain English, get instant answers',
        'Automated executive reporting with key insights delivered to Slack/email daily'
      ],
      benefits: [
        'Discover $500K+ in hidden revenue opportunities within first 30 days',
        'Reduce customer acquisition cost by 40% by identifying highest-converting channels',
        'Increase customer retention by 25% with predictive churn prevention',
        'Save 20+ hours per week on manual data analysis and report creation',
        'Make decisions 5x faster with instant answers to complex business questions'
      ],
      painPoints: [
        'Losing $100K+ monthly to revenue leaks you can\'t identify in your current analytics',
        'Spending $50K+ on marketing channels that don\'t actually drive profitable customers',
        'Data team taking 2+ weeks to answer simple business questions, slowing down decisions',
        'Unable to predict which customers will churn, losing 30%+ revenue annually',
        'Executive team making gut decisions because data insights arrive too late',
        'Wasting 40+ hours per week manually creating reports that nobody reads',
        'Missing growth opportunities because insights are buried in complex dashboards'
      ],
      idealCustomerProfile: 'Growth-stage companies with $5M+ revenue drowning in data but starving for insights, marketing teams burning budget on ineffective channels, and executives making decisions without clear data'
    }
  }
  
  // Project Management tools
  if (domain.includes('project') || domain.includes('task') || domain.includes('team') ||
      nameLower.includes('project') || domain.includes('collaboration') || nameLower.includes('asana') ||
      nameLower.includes('trello') || nameLower.includes('monday') || nameLower.includes('notion') ||
      nameLower.includes('clickup') || nameLower.includes('jira') || nameLower.includes('slack')) {
    return {
      description: `${name} is an intelligent project management platform that uses AI to predict project risks, automatically optimizes resource allocation, and eliminates the chaos of managing complex projects across distributed teams.`,
      features: [
        'AI-powered project risk assessment that predicts delays 3 weeks in advance',
        'Automated resource leveling that prevents team burnout and optimizes capacity',
        'Smart dependency mapping that identifies critical path bottlenecks automatically',
        'Real-time budget tracking with cost overrun predictions and mitigation suggestions',
        'Intelligent task prioritization based on business impact and deadline urgency',
        'Automated status reporting that generates executive updates from team activity',
        'Cross-project portfolio optimization that maximizes ROI across all initiatives',
        'Predictive timeline estimation based on team velocity and historical data'
      ],
      benefits: [
        'Deliver projects 45% faster by eliminating resource conflicts and bottlenecks',
        'Reduce project budget overruns from 30% to under 5% with predictive cost management',
        'Increase team productivity by 60% with AI-optimized task assignments',
        'Prevent 90% of project delays with early risk detection and mitigation',
        'Save 15+ hours per week on status meetings and progress reporting'
      ],
      painPoints: [
        'Projects consistently running 50%+ over budget due to poor resource planning',
        'Team members burning out because workload distribution is completely unbalanced',
        'Critical project dependencies discovered too late, causing 3-month delays',
        'Executives blindsided by project failures because status reports were misleading',
        'Unable to prioritize projects effectively, working on low-impact initiatives',
        'Spending 20+ hours per week in status meetings instead of actual work',
        'High-value projects failing because key team members are overallocated across initiatives'
      ],
      idealCustomerProfile: 'Engineering teams at tech companies managing complex product roadmaps, agencies juggling 20+ client projects, and enterprises struggling with cross-functional project coordination'
    }
  }
  
  // Default SaaS/Business tool - Make it more specific and impactful
  return {
    description: `${name} is an intelligent business automation platform that eliminates repetitive work, connects disconnected systems, and scales operations without hiring additional staff.`,
    features: [
      'No-code workflow automation that connects 500+ business applications',
      'AI-powered process optimization that identifies bottlenecks and suggests improvements',
      'Smart document processing that extracts data from PDFs, emails, and forms automatically',
      'Intelligent routing that assigns tasks to the right person based on workload and expertise',
      'Real-time performance monitoring with alerts when processes deviate from normal patterns',
      'Custom approval workflows with escalation rules and deadline management',
      'Advanced analytics showing time saved, costs reduced, and efficiency gains',
      'Mobile-first design enabling process management from anywhere'
    ],
    benefits: [
      'Eliminate 25+ hours per week of manual, repetitive tasks across your team',
      'Reduce operational costs by 35% without laying off employees',
      'Increase process completion speed by 70% with automated handoffs',
      'Prevent 95% of human errors in critical business processes',
      'Scale operations to handle 3x more volume with the same team size'
    ],
    painPoints: [
      'Team spending 40+ hours per week on manual data entry and repetitive tasks',
      'Critical processes breaking down when key employees are out of office',
      'Unable to scale operations without constantly hiring more administrative staff',
      'Important tasks falling through the cracks because there\'s no systematic tracking',
      'Customers frustrated by slow response times due to manual approval processes',
      'Executives lacking visibility into operational efficiency and bottlenecks',
      'Compliance issues arising from inconsistent manual processes'
    ],
    idealCustomerProfile: 'Growing companies with 50-500 employees drowning in manual processes, operations teams struggling to scale, and businesses losing customers due to slow, error-prone workflows'
  }
}

function extractNameFromUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname
    const domain = hostname.replace('www.', '')
    return domain.split('.')[0].replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  } catch {
    return 'Product Name'
  }
}
