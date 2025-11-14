'use client'

export const dynamic = 'force-dynamic'

import { Mail, HelpCircle } from 'lucide-react'
import AppLayout from '@/components/app-layout'

export default function Help() {
  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <HelpCircle className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Need Help?</h1>
          </div>

          <div className="space-y-4">
            <p className="text-gray-600 text-lg">
              For any help or support, please email us
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Mail className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Contact Support</h2>
              </div>
              
              <div className="space-y-3">
                <p className="text-gray-700">
                  Email us at:
                </p>
                <a 
                  href="mailto:truleado@gmail.com" 
                  className="text-blue-600 hover:text-blue-800 font-medium text-lg break-all inline-block"
                >
                  truleado@gmail.com
                </a>
                <p className="text-gray-600 text-sm mt-4">
                  We'll respond to your inquiry as soon as possible. Thank you for using Truleado!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
