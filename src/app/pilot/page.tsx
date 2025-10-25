'use client'

import { useState } from 'react'
import AppLayout from '@/components/app-layout'
import { Plane, Rocket, Zap, Target, TrendingUp, Users, BarChart3 } from 'lucide-react'

export default function PilotPage() {
  const [activeFeature, setActiveFeature] = useState<string | null>(null)

  const pilotFeatures = [
    {
      id: 'ai-insights',
      name: 'AI Insights Dashboard',
      description: 'Advanced AI-powered analytics and insights for your leads and products',
      icon: BarChart3,
      status: 'coming-soon',
      features: ['Real-time lead scoring', 'Predictive analytics', 'Custom AI models']
    },
    {
      id: 'automated-outreach',
      name: 'Automated Outreach',
      description: 'AI-powered automated messaging and follow-up sequences',
      icon: Zap,
      status: 'beta',
      features: ['Smart message generation', 'Follow-up automation', 'Response tracking']
    },
    {
      id: 'advanced-targeting',
      name: 'Advanced Targeting',
      description: 'Sophisticated targeting algorithms for finding the perfect leads',
      icon: Target,
      status: 'alpha',
      features: ['Behavioral analysis', 'Intent detection', 'Custom filters']
    },
    {
      id: 'team-collaboration',
      name: 'Team Collaboration',
      description: 'Collaborative features for teams working on lead generation',
      icon: Users,
      status: 'planned',
      features: ['Team workspaces', 'Shared lead pools', 'Collaborative notes']
    },
    {
      id: 'performance-analytics',
      name: 'Performance Analytics',
      description: 'Deep dive analytics on your lead generation performance',
      icon: TrendingUp,
      status: 'planned',
      features: ['Conversion tracking', 'ROI analysis', 'Performance benchmarks']
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'alpha': return 'bg-red-100 text-red-800 border-red-200'
      case 'beta': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'coming-soon': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'planned': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'alpha': return 'Alpha'
      case 'beta': return 'Beta'
      case 'coming-soon': return 'Coming Soon'
      case 'planned': return 'Planned'
      default: return 'Unknown'
    }
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center">
                <Plane className="h-6 w-6 text-blue-600 mr-3" />
                <h1 className="text-2xl font-bold text-gray-900">Pilot Features</h1>
              </div>
              <p className="mt-2 text-gray-600">
                Experimental features and upcoming innovations in development
              </p>
            </div>
          </div>

          {/* Status Legend */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
            <div className="px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Feature Status</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600">Alpha - Early testing</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600">Beta - Limited release</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600">Coming Soon - In development</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-gray-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600">Planned - Future roadmap</span>
                </div>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pilotFeatures.map((feature) => {
              const IconComponent = feature.icon
              return (
                <div
                  key={feature.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setActiveFeature(activeFeature === feature.id ? null : feature.id)}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg mr-3">
                          <IconComponent className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{feature.name}</h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(feature.status)}`}>
                            {getStatusText(feature.status)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-4">{feature.description}</p>
                    
                    {activeFeature === feature.id && (
                      <div className="border-t border-gray-200 pt-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Key Features:</h4>
                        <ul className="space-y-1">
                          {feature.features.map((feat, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-center">
                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></div>
                              {feat}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Call to Action */}
          <div className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-sm">
            <div className="px-6 py-8 text-center">
              <Rocket className="h-12 w-12 text-white mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Want to be a Pilot User?</h3>
              <p className="text-blue-100 mb-4">
                Get early access to new features and help shape the future of Truleado
              </p>
              <button className="bg-white text-blue-600 px-6 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                Join Pilot Program
              </button>
            </div>
          </div>

          {/* Development Notes */}
          <div className="mt-8 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="px-6 py-4">
              <h4 className="font-medium text-yellow-900 mb-2">Development Notes:</h4>
              <ul className="text-yellow-800 text-sm space-y-1">
                <li>• Pilot features are experimental and may change frequently</li>
                <li>• Some features require special access permissions</li>
                <li>• Feedback and bug reports are highly appreciated</li>
                <li>• Features in Alpha/Beta may have limited functionality</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
