'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Calculator, TrendingUp, DollarSign, Clock, Users } from 'lucide-react'
import { useI18n } from '@/contexts/i18n-context'
import { LanguageSelector } from '@/components/LanguageSelector'

export default function ROICalculatorPage() {
  const { t } = useI18n()
  const [hours, setHours] = useState(10)
  const [rate, setRate] = useState(50)
  const [leadsFound, setLeadsFound] = useState(20)
  const [conversionRate, setConversionRate] = useState(10)

  const timeCost = hours * rate
  const traditionalMonthlyCost = timeCost * 20 // assuming 20 work days
  const toolCost = 29
  const savings = traditionalMonthlyCost - toolCost

  const monthlyLeads = leadsFound * 20
  const monthlyConversions = (monthlyLeads * conversionRate) / 100
  const estimatedRevenue = monthlyConversions * 100 // Assuming $100 per conversion

  const roi = ((estimatedRevenue - toolCost) / toolCost) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center">
              <div className="w-8 h-8 rounded-2xl flex items-center justify-center shadow-lg">
                <img src="/truleadologo.png" alt="Truleado" className="w-full h-full object-contain" />
              </div>
              <span className="ml-2 sm:ml-3 text-lg sm:text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Truleado</span>
            </Link>
            <div className="hidden sm:flex items-center space-x-4 lg:space-x-6">
              <LanguageSelector />
              <Link 
                href="/resources/roi-calculator" 
                className="text-blue-600 font-semibold px-3 py-2 text-sm font-medium transition-colors"
              >
                Resources
              </Link>
              <Link 
                href="/" 
                className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
              >
                Home
              </Link>
              <Link 
                href="/auth/signup" 
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 lg:px-6 py-2 lg:py-2.5 rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-12 sm:py-16 md:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mb-4">
              <Calculator className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Reddit Marketing ROI Calculator
            </h1>
            <p className="text-lg sm:text-xl text-gray-600">
              Calculate the return on investment for using Truleado vs. manual lead research
            </p>
          </div>

          {/* Calculator */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 mb-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Hours per day spent on manual research
                </label>
                <input
                  type="number"
                  value={hours}
                  onChange={(e) => setHours(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Hourly rate / opportunity cost ($)
                </label>
                <input
                  type="number"
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Leads found per day (manual)
                </label>
                <input
                  type="number"
                  value={leadsFound}
                  onChange={(e) => setLeadsFound(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Conversion rate (%)
                </label>
                <input
                  type="number"
                  value={conversionRate}
                  onChange={(e) => setConversionRate(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Results */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                <div className="flex items-center mb-3">
                  <Clock className="w-6 h-6 text-blue-600 mr-2" />
                  <span className="text-sm font-semibold text-gray-700">Monthly Time Cost</span>
                </div>
                <div className="text-3xl font-bold text-blue-600">${traditionalMonthlyCost.toLocaleString()}</div>
                <p className="text-xs text-gray-600 mt-1">Manual research cost per month</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
                <div className="flex items-center mb-3">
                  <DollarSign className="w-6 h-6 text-green-600 mr-2" />
                  <span className="text-sm font-semibold text-gray-700">Monthly Savings</span>
                </div>
                <div className="text-3xl font-bold text-green-600">${savings.toLocaleString()}</div>
                <p className="text-xs text-gray-600 mt-1">With Truleado ($29/month)</p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
                <div className="flex items-center mb-3">
                  <TrendingUp className="w-6 h-6 text-purple-600 mr-2" />
                  <span className="text-sm font-semibold text-gray-700">Estimated ROI</span>
                </div>
                <div className="text-3xl font-bold text-purple-600">+{roi.toFixed(0)}%</div>
                <p className="text-xs text-gray-600 mt-1">Return on investment</p>
              </div>
            </div>

            <div className="mt-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-blue-100 mb-1">Potential Monthly Revenue</div>
                  <div className="text-3xl font-bold">${estimatedRevenue.toLocaleString()}</div>
                  <div className="text-sm text-blue-100 mt-1">from {monthlyLeads} leads / {monthlyConversions.toFixed(1)} conversions</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-blue-100 mb-1">Tool Cost</div>
                  <div className="text-3xl font-bold">$29</div>
                  <div className="text-sm text-blue-100 mt-1">per month</div>
                </div>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="bg-white rounded-3xl shadow-xl p-8 mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Why Truleado is Worth It</h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0 mr-4">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">10x More Leads</h3>
                  <p className="text-gray-600">Find leads in minutes that would take hours of manual research</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 mr-4">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Save 20+ Hours Weekly</h3>
                  <p className="text-gray-600">Automate your lead research and focus on building relationships</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0 mr-4">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Higher Conversion Rates</h3>
                  <p className="text-gray-600">AI-powered insights help you reach out at the right time with the right message</p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-12 text-white">
              <h2 className="text-3xl font-bold mb-4">Ready to Start Saving Time and Finding Better Leads?</h2>
              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                Join hundreds of SaaS founders using Truleado to find quality leads faster
              </p>
              <Link 
                href="/auth/signup" 
                className="inline-flex items-center bg-white text-blue-600 px-8 py-4 rounded-2xl text-lg font-semibold hover:bg-gray-100 transition-all duration-200 shadow-xl hover:shadow-2xl"
              >
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

