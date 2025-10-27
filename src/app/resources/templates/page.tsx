'use client'

export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { ArrowRight, Download, FileText, Mail, MessageSquare } from 'lucide-react'
import { PublicHeader } from '@/components/PublicHeader'

const templates = [
  {
    id: 'reddit-outreach',
    title: "Reddit Outreach Template",
    description: "4 proven templates for reaching out to leads discovered on Reddit",
    category: "Outreach",
    icon: <Mail className="w-8 h-8" />,
    downloads: "2.5K"
  },
  {
    id: 'lead-qualification',
    title: "Lead Qualification Checklist",
    description: "Identify high-quality leads worth your time to pursue",
    category: "Sales",
    icon: <Download className="w-8 h-8" />,
    downloads: "3.2K"
  },
  {
    id: 'product-research',
    title: "Product Research Worksheet",
    description: "Systematically map your product positioning for Reddit",
    category: "Research",
    icon: <FileText className="w-8 h-8" />,
    downloads: "1.8K"
  },
  {
    id: 'community-engagement',
    title: "Community Engagement Plan",
    description: "30-day roadmap to build trust in Reddit communities",
    category: "Marketing",
    icon: <MessageSquare className="w-8 h-8" />,
    downloads: "1.5K"
  }
]

export default function TemplatesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <PublicHeader />

      {/* Hero Section */}
      <section className="py-12 sm:py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Free Marketing Templates
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Proven templates and tools to help you discover leads, engage with prospects, and grow your SaaS business on Reddit
            </p>
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {templates.map((template, index) => (
              <div 
                key={index}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow p-6 flex flex-col"
              >
                <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-4">
                  {template.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{template.title}</h3>
                <p className="text-gray-600 mb-4 flex-grow text-sm">{template.description}</p>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                      {template.category}
                    </span>
                    <span className="text-sm text-gray-500">{template.downloads}</span>
                  </div>
                  <a
                    href={`/api/templates/download?template=${template.id}`}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download Free
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Templates Details Section */}
          <section className="mb-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl p-8 border border-gray-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Why Use These Templates?</h3>
                <p className="text-gray-600 mb-4">
                  These templates are based on proven strategies from SaaS founders who have successfully grown their businesses using Reddit lead generation. They help you:
                </p>
                <ul className="space-y-2 text-gray-600">
                  <li>✓ Engage authentically without being spammy</li>
                  <li>✓ Save hours of research and writing time</li>
                  <li>✓ Avoid common mistakes that get you banned</li>
                  <li>✓ Build genuine relationships with prospects</li>
                  <li>✓ Qualify leads before investing time</li>
                </ul>
              </div>

              <div className="bg-white rounded-2xl p-8 border border-gray-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">How to Use These Templates</h3>
                <p className="text-gray-600 mb-4">
                  These are starting points, not scripts. Customize them for your specific:
                </p>
                <ul className="space-y-2 text-gray-600">
                  <li>✓ Your product's unique value proposition</li>
                  <li>✓ Your target customer's specific needs</li>
                  <li>✓ The context of each conversation</li>
                  <li>✓ Your authentic voice and personality</li>
                  <li>✓ Reddit's community culture and rules</li>
                </ul>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-12 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Start Using These Templates Today
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join hundreds of SaaS founders using these proven templates to find and convert Reddit leads
            </p>
            <Link 
              href="/auth/signup"
              className="inline-flex items-center bg-white text-blue-600 px-8 py-4 rounded-2xl text-lg font-semibold hover:bg-gray-100 transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
            >
              Get Started for Free
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

