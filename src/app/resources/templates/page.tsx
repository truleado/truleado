'use client'

export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { ArrowRight, Download, FileText, Mail, MessageSquare } from 'lucide-react'
import { PublicHeader } from '@/components/PublicHeader'

const templates = [
  {
    title: "Reddit Outreach Template",
    description: "A proven template for reaching out to leads discovered on Reddit",
    category: "Outreach",
    icon: <Mail className="w-8 h-8" />,
    downloads: "2.5K"
  },
  {
    title: "Product Research Worksheet",
    description: "Systematically analyze competitor products and find opportunities",
    category: "Research",
    icon: <FileText className="w-8 h-8" />,
    downloads: "1.8K"
  },
  {
    title: "Lead Qualification Checklist",
    description: "Identify high-quality leads worth your time to pursue",
    category: "Sales",
    icon: <Download className="w-8 h-8" />,
    downloads: "3.2K"
  },
  {
    title: "Community Engagement Plan",
    description: "Build trust and credibility in Reddit communities",
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
                <p className="text-gray-600 mb-4 flex-grow">{template.description}</p>
                <div className="flex items-center justify-between">
                  <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                    {template.category}
                  </span>
                  <span className="text-sm text-gray-500">{template.downloads} downloads</span>
                </div>
              </div>
            ))}
          </div>

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

