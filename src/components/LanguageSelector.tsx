'use client'

import { useState } from 'react'
import { useI18n, languages } from '@/contexts/i18n-context'
import { ChevronDown } from 'lucide-react'

export function LanguageSelector() {
  const { language, setLanguage } = useI18n()
  const [isOpen, setIsOpen] = useState(false)

  const currentLang = languages[language]

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium text-gray-700"
        type="button"
      >
        <span className="text-base">{currentLang.flag}</span>
        <span className="hidden sm:inline">{currentLang.name}</span>
        <ChevronDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-20 max-h-96 overflow-y-auto">
            <div className="p-2">
              {Object.entries(languages).map(([code, lang]) => (
                <button
                  key={code}
                  onClick={() => {
                    setLanguage(code as any)
                    setIsOpen(false)
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    language === code
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  type="button"
                >
                  <span className="text-xl">{lang.flag}</span>
                  <span className="flex-1 text-left font-medium">{lang.name}</span>
                  {language === code && (
                    <span className="text-blue-600">✓</span>
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

