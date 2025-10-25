'use client'

import { useState } from 'react'
import AppLayout from '@/components/app-layout'
import { Plane, Search, Globe } from 'lucide-react'

export default function PilotPage() {
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<any>(null)

  const handleAnalyze = async () => {
    if (!websiteUrl.trim()) {
      alert('Please enter a website URL')
      return
    }

    setIsAnalyzing(true)
    setAnalysisResult(null)

    try {
      const response = await fetch('/api/pilot/analyze-keywords', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          website: websiteUrl.trim()
        })
      })

      if (response.ok) {
        const data = await response.json()
        setAnalysisResult(data)
      } else {
        const errorData = await response.json()
        setAnalysisResult({
          error: errorData.error || 'Analysis failed',
          details: errorData.details
        })
      }
    } catch (error) {
      setAnalysisResult({
        error: 'Network error',
        details: error.message
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
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
              {/* Website Analysis Section */}
              <div className="max-w-2xl mx-auto">
                <div className="text-center mb-8">
                  <Globe className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Website Keyword Analysis</h2>
                  <p className="text-gray-600">Enter a website URL to analyze and extract the 3 most relevant keywords</p>
                </div>

                {/* Input Box */}
                <div className="mb-6">
                  <label htmlFor="website-url" className="block text-sm font-medium text-gray-700 mb-2">
                    Website URL
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Globe className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="url"
                      id="website-url"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm placeholder-gray-500"
                      disabled={isAnalyzing}
                    />
                  </div>
                </div>

                {/* Analyze Button */}
                <div className="text-center">
                  <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || !websiteUrl.trim()}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Search className="h-5 w-5 mr-2" />
                        Analyse
                      </>
                    )}
                  </button>
                </div>

                {/* Analysis Results */}
                {analysisResult && (
                  <div className="mt-8 bg-gray-50 rounded-lg p-6">
                    {analysisResult.error ? (
                      <div className="text-center">
                        <div className="text-red-600 mb-2">
                          <svg className="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-medium text-red-900 mb-2">Analysis Failed</h3>
                        <p className="text-red-700 mb-2">{analysisResult.error}</p>
                        {analysisResult.details && (
                          <p className="text-red-600 text-sm">{analysisResult.details}</p>
                        )}
                      </div>
                    ) : (
                      <div>
                        <div className="text-center mb-6">
                          <div className="text-green-600 mb-2">
                            <svg className="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-medium text-green-900 mb-2">Analysis Complete</h3>
                          <p className="text-green-700">Successfully analyzed the website</p>
                        </div>

                        {analysisResult.keywords && (
                          <div className="space-y-6">
                            <div className="text-center">
                              <h4 className="text-lg font-semibold text-gray-900 mb-4">Top 3 Keywords</h4>
                              <p className="text-gray-600 mb-6">The most relevant keywords that define this website:</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {analysisResult.keywords.map((keyword: string, index: number) => (
                                <div key={index} className="bg-white rounded-lg p-6 border border-gray-200 text-center hover:shadow-md transition-shadow">
                                  <div className="flex items-center justify-center mb-3">
                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                      <span className="text-blue-600 font-bold text-sm">{index + 1}</span>
                                    </div>
                                  </div>
                                  <h5 className="font-semibold text-gray-900 text-lg mb-2">{keyword}</h5>
                                  <p className="text-gray-600 text-sm">
                                    {analysisResult.explanations && analysisResult.explanations[index] 
                                      ? analysisResult.explanations[index]
                                      : `Key term #${index + 1} for this website`
                                    }
                                  </p>
                                </div>
                              ))}
                            </div>

                            {analysisResult.summary && (
                              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                <h5 className="font-semibold text-blue-900 mb-2">Analysis Summary</h5>
                                <p className="text-blue-800 text-sm">{analysisResult.summary}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
