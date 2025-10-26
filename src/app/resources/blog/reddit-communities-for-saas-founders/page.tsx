'use client'

export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { ArrowRight, Calendar, Clock, Users } from 'lucide-react'
import { PublicHeader } from '@/components/PublicHeader'

export default function RedditCommunitiesPage() {
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
              January 5, 2025
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              10 Reddit Communities Every SaaS Founder Should Know
            </h1>
            <div className="flex items-center text-gray-600">
              <Clock className="w-4 h-4 mr-2" />
              <span className="mr-6">10 min read</span>
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">Community</span>
            </div>
          </header>

          <div className="prose prose-lg max-w-none">
            <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-r-xl mb-8">
              <p className="text-lg font-semibold text-gray-900 mb-2">Quick Summary</p>
              <p className="text-gray-700">
                These Reddit communities are where your potential customers hang out, discuss problems, and seek solutions. Understanding these communities is the first step to finding qualified leads.
              </p>
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">The Must-Know Communities</h2>

            {[
              { name: "r/SaaS", members: "95K+", desc: "Where SaaS founders and operators discuss everything from pricing to product features" },
              { name: "r/Entrepreneur", members: "4M+", desc: "A massive community of entrepreneurs sharing ideas, challenges, and opportunities" },
              { name: "r/startups", members: "5M+", desc: "Startup founders discuss funding, growth, hiring, and the journey of building a company" },
              { name: "r/webdev", members: "7.3M+", desc: "Web developers discussing tools, frameworks, and technical challenges—your potential customers" },
              { name: "r/productmanagement", members: "590K+", desc: "Product managers discuss features, roadmaps, and tools they need" },
              { name: "r/Marketing", members: "2.5M+", desc: "Marketing professionals discussing campaigns, tools, and strategies" },
              { name: "r/smallbusiness", members: "3.5M+", desc: "Small business owners seeking solutions to operational challenges" },
              { name: "r/business", members: "7.8M+", desc: "General business discussions—a goldmine of pain points and opportunities" },
              { name: "r/sales", members: "600K+", desc: "Sales professionals discussing tools, techniques, and solutions" },
              { name: "r/technology", members: "14M+", desc: "Tech enthusiasts discussing the latest tools and innovations" }
            ].map((community, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg p-6 mb-6 hover:shadow-xl transition-shadow">
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex items-center mb-2">
                      <h3 className="text-xl font-bold text-gray-900 mr-3">{community.name}</h3>
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                        {community.members}
                      </span>
                    </div>
                    <p className="text-gray-600">{community.desc}</p>
                  </div>
                </div>
              </div>
            ))}

            <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">How to Engage in These Communities</h2>

            <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Observe First</h3>
            <p className="text-lg text-gray-700 mb-4">
              Spend time understanding the community's culture, common questions, and what's considered valuable content. Every subreddit has its own norms.
            </p>

            <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Add Value</h3>
            <p className="text-lg text-gray-700 mb-4">
              Answer questions, share insights, and help people solve problems—without promoting your product. Build credibility first.
            </p>

            <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Share Strategically</h3>
            <p className="text-lg text-gray-700 mb-4">
              When your product genuinely solves someone's problem, share it naturally. Focus on the problem-solving aspect, not the sales pitch.
            </p>

            <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">Finding the Right Communities for Your Product</h2>

            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-8 mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Ask Yourself:</h3>
              <ul className="space-y-3 text-lg text-gray-700">
                <li className="flex items-start">
                  <span className="text-purple-600 font-bold mr-3">•</span>
                  <span>Who uses your product? Find communities where they hang out.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 font-bold mr-3">•</span>
                  <span>What problems does your product solve? Join communities discussing those problems.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 font-bold mr-3">•</span>
                  <span>Who influences your customers? Find those professional communities.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 font-bold mr-3">•</span>
                  <span>Where do people ask for recommendations? These are goldmines for leads.</span>
                </li>
              </ul>
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">Tools That Help You Discover Communities</h2>

            <p className="text-lg text-gray-700 mb-6">
              Finding the right communities manually is time-consuming. Tools like Truleado can:
            </p>

            <ul className="list-disc list-outside ml-6 space-y-3 text-gray-700 mb-8">
              <li>Automatically identify relevant subreddits for your product</li>
              <li>Track conversations across multiple communities</li>
              <li>Prioritize opportunities based on engagement and intent</li>
              <li>Save you hours of manual community research</li>
            </ul>

            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-center mt-12">
              <h3 className="text-2xl font-bold text-white mb-4">Start Engaging Today</h3>
              <p className="text-blue-100 mb-6">
                Use Truleado to discover which communities matter most for your SaaS and find qualified leads automatically
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

