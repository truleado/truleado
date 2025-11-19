'use client'

import { useState } from 'react'
import AppLayout from '@/components/app-layout'
import { Globe, Search, CheckCircle2, XCircle, AlertCircle, TrendingUp, FileText, Zap, Star, Sparkles } from 'lucide-react'

export default function WebsiteAnalyzerPage() {
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleAnalyze = async () => {
    if (!websiteUrl.trim()) {
      setError('Please enter a website URL')
      return
    }

    setIsAnalyzing(true)
    setError(null)
    setAnalysisResult(null)

    try {
      const response = await fetch('/api/website-analyzer/analyze', {
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
        setError(errorData.error || 'Analysis failed')
      }
    } catch (err: any) {
      setError(err.message || 'Network error')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200'
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-green-500'
    if (score >= 60) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const analysisData = analysisResult?.success ? analysisResult.analysis : null
  const copyAnalysis = analysisData?.copyAnalysis ?? { score: null, strengths: [], weaknesses: [], recommendations: [] }
  const seoAnalysis = analysisData?.seoAnalysis ?? { score: null, strengths: [], weaknesses: [], recommendations: [] }
  const contentAnalysis = analysisData?.contentAnalysis ?? { score: null, strengths: [], weaknesses: [], recommendations: [] }
  const chatgptInsights = analysisData?.chatgptInsights ?? null

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center mb-2">
              <Globe className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-3xl font-bold text-gray-900">Website Analyzer</h1>
            </div>
            <p className="text-gray-600 text-lg">Analyze your website's copy, SEO, and content quality</p>
          </div>

          {/* Input Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
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
                    onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
                    placeholder="https://example.com"
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm placeholder-gray-500"
                    disabled={isAnalyzing}
                  />
                </div>
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !websiteUrl.trim()}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Analyze
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
              <div className="flex items-center">
                <XCircle className="h-5 w-5 text-red-600 mr-2" />
                <div>
                  <h3 className="text-sm font-semibold text-red-900">Analysis Failed</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Results Section */}
          {analysisData && (
            <div className="space-y-6">
              {/* Overall Score Card */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-sm border border-blue-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Overall Score</h2>
                    <p className="text-gray-600 text-sm mt-1">Comprehensive website analysis</p>
                  </div>
                  <div className={`flex items-center justify-center w-24 h-24 rounded-full ${getScoreBadgeColor(analysisData.overallScore ?? 0)} text-white`}>
                    <span className="text-3xl font-bold">{analysisData.overallScore ?? '—'}</span>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-gray-700 leading-relaxed">{analysisData.summary || 'No summary available.'}</p>
                </div>
                {analysisResult.metadata && (
                  <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-blue-200">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{analysisResult.metadata.contentLength.toLocaleString()}</div>
                      <div className="text-gray-600 text-sm">Characters</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{analysisResult.metadata.headingsCount}</div>
                      <div className="text-gray-600 text-sm">Headings</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{analysisResult.metadata.linksCount}</div>
                      <div className="text-gray-600 text-sm">Links</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{analysisResult.metadata.imagesCount}</div>
                      <div className="text-gray-600 text-sm">Images</div>
                    </div>
                  </div>
                )}
              </div>

          {/* Analysis Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Copy Analysis */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-purple-600 mr-2" />
                      <h3 className="text-lg font-semibold text-gray-900">Copy Analysis</h3>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-bold ${getScoreColor(copyAnalysis.score ?? 0)} border`}>
                      {copyAnalysis.score ?? '—'}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {copyAnalysis.strengths.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-green-700 mb-2 flex items-center">
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Strengths
                        </h4>
                        <ul className="space-y-1">
                          {copyAnalysis.strengths.map((strength: string, idx: number) => (
                            <li key={idx} className="text-sm text-gray-600 flex items-start">
                              <span className="text-green-500 mr-2">•</span>
                              {strength}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {copyAnalysis.weaknesses.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-red-700 mb-2 flex items-center">
                          <XCircle className="h-4 w-4 mr-1" />
                          Weaknesses
                        </h4>
                        <ul className="space-y-1">
                          {copyAnalysis.weaknesses.map((weakness: string, idx: number) => (
                            <li key={idx} className="text-sm text-gray-600 flex items-start">
                              <span className="text-red-500 mr-2">•</span>
                              {weakness}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {copyAnalysis.recommendations.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-blue-700 mb-2 flex items-center">
                          <TrendingUp className="h-4 w-4 mr-1" />
                          Recommendations
                        </h4>
                        <ul className="space-y-1">
                          {copyAnalysis.recommendations.map((rec: string, idx: number) => (
                            <li key={idx} className="text-sm text-gray-600 flex items-start">
                              <span className="text-blue-500 mr-2">→</span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* SEO Analysis */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <Zap className="h-5 w-5 text-yellow-600 mr-2" />
                      <h3 className="text-lg font-semibold text-gray-900">SEO Analysis</h3>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-bold ${getScoreColor(seoAnalysis.score ?? 0)} border`}>
                      {seoAnalysis.score ?? '—'}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {seoAnalysis.strengths.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-green-700 mb-2 flex items-center">
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Strengths
                        </h4>
                        <ul className="space-y-1">
                          {seoAnalysis.strengths.map((strength: string, idx: number) => (
                            <li key={idx} className="text-sm text-gray-600 flex items-start">
                              <span className="text-green-500 mr-2">•</span>
                              {strength}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {seoAnalysis.weaknesses.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-red-700 mb-2 flex items-center">
                          <XCircle className="h-4 w-4 mr-1" />
                          Weaknesses
                        </h4>
                        <ul className="space-y-1">
                          {seoAnalysis.weaknesses.map((weakness: string, idx: number) => (
                            <li key={idx} className="text-sm text-gray-600 flex items-start">
                              <span className="text-red-500 mr-2">•</span>
                              {weakness}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {seoAnalysis.recommendations.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-blue-700 mb-2 flex items-center">
                          <TrendingUp className="h-4 w-4 mr-1" />
                          Recommendations
                        </h4>
                        <ul className="space-y-1">
                          {seoAnalysis.recommendations.map((rec: string, idx: number) => (
                            <li key={idx} className="text-sm text-gray-600 flex items-start">
                              <span className="text-blue-500 mr-2">→</span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Content Analysis */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <Star className="h-5 w-5 text-indigo-600 mr-2" />
                      <h3 className="text-lg font-semibold text-gray-900">Content Analysis</h3>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-bold ${getScoreColor(contentAnalysis.score ?? 0)} border`}>
                      {contentAnalysis.score ?? '—'}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {contentAnalysis.strengths.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-green-700 mb-2 flex items-center">
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Strengths
                        </h4>
                        <ul className="space-y-1">
                          {contentAnalysis.strengths.map((strength: string, idx: number) => (
                            <li key={idx} className="text-sm text-gray-600 flex items-start">
                              <span className="text-green-500 mr-2">•</span>
                              {strength}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {contentAnalysis.weaknesses.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-red-700 mb-2 flex items-center">
                          <XCircle className="h-4 w-4 mr-1" />
                          Weaknesses
                        </h4>
                        <ul className="space-y-1">
                          {contentAnalysis.weaknesses.map((weakness: string, idx: number) => (
                            <li key={idx} className="text-sm text-gray-600 flex items-start">
                              <span className="text-red-500 mr-2">•</span>
                              {weakness}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {contentAnalysis.recommendations.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-blue-700 mb-2 flex items-center">
                          <TrendingUp className="h-4 w-4 mr-1" />
                          Recommendations
                        </h4>
                        <ul className="space-y-1">
                          {contentAnalysis.recommendations.map((rec: string, idx: number) => (
                            <li key={idx} className="text-sm text-gray-600 flex items-start">
                              <span className="text-blue-500 mr-2">→</span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            {/* ChatGPT Insights */}
            {chatgptInsights && (
              <div className="bg-white rounded-lg shadow-sm border border-purple-200 p-6">
                <div className="flex items-center mb-4">
                  <Sparkles className="h-5 w-5 text-purple-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">ChatGPT Crawler Insights</h3>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed bg-purple-50 border border-purple-100 rounded-lg p-4 mb-6">
                  {chatgptInsights.crawlerView}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {chatgptInsights.coreUnderstanding?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">What AI Understands</h4>
                      <ul className="space-y-1">
                        {chatgptInsights.coreUnderstanding.map((item: string, idx: number) => (
                          <li key={idx} className="text-sm text-gray-600 flex items-start">
                            <span className="text-purple-500 mr-2">•</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {chatgptInsights.priorityFixes?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-red-700 mb-2">Priority Fixes</h4>
                      <ul className="space-y-1">
                        {chatgptInsights.priorityFixes.map((item: string, idx: number) => (
                          <li key={idx} className="text-sm text-gray-600 flex items-start">
                            <span className="text-red-500 mr-2">•</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {chatgptInsights.optimizationIdeas?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-blue-700 mb-2">Optimization Ideas</h4>
                      <ul className="space-y-1">
                        {chatgptInsights.optimizationIdeas.map((item: string, idx: number) => (
                          <li key={idx} className="text-sm text-gray-600 flex items-start">
                            <span className="text-blue-500 mr-2">→</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {chatgptInsights.rankingChecklist?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-green-700 mb-2">Ranking Checklist</h4>
                      <ul className="space-y-1">
                        {chatgptInsights.rankingChecklist.map((item: string, idx: number) => (
                          <li key={idx} className="text-sm text-gray-600 flex items-start">
                            <span className="text-green-500 mr-2">☐</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

              {/* Website Metadata */}
              {analysisResult.metadata && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Website Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Title</label>
                      <p className="text-gray-900 mt-1">{analysisResult.metadata.title || 'Not found'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Meta Description</label>
                      <p className="text-gray-900 mt-1">{analysisResult.metadata.metaDescription || 'Not found'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Analyzed URL</label>
                      <p className="text-gray-900 mt-1 break-all">{analysisResult.website}</p>
                    </div>
                  {analysisResult.metadata.contentSource && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Content Source</label>
                      <p className="text-gray-900 mt-1 capitalize">{analysisResult.metadata.contentSource.replace('-', ' ')}</p>
                    </div>
                  )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}

