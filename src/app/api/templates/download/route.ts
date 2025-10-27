import { NextRequest, NextResponse } from 'next/server';

const templates = {
  'reddit-outreach': {
    filename: 'reddit-outreach-template.txt',
    content: `Reddit Outreach Template
================================

Template 1: Value-First Outreach (Best for Active Discussions)

Subject: [Your Product] might help with [Their Specific Problem]

Hi [Name],

I saw your post in [subreddit] about [their specific problem/need]. I built [Your Product] which [specific feature that solves their problem].

Would love to show you how it works if you're interested. No pressure—I genuinely think it could help with [their specific use case].

[Optional: Attach a helpful resource, screenshot, or demo link]

Best,
[Your Name]
[Your Role]
[Your Product]

---

Template 2: Question-Based Outreach (For Builders/Founders)

Subject: Re: [Their Post Title]

Hey [Name],

Interesting point about [their topic]. Have you tried [your approach/solution]?

I built [Your Product] because I faced the same challenge. It's not perfect, but [specific benefit] has been huge for [specific use case].

Happy to share more details if you're interested!

[Your Name]

---

Template 3: Responding to Feature Requests

Subject: This is exactly what [Your Product] does!

Hi [Name],

You mentioned needing [specific feature/functionality] for [their use case].

I actually built [Your Product] to solve exactly this! We have [feature] that does [what they need].

Would you be open to checking it out? I'd love to get your feedback—especially since this is your exact use case.

Cheers,
[Your Name]
[Link to your product]

---

Template 4: For Help/Recommendation Requests

Subject: Re: Looking for recommendations

Hi [Name],

I might have exactly what you're looking for!

You mentioned needing [their need]. I built [Your Product] specifically for [their use case] and it does [specific thing they need].

Happy to show you if interested—and genuinely curious about your feedback since you're solving [their problem].

Best,
[Your Name]

---

Key Principles:
1. NEVER be overly promotional
2. ALWAYS add specific value first
3. Reference their specific situation
4. Focus on solving their problem
5. Make it personal and authentic
6. End with low-pressure invitation

Avoid:
❌ "Hey, check out my product!"
❌ Copy-pasting the same message
❌ Being pushy or salesy
❌ Ignoring context

Do:
✅ Be genuinely helpful
✅ Reference their specific post/comment
✅ Provide a solution to their actual problem
✅ Be authentic and personable
✅ Make it easy for them to respond
`,
  },
  'lead-qualification': {
    filename: 'lead-qualification-checklist.txt',
    content: `Reddit Lead Qualification Checklist
========================================

Use this checklist to determine if a Reddit lead is worth pursuing.

[A] CONTEXT QUALITY (1 point each)
□ Posted or commented in the last 7 days (current need)
□ Active in relevant communities (right audience)
□ Shows genuine frustration or clear need (buying intent)
□ Has specific problem (not vague/general)
□ Technical proficiency matches your product (right fit)

[A] Total: ___/5


[B] DEMOGRAPHIC FIT (1 point each)
□ Job title/role indicates decision-making authority
□ Industry/vertical aligns with your ICP
□ Company size in your target range
□ Location in your serviceable market
□ Budget signals (mentions paying for solutions)

[B] Total: ___/5


[C] ENGAGEMENT SIGNALS (1 point each)
□ Asks specific questions about features
□ Shows deep understanding of problem
□ Engaging in detailed discussions
□ Responsive to helpful responses
□ Open to trying new solutions

[C] Total: ___/5


[D] TIMING URGENCY (bonus points)
□ Mentions immediate deadline or pain point
□ Actively evaluating solutions
□ Shows budget constraint with timeline
□ Multiple related posts/comments

[D] Total: ___/3


SCORING GUIDE:
A + B + C = ___/15

15-11: HIGH PRIORITY - Reach out within 24 hours
10-7: MEDIUM PRIORITY - Add to weekly outreach
6-4: LOW PRIORITY - Monitor for development
Below 4: DON'T PURSUE - Not a good fit

BONUS:
If D is 2+: UPGRADE to next tier
If urgent timeline: PRIORITIZE immediately


EXAMPLE SCORING:

Scenario 1: Mid-tier SaaS (A+B+C+D = 14+2)
Founder in r/SaaS asking about "CRM that integrates with Slack"
- Current need ✓
- Right audience ✓
- Specific problem ✓
- Decision maker ✓
- Budget indicators ✓
- Detailed questions ✓
- Urgent timeline ✓✓
→ HIGH PRIORITY + URGENT

Scenario 2: Generic Poster (A+B+C+D = 6+0)
Generic comment "anyone know a good tool?"
- Vague need
- No context
- Low engagement
→ DON'T PURSUE


QUALIFICATION RED FLAGS:
❌ Generic or copy-paste looking posts
❌ Asks for free/cheap solutions when you're premium
❌ Wrong industry/vertical completely
❌ Poor communication (spelling, tone, professionalism)
❌ Red flags in post history (spam, inappropriate content)

When in doubt, monitor for 3-5 days to see if interest develops.

Last updated: January 2025
`,
  },
  'product-research': {
    filename: 'product-research-worksheet.txt',
    content: `Product Research Worksheet for Reddit Marketing
====================================================

Use this worksheet before launching any Reddit marketing campaign.

PART 1: PRODUCT POSITIONING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[1] Your Product Name:
_________________________________________________

[2] Core Value Proposition (1 sentence):
_________________________________________________
_________________________________________________

[3] Top 3 Features That Matter Most to Customers:
1. _________________________________________________
2. _________________________________________________
3. _________________________________________________

[4] Best Use Cases (3 specific scenarios):
1. _________________________________________________
2. _________________________________________________
3. _________________________________________________

[5] Target Customer (ICP):
Company Size: _________
Industry: _____________
Job Title: ___________
Budget: _____________
Primary Pain Point: ___
_________________________________________________


PART 2: REDDIT LANDSCAPE MAPPING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[1] Primary Subreddits (where your customers hang out):
□ _____________________ (members: ___, engagement: ___)
□ _____________________ (members: ___, engagement: ___)
□ _____________________ (members: ___, engagement: ___)

[2] Related Communities (adjacent to your market):
□ _____________________
□ _____________________
□ _____________________

[3] Competitor Activity:
Competitor 1: ________________________________
- Subreddits they're active in: _____________
- How they engage: __________________________
- Their messaging: __________________________

Competitor 2: ________________________________
- Subreddits they're active in: _____________
- How they engage: __________________________


PART 3: KEYWORD RESEARCH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[1] How people describe your product category:
Popular Terms: __________________________________
_________________________________________________

[2] What people are looking for (exact phrases):
□ "Looking for a..." _________________________
□ "Need something to..." _____________________
□ "Anyone know a good..." _____________________
□ "What's the best..." ________________________

[3] Pain Points Your Product Solves:
Problem 1: _____________________________________
How people express it: __________________________

Problem 2: _____________________________________
How people express it: __________________________

Problem 3: _____________________________________
How people express it: __________________________


PART 4: MESSAGING FRAMEWORK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[1] Headline (why people care):
_________________________________________________
_________________________________________________

[2] Hook (gets attention):
_________________________________________________
_________________________________________________

[3] Problem Statement (their pain):
_________________________________________________
_________________________________________________

[4] Solution Statement (how you help):
_________________________________________________
_________________________________________________

[5] Proof/Reason to Believe:
_________________________________________________
_________________________________________________

[6] Call to Action:
_________________________________________________


PART 5: CONTENT STRATEGY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[1] Helpful Posts You Can Create:
□ Educational: _________________________________
□ How-to Guide: _______________________________
□ Tool/Template: ______________________________
□ Case Study: _________________________________

[2] Types of Comments You Can Make:
□ Answer questions about ___________
□ Share insights on _______________
□ Provide resources for ___________

[3] Engagement Strategy:
When: _________________________________________
How often: ___________________________________
Tone: _________________________________________
Focus: _______________________________________


COMPLETION CHECKLIST:
□ Product positioning clearly defined
□ Top subreddits identified and researched
□ Competitor activity analyzed
□ Keywords and phrases documented
□ Messaging framework complete
□ Content ideas outlined
□ Ready to engage authentically


Date Completed: ___________
Reviewed by: _____________
Next Review: _____________
`,
  },
  'community-engagement': {
    filename: 'community-engagement-plan.txt',
    content: `Reddit Community Engagement Plan
==================================

A 30-day roadmap to build credibility and trust in Reddit communities.

WEEK 1: RESEARCH & IMMERSION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Day 1-2: Identify Target Communities
□ List top 5-10 relevant subreddits
□ Read rules and guidelines for each
□ Note community culture and expectations
□ Identify key moderators

Day 3-4: Observe and Learn
□ Read top posts from past week
□ Study successful contributions
□ Identify power users and influencers
□ Note common questions and patterns
□ Understand what content performs well

Day 5-7: Create Educational Content
□ Write one helpful post (educate, don't sell)
□ Share insights, tips, or resources
□ Answer 3-5 questions in comments
□ Focus on genuinely helping


WEEK 2: BUILD PRESENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Goal: Establish yourself as a helpful contributor

□ Post in 2-3 communities (educational content)
□ Answer 10-15 questions across communities
□ Share free resources or templates
□ Engage in discussions without promoting
□ Upvote and support other helpful content
□ Respond to comments on your posts


WEEK 3: ESTABLISH AUTHORITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Goal: Become known as a trusted expert

□ Create comprehensive guide (detailed post)
□ Offer to do free reviews/audits
□ Share case studies or examples
□ Start conversations about industry trends
□ Provide valuable tools or templates
□ Focus on solving problems


WEEK 4: STRATEGIC ENGAGEMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Goal: Identify opportunities while maintaining trust

□ Monitor for product-fit opportunities
□ Engage genuinely when you can help
□ Reference your product only when highly relevant
□ Continue providing free value
□ Track engagement metrics
□ Build relationships with active members


MONTHLY ENGAGEMENT TARGETS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Posts: 4-6 helpful posts (not promotional)
Comments: 30-50 genuine responses
Questions Answered: 20+ across all communities
Resources Shared: 2-3 free tools/templates
Upvotes Received: Track engagement quality


ENGAGEMENT GUIDELINES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ DO:
- Provide genuine value in every interaction
- Follow each community's rules strictly
- Be helpful, authentic, and patient
- Give before you ask (build credibility first)
- Personalize every message
- Focus on problem-solving

❌ DON'T:
- Be overtly promotional or salesy
- Share affiliate links
- Spam multiple communities with same content
- Violate Reddit's self-promotion guidelines
- Appear desperate or pushy
- Copy-paste responses


TYPES OF VALUABLE CONTENT TO CREATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Educational Posts
   - "How to [solve specific problem]"
   - "X ways to [achieve goal]"
   - Industry insights and trends

2. Resource Posts
   - Free templates or tools
   - Curated lists of resources
   - Checklists or frameworks

3. Case Studies (without being promotional)
   - "How we solved [problem]"
   - Example: "I built [thing] and here's what I learned"

4. Discussion Starters
   - Ask thought-provoking questions
   - Share interesting findings
   - Start trend discussions


SUCCESS METRICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Track these to measure your impact:

□ Karma earned per community
□ Number of people you've helped
□ Direct messages you receive
□ Questions about your expertise
□ Invitations to communities/projects
□ Leads identified (not solicited)
□ Positive comments about your contributions


RISK MITIGATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Avoid these common mistakes:

⚠️ 90/10 Rule Violation: If you have 10 posts, only 1 should promote
⚠️ Rule Breaking: Read rules before posting
⚠️ Irrelevant Promotion: Wrong community or wrong moment
⚠️ Being Pushy: Respect boundaries
⚠️ Inauthentic Engagement: Be genuine


MONTHLY REVIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

At the end of each month, review:
- Which communities were most receptive?
- What content performed best?
- What mistakes did you make?
- How can you be more helpful?
- What opportunities did you identify?
- How did your presence grow?


Remember: Building community presence is a marathon, not a sprint.
Focus on giving genuine value, and opportunities will come naturally.

Last updated: January 2025
`,
  }
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const template = searchParams.get('template');
  
  if (!template || !templates[template as keyof typeof templates]) {
    return NextResponse.json({ error: 'Invalid template' }, { status: 400 });
  }
  
  const templateData = templates[template as keyof typeof templates];
  
  return new NextResponse(templateData.content, {
    headers: {
      'Content-Type': 'text/plain',
      'Content-Disposition': `attachment; filename="${templateData.filename}"`,
    },
  });
}

