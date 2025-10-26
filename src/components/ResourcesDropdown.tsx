'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown, FileText, Calculator, BookOpen, HelpCircle, Video } from 'lucide-react'

export function ResourcesDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  
  const resources = [
    { name: 'Blog', href: '/resources/blog', icon: <FileText className="w-4 h-4" />, description: 'Reddit marketing guides & tips' },
    { name: 'Templates', href: '/resources/templates', icon: <BookOpen className="w-4 h-4" />, description: 'Free marketing templates' },
    { name: 'ROI Calculator', href: '/resources/roi-calculator', icon: <Calculator className="w-4 h-4" />, description: 'Calculate your ROI' },
    { name: 'Help Center', href: '/resources/help', icon: <HelpCircle className="w-4 h-4" />, description: 'Get help & support' },
  ]

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
        type="button"
      >
        <span>Resources</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-20">
            <div className="p-2">
              {resources.map((resource) => (
                <Link
                  key={resource.name}
                  href={resource.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-start space-x-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 group-hover:bg-blue-200 transition-colors flex-shrink-0">
                    {resource.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 group-hover:text-blue-600">
                      {resource.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {resource.description}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

