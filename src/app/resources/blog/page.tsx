'use client'

export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { ArrowRight, Calendar, Clock } from 'lucide-react'
import { PublicHeader } from '@/components/PublicHeader'

const blogPosts = [
  {
    title: "How to Find Your First 100 Reddit Leads in 30 Days",
    excerpt: "A step-by-step guide to discovering high-quality Reddit opportunities and converting them into customers.",
    date: "January 15, 2025",
    readTime: "8 min read",
    category: "Lead Generation",
    image: "🚀"
  },
  {
    title: "The Ultimate Reddit Marketing Strategy for SaaS Founders",
    excerpt: "Learn the proven tactics successful SaaS founders use to grow their customer base through strategic Reddit engagement.",
    date: "January 12, 2025",
    readTime: "12 min read",
    category: "Marketing",
    image: "📈"
  },
  {
    title: "AI-Powered vs Manual Lead Research: The ROI Comparison",
    excerpt: "Discover why AI-powered lead research tools like Truleado are transforming how SaaS companies find customers.",
    date: "January 8, 2025",
    readTime: "6 min read",
    category: "ROI",
    image: "💡"
  },
  {
    title: "10 Reddit Communities Every SaaS Founder Should Know",
    excerpt: "The most active and relevant Reddit communities where your potential customers are already discussing their problems.",
    date: "January 5, 2025",
    readTime: "10 min read",
    category: "Community",
    image: "🌟"
  },
  {
    title: "From Cold Email to Warm Conversations: The Reddit Approach",
    excerpt: "Why reaching out to people actively seeking solutions beats cold emailing strangers 10 to 1.",
    date: "December 28, 2024",
    readTime: "9 min read",
    category: "Outreach",
    image: "💬"
  },
  {
    title: "Reddit SEO: How to Optimize Your SaaS Product for Reddit Discovery",
    excerpt: "Technical strategies to ensure your product shows up when people search for solutions on Reddit.",
    date: "December 22, 2024",
    readTime: "7 min read",
    category: "Technical",
    image: "🔍"
  },
  {
    title: "Reddit Marketing Automation: How to Scale Your Reddit Outreach",
    excerpt: "Learn how to automate your Reddit marketing to never miss an opportunity without burning out.",
    date: "January 20, 2025",
    readTime: "10 min read",
    category: "Automation",
    image: "⚙️"
  },
  {
    title: "Reddit Subreddit Monitoring: Never Miss a Lead Opportunity",
    excerpt: "Discover how to effectively monitor Reddit subreddits and identify marketing opportunities at scale.",
    date: "January 21, 2025",
    readTime: "9 min read",
    category: "Monitoring",
    image: "👁️"
  },
  {
    title: "Reddit Outreach Best Practices: Engage Without Seeming Spammy",
    excerpt: "Master authentic Reddit engagement that adds value and converts without getting banned.",
    date: "January 22, 2025",
    readTime: "11 min read",
    category: "Outreach",
    image: "💬"
  },
  {
    title: "Reddit Marketing ROI: Calculate Your Return on Investment",
    excerpt: "Learn to measure, optimize, and maximize ROI for your Reddit marketing campaigns.",
    date: "January 23, 2025",
    readTime: "12 min read",
    category: "ROI",
    image: "📊"
  },
  {
    title: "Reddit Lead Qualification: Identify High-Value Opportunities",
    excerpt: "Master the framework for qualifying Reddit leads and focusing on opportunities that convert.",
    date: "January 24, 2025",
    readTime: "10 min read",
    category: "Lead Generation",
    image: "🎯"
  }
]

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <PublicHeader />

      {/* Hero Section */}
      <section className="py-12 sm:py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Reddit Marketing Blog
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Learn how successful SaaS founders discover leads, build communities, and grow their businesses on Reddit
            </p>
          </div>

          {/* Featured Post */}
          <div className="mb-16 bg-white rounded-3xl shadow-2xl overflow-hidden hover:shadow-3xl transition-shadow">
            <div className="md:flex">
              <div className="md:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-600 p-12 flex items-center justify-center">
                <div className="text-8xl">🚀</div>
              </div>
              <div className="md:w-1/2 p-8 sm:p-12">
                <div className="flex items-center mb-4 text-sm text-gray-500">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">Featured</span>
                  <span className="ml-4 flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {blogPosts[0].date}
                  </span>
                  <span className="ml-4 flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {blogPosts[0].readTime}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                  {blogPosts[0].title}
                </h2>
                <p className="text-lg text-gray-600 mb-6">
                  {blogPosts[0].excerpt}
                </p>
                <Link 
                  href="/resources/blog/first-100-reddit-leads"
                  className="inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold text-lg"
                >
                  Read Full Article
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Blog Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { post: blogPosts[1], href: "/resources/blog/ultimate-reddit-marketing-strategy" },
              { post: blogPosts[2], href: "/resources/blog/ai-powered-vs-manual-research" },
              { post: blogPosts[3], href: "/resources/blog/reddit-communities-for-saas-founders" },
              { post: blogPosts[4], href: "/resources/blog/cold-email-to-warm-conversations" },
              { post: blogPosts[5], href: "/resources/blog/reddit-seo-optimization" },
              { post: blogPosts[6], href: "/resources/blog/reddit-marketing-automation" },
              { post: blogPosts[7], href: "/resources/blog/reddit-subreddit-monitoring" },
              { post: blogPosts[8], href: "/resources/blog/reddit-outreach-best-practices" },
              { post: blogPosts[9], href: "/resources/blog/reddit-marketing-roi" },
              { post: blogPosts[10], href: "/resources/blog/reddit-lead-qualification" }
            ].map((item, index) => (
              <Link 
                key={index}
                href={item.href}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow p-6"
              >
                <div className="text-6xl mb-4">{item.post.image}</div>
                <div className="flex items-center mb-3 text-sm text-gray-500">
                  <Calendar className="w-4 h-4 mr-2" />
                  {item.post.date}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{item.post.title}</h3>
                <p className="text-gray-600 mb-4">{item.post.excerpt}</p>
                <div className="flex items-center justify-between">
                  <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                    {item.post.category}
                  </span>
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="w-4 h-4 mr-1" />
                    {item.post.readTime}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Resources Section */}
      <section className="py-16 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Other Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link href="/resources/templates" className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 hover:shadow-xl transition-shadow border border-blue-200">
              <div className="text-5xl mb-4">📝</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Marketing Templates</h3>
              <p className="text-gray-600 mb-4">Free templates to help you find leads and engage with prospects</p>
              <div className="text-blue-600 font-semibold">View Templates →</div>
            </Link>

            <Link href="/resources/roi-calculator" className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 hover:shadow-xl transition-shadow border border-green-200">
              <div className="text-5xl mb-4">💰</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">ROI Calculator</h3>
              <p className="text-gray-600 mb-4">Calculate how much time and money you can save with Truleado</p>
              <div className="text-green-600 font-semibold">Try Calculator →</div>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Start Finding Reddit Leads Today
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join hundreds of SaaS founders discovering high-quality leads on Reddit
          </p>
          <Link 
            href="/auth/signup"
            className="inline-flex items-center bg-white text-blue-600 px-8 py-4 rounded-2xl text-lg font-semibold hover:bg-gray-100 transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
          >
            Start Free Trial
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}

