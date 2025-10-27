'use client'

export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { ArrowRight, Calendar, Clock, Search } from 'lucide-react'
import { PublicHeader } from '@/components/PublicHeader'

export default function RedditSEOPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <PublicHeader />

      <article className="py-12 sm:py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/resources/blog" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-8 font-medium">
            ← Back to Blog
          </Link>

          <header className="mb-12">
            <div className="flex items-center mb-4 text-sm text-gray-500">
              <Calendar className="w-4 h-4 mr-2" />
              December 22, 2024
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Reddit SEO: How to Optimize Your SaaS Product for Reddit Discovery
            </h1>
            <div className="flex items-center text-gray-600">
              <Clock className="w-4 h-4 mr-2" />
              <span className="mr-6">7 min read</span>
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">Technical</span>
            </div>
          </header>

          <div className="prose prose-lg max-w-none">
            <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-r-xl mb-8">
              <p className="text-lg font-semibold text-gray-900 mb-2">Key Insight</p>
              <p className="text-gray-700">
                Reddit's search function is powerful—people actively search for solutions here. By optimizing how you present your product, you can get discovered by people searching for exactly what you offer.
              </p>
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">Understanding Reddit Search Behavior</h2>

            <p className="text-lg text-gray-700 mb-6">
              Unlike traditional search engines, Reddit users search for:
            </p>

            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">What People Search For:</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <Search className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0 mt-1" />
                  <div>
                    <div className="font-semibold mb-1">Solution-focused queries</div>
                    <div className="text-sm text-gray-600">"What tool helps with [problem]?"</div>
                  </div>
                </li>
                <li className="flex items-start">
                  <Search className="w-6 h-6 text-green-600 mr-3 flex-shrink-0 mt-1" />
                  <div>
                    <div className="font-semibold mb-1">Comparison requests</div>
                    <div className="text-sm text-gray-600">"Best alternative to [competitor]?"</div>
                  </div>
                </li>
                <li className="flex items-start">
                  <Search className="w-6 h-6 text-purple-600 mr-3 flex-shrink-0 mt-1" />
                  <div>
                    <div className="font-semibold mb-1">Problem-specific searches</div>
                    <div className="text-sm text-gray-600">"How do I [specific task]?"</div>
                  </div>
                </li>
              </ul>
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">Optimizing Your Product's Reddit Presence</h2>

            <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Use the Right Keywords</h3>
            <p className="text-lg text-gray-700 mb-4">
              Include the words your customers use when discussing their problems on Reddit:
            </p>
            <ul className="list-disc list-outside ml-6 space-y-3 text-gray-700 mb-6">
              <li>Look at popular threads in your niche</li>
              <li>Use the exact phrases people type when asking for help</li>
              <li>Incorporate industry jargon your customers use</li>
            </ul>

            <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Position for Specific Use Cases</h3>
            <p className="text-lg text-gray-700 mb-4">
              When people search Reddit, they're looking for specific solutions to specific problems. Make sure you address these:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-green-50 rounded-xl p-6 border-2 border-green-200">
                <h4 className="font-bold text-gray-900 mb-2">✓ Good Positioning</h4>
                <p className="text-sm text-gray-600 italic">
                  "Email automation tool that helps SaaS founders send cold emails to Reddit leads"
                </p>
              </div>
              <div className="bg-red-50 rounded-xl p-6 border-2 border-red-200">
                <h4 className="font-bold text-gray-900 mb-2">✗ Generic Positioning</h4>
                <p className="text-sm text-gray-600 italic">
                  "The best marketing platform for businesses"
                </p>
              </div>
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Create Content That Gets Indexed</h3>
            <p className="text-lg text-gray-700 mb-4">
              Reddit's search indexes posts and comments. By creating valuable content, you can get discovered:
            </p>

            <ul className="list-disc list-outside ml-6 space-y-3 text-gray-700 mb-6">
              <li>Answer questions in relevant subreddits with detailed responses</li>
              <li>Create comparison posts showing your product vs. alternatives</li>
              <li>Share case studies and success stories</li>
              <li>Participate in "What tools do you use?" threads</li>
            </ul>

            <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">Technical Optimization Tips</h2>

            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-8 mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Website Optimizations:</h3>
              <ul className="space-y-3 text-lg text-gray-700">
                <li className="flex items-start">
                  <span className="text-purple-600 font-bold mr-3">•</span>
                  <span>Include Reddit-relevant keywords in your meta descriptions</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 font-bold mr-3">•</span>
                  <span>Create landing pages for specific Reddit communities</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 font-bold mr-3">•</span>
                  <span>Use descriptive URLs that match Reddit search queries</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 font-bold mr-3">•</span>
                  <span>Optimize your landing pages for the problems people search for</span>
                </li>
              </ul>
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">Building Your Reddit SEO Assets</h2>

            <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Create Valuable Posts</h3>
            <p className="text-lg text-gray-700 mb-6">
              Share insights, tools, or resources that help your target audience. These posts get indexed and can rank for relevant searches.
            </p>

            <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Engage in Relevant Discussions</h3>
            <p className="text-lg text-gray-700 mb-6">
              Every comment you make in a relevant thread is a potential entry point for people to discover your product. Focus on being genuinely helpful.
            </p>

            <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Build a ProductWiki</h3>
            <p className="text-lg text-gray-700 mb-6">
              Create comprehensive documentation or a wiki that addresses common Reddit search queries. This becomes a valuable SEO asset.
            </p>

            <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">Monitoring Your Reddit SEO Performance</h2>

            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Track These Metrics:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-3xl font-bold text-blue-600 mb-2">Search Mentions</div>
                  <div className="text-gray-600">How often people mention your product in search results</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-600 mb-2">Referral Traffic</div>
                  <div className="text-gray-600">Visits from Reddit to your website</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-purple-600 mb-2">Engagement Rate</div>
                  <div className="text-gray-600">How often your mentions lead to signups</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-orange-600 mb-2">Top Queries</div>
                  <div className="text-gray-600">Which searches lead people to you</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-center mt-12">
              <h3 className="text-2xl font-bold text-white mb-4">Optimize Your Reddit Discovery</h3>
              <p className="text-blue-100 mb-6">
                Learn which Reddit communities search for solutions you offer with Truleado
              </p>
              <Link href="/auth/signup" className="inline-flex items-center bg-white text-blue-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-100 transition-all duration-200">
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </article>

      {/* Related Articles */}
      <section className="py-12 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Related Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/resources/blog/reddit-communities-for-saas-founders" className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow p-6 border border-gray-200 hover:border-blue-500">
              <h3 className="text-lg font-bold text-gray-900 mb-3">10 Reddit Communities Every SaaS Founder Should Know</h3>
              <p className="text-gray-600 text-sm mb-4">Find the right communities to target</p>
              <div className="text-blue-600 font-semibold text-sm">Read Article →</div>
            </Link>
            <Link href="/resources/blog/ultimate-reddit-marketing-strategy" className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow p-6 border border-gray-200 hover:border-blue-500">
              <h3 className="text-lg font-bold text-gray-900 mb-3">The Ultimate Reddit Marketing Strategy</h3>
              <p className="text-gray-600 text-sm mb-4">Build your complete marketing strategy</p>
              <div className="text-blue-600 font-semibold text-sm">Read Article →</div>
            </Link>
            <Link href="/resources/blog/cold-email-to-warm-conversations" className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow p-6 border border-gray-200 hover:border-blue-500">
              <h3 className="text-lg font-bold text-gray-900 mb-3">From Cold Email to Warm Conversations</h3>
              <p className="text-gray-600 text-sm mb-4">Master the Reddit outreach approach</p>
              <div className="text-blue-600 font-semibold text-sm">Read Article →</div>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

