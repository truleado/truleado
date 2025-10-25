'use client'

import AppLayout from '@/components/app-layout'
import { Plane } from 'lucide-react'

export default function PilotPage() {
  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center">
                <Plane className="h-6 w-6 text-blue-600 mr-3" />
                <h1 className="text-2xl font-bold text-gray-900">Pilot</h1>
              </div>
              <p className="mt-2 text-gray-600">
                Pilot features and experiments
              </p>
            </div>
            
            <div className="p-6">
              <div className="text-center py-12">
                <Plane className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Coming Soon</h3>
                <p className="text-gray-500">Pilot features will be available here soon.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
