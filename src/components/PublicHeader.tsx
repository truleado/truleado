'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { LanguageSelector } from '@/components/LanguageSelector'
import { ResourcesDropdown } from '@/components/ResourcesDropdown'
import { pricingTranslations } from '@/lib/pricing-translations'
import type { Locale } from '@/lib/translations'
import { locales } from '@/lib/translations'
import { Menu, X, FileText, BookOpen, Calculator } from 'lucide-react'

export function PublicHeader() {
  const pathname = usePathname()
  const [locale, setLocale] = useState<Locale>('en')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  const getCookieLocale = (): Locale => {
    const cookieLocale = document.cookie
      .split('; ')
      .find(row => row.startsWith('NEXT_LOCALE='))
      ?.split('=')[1] as Locale
    
    if (cookieLocale && locales.includes(cookieLocale)) {
      return cookieLocale
    }
    return 'en'
  }
  
  const updateLocale = () => {
    // First, check if we're on a locale-aware page
    const pathLocale = pathname.split('/')[1]
    const isLocale = locales.includes(pathLocale as Locale)
    
    let newLocale: Locale = 'en'
    
    if (isLocale) {
      // We're on a locale-specific page, use the locale from URL
      newLocale = pathLocale as Locale
    } else {
      // We're on a non-locale page (like /resources/*), use cookie
      newLocale = getCookieLocale()
    }
    
    setLocale(newLocale)
  }
  
  useEffect(() => {
    updateLocale()
    
    // Listen for storage/cookie changes (when language is changed)
    const handleStorageChange = () => {
      updateLocale()
    }
    window.addEventListener('storage', handleStorageChange)
    
    // Poll for cookie changes since cookie changes don't trigger storage events
    // Check every 200ms for better responsiveness
    const interval = setInterval(updateLocale, 200)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [pathname])
  
  // Get translations
  const t = pricingTranslations[locale as keyof typeof pricingTranslations] || pricingTranslations.en

  return (
    <>
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href={`/${locale}`} className="flex items-center">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center shadow-lg">
                <img src="/truleadologo.png" alt="Truleado" className="w-full h-full object-contain" />
              </div>
              <span className="ml-2 sm:ml-3 text-lg sm:text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Truleado</span>
            </Link>
            <div className="hidden sm:flex items-center space-x-2 lg:space-x-3">
              {/* Language selector as first option */}
              <LanguageSelector />
              
              <div className="w-px h-6 bg-gray-300 mx-2" />
              
              <ResourcesDropdown />
              <Link 
                href={`/${locale}/pricing`}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
              >
                {t.nav.pricing || 'Pricing'}
              </Link>
              <Link 
                href="/auth/signin"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
              >
                {t.nav.signIn}
              </Link>
              <Link 
                href="/auth/signup"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 lg:px-6 py-2 lg:py-2.5 rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {t.nav.getStarted}
              </Link>
            </div>
            {/* Mobile menu button */}
            <div className="sm:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-600 hover:text-gray-900 p-2"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden fixed inset-x-0 top-16 bg-white shadow-lg border-b border-gray-200 z-40 max-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="px-4 py-4 space-y-3">
            <LanguageSelector />
            
            {/* Resources section */}
            <div className="pt-2 border-t border-gray-200">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-3">
                Resources
              </div>
              <Link 
                href="/resources/blog"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-3 px-3 py-2 text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors rounded-lg hover:bg-gray-50"
              >
                <FileText className="w-4 h-4" />
                <span>Blog</span>
              </Link>
              <Link 
                href="/resources/templates"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-3 px-3 py-2 text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors rounded-lg hover:bg-gray-50"
              >
                <BookOpen className="w-4 h-4" />
                <span>Templates</span>
              </Link>
              <Link 
                href="/resources/roi-calculator"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-3 px-3 py-2 text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors rounded-lg hover:bg-gray-50"
              >
                <Calculator className="w-4 h-4" />
                <span>ROI Calculator</span>
              </Link>
            </div>
            
            <div className="pt-2 border-t border-gray-200">
              <Link 
                href={`/${locale}/pricing`}
                onClick={() => setMobileMenuOpen(false)}
                className="block text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors rounded-lg hover:bg-gray-50"
              >
                {t.nav.pricing || 'Pricing'}
              </Link>
              <Link 
                href="/auth/signin"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors rounded-lg hover:bg-gray-50"
              >
                {t.nav.signIn}
              </Link>
              <Link 
                href="/auth/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="block bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 text-center mt-2"
              >
                {t.nav.getStarted}
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

