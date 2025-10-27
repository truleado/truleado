'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { locales, localeNames, localeFlags, type Locale } from '@/lib/translations'
import { ChevronDown } from 'lucide-react'

export function LanguageSelector() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentLocale, setCurrentLocale] = useState<Locale>('en')
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Extract locale from pathname (/en/, /fr/, etc.)
    const localeFromPath = pathname.split('/')[1]
    if (localeFromPath && locales.includes(localeFromPath as Locale)) {
      setCurrentLocale(localeFromPath as Locale)
    }
  }, [pathname])

  const handleLanguageChange = (newLocale: Locale) => {
    setIsOpen(false)
    
    // Check if we're on a locale-specific page
    const pathParts = pathname.split('/')
    const firstSegment = pathParts[1]
    const isLocalePage = locales.includes(firstSegment as Locale)
    
    let newPath: string
    
    if (isLocalePage) {
      // On a locale page (e.g., /en/pricing)
      const pathWithoutLocale = '/' + pathParts.slice(2).join('/')
      newPath = `/${newLocale}${pathWithoutLocale === '/' ? '' : pathWithoutLocale}`
    } else {
      // On a non-locale page (e.g., /resources/blog)
      // Just navigate to homepage of new language, or preserve path
      // For now, let's go to homepage with new locale
      newPath = `/${newLocale}`
    }
    
    router.push(newPath)
    
    // Save to cookie
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Select language"
      >
        <span className="text-xl">{localeFlags[currentLocale]}</span>
        <span className="hidden sm:inline text-sm font-medium text-gray-700">
          {localeNames[currentLocale].split(' ')[0]}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-20">
            <div className="p-2">
              {locales.map((locale) => (
                <button
                  key={locale}
                  onClick={() => handleLanguageChange(locale)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    currentLocale === locale 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'hover:bg-gray-50 text-gray-900'
                  }`}
                >
                  <span className="text-xl">{localeFlags[locale]}</span>
                  <span className="text-sm font-medium">{localeNames[locale]}</span>
                  {currentLocale === locale && (
                    <span className="ml-auto">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
