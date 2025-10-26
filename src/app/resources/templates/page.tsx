'use client'

import Link from 'next/link'
import { ArrowRight, Download, CheckCircle, MessageSquare, Mail, FileEdit, FileText } from 'lucide-react'
import { PublicHeader } from '@/components/PublicHeader'

const templates = [
  {
    title: "Reddit Outreach Message Template",
    description: "A proven template for reaching out to Reddit leads that gets responses. Includes subject lines, opening hooks, and call-to-actions.",
    category: "Outreach",
    downloads: "2.3K",
    icon: <MessageSquare className="w-8 h-8" />,
    color: "from-blue-500 to-blue-600"
  },
  {
    title: "Reddit Lead Tracking Spreadsheet",
    description: "Organize and track your Reddit leads with this comprehensive spreadsheet template. Track outreach, responses, and conversions.",
    category: "Tracking",
    downloads: "1.8K",
    icon: <FileText className="w-8 h-8" />,
    color: "from-green-500 to-green-600"
  },
  {
    title: "SaaS Product Research Template",
    description: "Systematically analyze competitor websites and extract key insights. Perfect for finding what your target audience values most.",
    category: "Research",
    downloads: "3.1K",
    icon: <FileEdit className="w-8 h-8" />,
    color: "from-purple-500 to-purple-600"
  },
  {
    title: "Reddit Community Engagement Plan",
    description: "A 30-day plan to build credibility in Reddit communities before promoting your product. Includes content calendar and engagement strategies.",
    category: "Marketing",
    downloads: "1.5K",
    icon: <MessageSquare className="w-8 h-8" />,
    color: "from-orange-500 to-orange-600"
  },
  {
    title: "Customer Pain Point Research Template",
    description: "Systematically identify and document customer pain points from Reddit discussions. Build your product roadmap based on real data.",
    category: "Research",
    downloads: "2.7K",
    icon: <FileText className="w-8 h-8" />,
    color: "from-indigo-500 to-indigo-600"
  },
  {
    title: "Reddit AMA Preparation Kit",
    description: "Everything you need to host a successful Reddit AMA. Includes preparation checklist, talking points, and engagement strategies.",
    category: "Strategy",
    downloads: "950",
    icon: <Mail className="w-8 h-8" />,
    color: "from-pink-500 to-pink-600"
  }
]

export default function TemplatesPage() {
  const { t } = useI18n()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <PublicHeader />

      {/* Hero Section */}
      <section className="py-12 sm:py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Free Reddit Marketing Templates
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Ready-to-use templates, spreadsheets, and guides to help you find and convert Reddit leads like a pro
            </p>
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {templates.map((template, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow p-6">
                <div className={`w-16 h-16 bg-gradient-to-r ${template.color} rounded-xl flex items-center justify-center text-white mb-4`}>
                  {template.icon}
                </div>
                <div className="mb-3">
                  <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
                    {template.category}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {template.title}
                </h3>
                <p className="text-gray-600 mb-4">
                  {template.description}
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center text-sm text-gray-500">
                    <Download className="w-4 h-4 mr-1" />
                    {template.downloads} downloads
                  </div>
                  <button className="inline-flex items-center text-blue-600 font-semibold hover:text-blue-700 text-sm">
                    Download Free
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Benefits Section */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl p-8 sm:p-12 text-white mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center">
              Why Use Our Templates?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                <CheckCircle className="w-8 h-8 mb-3" />
                <h3 className="text-xl font-bold mb-2">Proven Methods</h3>
                <p className="text-blue-100">Based on actual successful campaigns from real SaaS founders</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                <CheckCircle className="w-8 h-8 mb-3" />
                <h3 className="text-xl font-bold mb-2">Save Time</h3>
                <p className="text-blue-100">Ready-to-use templates that save hours of research and planning</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                <CheckCircle className="w-8 h-8 mb-3" />
                <h3 className="text-xl font-bold mb-2">Better Results</h3>
                <p className="text-blue-100">Higher conversion rates with templates designed to get responses</p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              Want More Resources?
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              Access all templates, tutorials, and exclusive guides with Truleado
            </p>
            <Link 
              href="/auth/signup" 
              className="inline-flex items-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-2xl text-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-xl"
            >
              Get Started Free
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

