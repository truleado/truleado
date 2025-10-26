'use client'

import AppLayout from '@/components/app-layout'
import { useRouter } from 'next/navigation'
import { Target, TrendingUp, FileText, CheckCircle } from 'lucide-react'

export default function StrategyPage() {
  const router = useRouter()

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900">Reddit Growth Strategy</h1>
            </div>
          </div>

          {/* Main Content Note */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-8 mb-8">
            <p className="text-lg text-gray-700 leading-relaxed">
              <strong>Truleado</strong> will help you on Reddit by following best practices and without appearing spammy. We will help you build karma by sharing valuable posts and we will also help you in creating and sharing content on relevant subreddits that will guarantee high quality traffic on your website.
            </p>
          </div>

          {/* Best Practices */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Best Practices to Grow on Reddit</h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Provide Genuine Value</h3>
                  <p className="text-gray-600">Answer questions and solve problems, not just promoting your product</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Follow the 90/10 Rule</h3>
                  <p className="text-gray-600">90% helpful content, only 10% self-promotion</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Read Subreddit Rules Carefully</h3>
                  <p className="text-gray-600">Tailor your approach to each community's specific guidelines</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Build Relationships First</h3>
                  <p className="text-gray-600">Engage in discussions and build trust before promoting</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Be Transparent</h3>
                  <p className="text-gray-600">Always disclose affiliations and sponsored content to maintain trust</p>
                </div>
              </div>
            </div>
          </div>

          {/* Get Started Button */}
          <div className="text-center">
            <button
              onClick={() => router.push('/promote/earn-karma')}
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-lg font-semibold rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Get Started
              <TrendingUp className="ml-2 w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

