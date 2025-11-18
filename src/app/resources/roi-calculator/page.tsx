'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, DollarSign, Clock, TrendingUp } from 'lucide-react'
import { PublicHeader } from '@/components/PublicHeader'
import { Footer } from '@/components/Footer'

export default function ROICalculatorPage() {
  const [hoursSpent, setHoursSpent] = useState(10)
  const [hourlyRate, setHourlyRate] = useState(50)

  const monthlyHours = hoursSpent * 4
  const monthlyCost = monthlyHours * hourlyRate
  const annualCost = monthlyCost * 12
  const truleadoCost = 29
  const monthlySavings = monthlyCost - truleadoCost
  const annualSavings = annualCost - (truleadoCost * 12)
  const roiPercentage = ((monthlySavings / truleadoCost) * 100).toFixed(0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <PublicHeader />

      {/* Hero Section */}
      <section className="py-12 sm:py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Reddit Marketing ROI Calculator
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              See how much time and money you can save by using Truleado for Reddit lead generation
            </p>
          </div>

          {/* Calculator */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-12 mb-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Hours spent on lead research per week
                </label>
                <input
                  type="number"
                  value={hoursSpent}
                  onChange={(e) => setHoursSpent(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  min="1"
                  max="40"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Your hourly rate ($)
                </label>
                <input
                  type="number"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  min="20"
                  max="200"
                />
              </div>
            </div>

            {/* Results */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 pt-8 border-t border-gray-200">
              <div className="bg-blue-50 rounded-2xl p-6">
                <div className="flex items-center mb-3">
                  <Clock className="w-8 h-8 text-blue-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900">Time Cost</h3>
                </div>
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  ${monthlyCost.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">per month</div>
              </div>

              <div className="bg-green-50 rounded-2xl p-6">
                <div className="flex items-center mb-3">
                  <DollarSign className="w-8 h-8 text-green-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900">Truleado Cost</h3>
                </div>
                <div className="text-3xl font-bold text-green-600 mb-1">
                  ${truleadoCost}
                </div>
                <div className="text-sm text-gray-600">per month</div>
              </div>

              <div className="bg-purple-50 rounded-2xl p-6">
                <div className="flex items-center mb-3">
                  <TrendingUp className="w-8 h-8 text-purple-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900">You Save</h3>
                </div>
                <div className="text-3xl font-bold text-purple-600 mb-1">
                  ${monthlySavings.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">per month ({(monthlySavings / truleadoCost).toFixed(1)}x ROI)</div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 border-2 border-green-200">
              <div className="text-center">
                <div className="text-5xl font-bold text-green-600 mb-2">
                  {roiPercentage}%
                </div>
                <div className="text-xl font-semibold text-gray-900 mb-1">Return on Investment</div>
                <div className="text-gray-600">
                  Save ${annualSavings.toLocaleString()} per year by using Truleado
                </div>
              </div>
            </div>
          </div>

          {/* Related Resources */}
          <div className="bg-gray-50 rounded-3xl p-8 mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Learn More</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link href="/resources/blog/ai-powered-vs-manual-research" className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition-shadow">
                <h4 className="text-lg font-bold text-gray-900 mb-2">AI vs Manual Lead Research</h4>
                <p className="text-gray-600 text-sm">Detailed comparison of AI-powered and manual research methods</p>
              </Link>
              <Link href="/resources/blog/first-100-reddit-leads" className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition-shadow">
                <h4 className="text-lg font-bold text-gray-900 mb-2">How to Find Your First 100 Reddit Leads</h4>
                <p className="text-gray-600 text-sm">Complete guide to finding and converting Reddit opportunities</p>
              </Link>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-12 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Start Saving Time & Money Today
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join hundreds of SaaS founders who are already saving {hoursSpent} hours per week with Truleado
            </p>
            <Link 
              href="/auth/signup"
              className="inline-flex items-center bg-white text-blue-600 px-8 py-4 rounded-2xl text-lg font-semibold hover:bg-gray-100 transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
            >
              Start Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}

