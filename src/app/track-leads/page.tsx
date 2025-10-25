'use client'

import AppLayout from '@/components/app-layout'
import { BarChart3 } from 'lucide-react'

export default function TrackLeadsPage() {
  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center mb-2">
              <BarChart3 className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-3xl font-bold text-gray-900">Track Leads</h1>
            </div>
            <p className="text-gray-600 text-lg">Track and monitor lead performance</p>
          </div>

          {/* Blank Content */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Track Leads Page</h3>
            <p className="text-gray-600">This page is currently under development.</p>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
