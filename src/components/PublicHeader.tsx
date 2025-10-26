'use client'

import Link from 'next/link'
import { LanguageSelector } from '@/components/LanguageSelector'
import { ResourcesDropdown } from '@/components/ResourcesDropdown'

export function PublicHeader() {
  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center shadow-lg">
              <img src="/truleadologo.png" alt="Truleado" className="w-full h-full object-contain" />
            </div>
            <span className="ml-2 sm:ml-3 text-lg sm:text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Truleado</span>
          </Link>
          <div className="hidden sm:flex items-center space-x-4 lg:space-x-6">
            <LanguageSelector />
            <ResourcesDropdown />
            <Link 
              href="/pricing" 
              className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
            >
              Pricing
            </Link>
            <Link 
              href="/auth/signin" 
              className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
            >
              Sign In
            </Link>
            <Link 
              href="/auth/signup" 
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 lg:px-6 py-2 lg:py-2.5 rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Get Started
            </Link>
          </div>
          {/* Mobile menu button */}
          <div className="sm:hidden flex items-center space-x-2">
            <LanguageSelector />
          </div>
        </div>
      </div>
    </nav>
  )
}

