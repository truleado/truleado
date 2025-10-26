'use client'

export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { ArrowRight, Calendar, Clock, Mail, MessageSquare } from 'lucide-react'
import { PublicHeader } from '@/components/PublicHeader'

export default function ColdEmailToWarmPage() {
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
              December 28, 2024
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              From Cold Email to Warm Conversations: The Reddit Approach
            </h1>
            <div className="flex items-center text-gray-600">
              <Clock className="w-4 h-4 mr-2" />
              <span className="mr-6">9 min read</span>
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">Outreach</span>
            </div>
          </header>

          <div className="prose prose-lg max-w-none">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              <div className="bg-red-50 rounded-2xl p-6 border-2 border-red-200">
                <div className="flex items-center mb-4">
                  <Mail className="w-10 h-10 text-red-600 mr-4" />
                  <h3 className="text-2xl font-bold text-gray-900">Cold Email</h3>
                </div>
                <ul className="space-y-3 text-gray-700">
                  <li>❌ 1-2% response rate</li>
                  <li>❌ High spam score</li>
                  <li>❌ No context or relationship</li>
                  <li>❌ Feels like advertising</li>
                  <li>❌ Time-consuming to personalize</li>
                </ul>
              </div>

              <div className="bg-green-50 rounded-2xl p-6 border-2 border-green-200">
                <div className="flex items-center mb-4">
                  <MessageSquare className="w-10 h-10 text-green-600 mr-4" />
                  <h3 className="text-2xl font-bold text-gray-900">Warm Reddit Outreach</h3>
                </div>
                <ul className="space-y-3 text-gray-700">
                  <li>✅ 15-20% response rate</li>
                  <li>✅ Natural, helpful context</li>
                  <li>✅ Genuine relationship exists</li>
                  <li>✅ Feels like a conversation</li>
                  <li>✅ Context already established</li>
                </ul>
              </div>
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">Why Reddit Outreach Converts 10x Better</h2>

            <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. They're Already Looking</h3>
            <p className="text-lg text-gray-700 mb-4">
              When someone posts on Reddit asking for help with a problem your product solves, they're actively seeking a solution. This is completely different from cold emailing random people.
            </p>

            <div className="bg-blue-50 rounded-xl p-6 mb-6">
              <p className="text-lg font-semibold text-gray-900 mb-2">Example:</p>
              <p className="text-gray-700 italic">
                "Does anyone know of a tool that [specific problem your product solves]? I've tried [competitors] but they don't do [specific feature you excel at]."
              </p>
              <p className="text-gray-600 mt-3">
                This person is literally asking for your product. That's warm outreach.
              </p>
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Natural Context</h3>
            <p className="text-lg text-gray-700 mb-6">
              On Reddit, you can see the person's pain points, their current situation, and even their objections. This allows you to craft a response that genuinely addresses their needs.
            </p>

            <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Community Trust</h3>
            <p className="text-lg text-gray-700 mb-6">
              By engaging in the community before promoting your product, you build trust. People are more likely to respond to someone who's been helpful in the past.
            </p>

            <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">The Reddit Outreach Formula</h2>

            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-8 mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Step-by-Step Process:</h3>
              
              <div className="space-y-6">
                <div>
                  <div className="flex items-center mb-2">
                    <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-3">1</span>
                    <h4 className="text-xl font-bold text-gray-900">Identify the Opportunity</h4>
                  </div>
                  <p className="text-gray-600 ml-11">
                    Find threads where people actively discuss problems your product solves
                  </p>
                </div>

                <div>
                  <div className="flex items-center mb-2">
                    <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-3">2</span>
                    <h4 className="text-xl font-bold text-gray-900">Add Value First</h4>
                  </div>
                  <p className="text-gray-600 ml-11">
                    Respond to the original post with genuine help or insights
                  </p>
                </div>

                <div>
                  <div className="flex items-center mb-2">
                    <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-3">3</span>
                    <h4 className="text-xl font-bold text-gray-900">Offer a Solution</h4>
                  </div>
                  <p className="text-gray-600 ml-11">
                    Naturally introduce your product as a helpful solution, not a sales pitch
                  </p>
                </div>

                <div>
                  <div className="flex items-center mb-2">
                    <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-3">4</span>
                    <h4 className="text-xl font-bold text-gray-900">Follow Up Personally</h4>
                  </div>
                  <p className="text-gray-600 ml-11">
                    Send a direct message to continue the conversation privately
                  </p>
                </div>
              </div>
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">Example Outreach Message</h2>

            <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Good Reddit Outreach:</h3>
              <div className="bg-gray-50 rounded-xl p-6 italic text-gray-700">
                <p className="mb-3">"Hey [Name],</p>
                <p className="mb-3">
                  I saw your post about [specific problem they mentioned]. We actually built [Your Product] specifically to solve this because we faced the same challenge.
                </p>
                <p className="mb-3">
                  It does [key feature] which I think would help with [their specific pain point]. Happy to show you how it works if interested—no pressure, just genuinely think it could help.
                </p>
                <p>Best,<br />[Your Name]"</p>
              </div>
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">The ROI Difference</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <div className="text-5xl font-bold text-blue-600 mb-2">10x</div>
                <div className="text-gray-600">Higher response rate</div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <div className="text-5xl font-bold text-green-600 mb-2">3x</div>
                <div className="text-gray-600">More qualified leads</div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <div className="text-5xl font-bold text-purple-600 mb-2">0%</div>
                <div className="text-gray-600">Spam complaints</div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-center mt-12">
              <h3 className="text-2xl font-bold text-white mb-4">Start Warm Conversations</h3>
              <p className="text-blue-100 mb-6">
                Use Truleado to find opportunities where people are actively seeking your solution
              </p>
              <Link href="/auth/signup" className="inline-flex items-center bg-white text-blue-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-100 transition-all duration-200">
                Get Started for Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </article>
    </div>
  )
}

