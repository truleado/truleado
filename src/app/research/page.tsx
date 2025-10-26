'use client'

import { useState, useEffect } from 'react'
import AppLayout from '@/components/app-layout'
import { Plane, Search, Globe, Edit2, Check, X, MessageSquare } from 'lucide-react'

export default function ResearchPage() {
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [editableKeywords, setEditableKeywords] = useState<string[]>([])
  const [editableDescription, setEditableDescription] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [redditResults, setRedditResults] = useState<any>(null)
  const [isSearchingReddit, setIsSearchingReddit] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [savingPosts, setSavingPosts] = useState<Set<string>>(new Set())

  // Load saved data from localStorage on component mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem('research-page-data')
      console.log('🔍 Checking localStorage for Research page data:', !!savedData)
      
      if (savedData) {
        const data = JSON.parse(savedData)
        console.log('📁 Parsed saved data:', {
          hasWebsiteUrl: !!data.websiteUrl,
          hasAnalysisResult: !!data.analysisResult,
          hasEditableKeywords: data.editableKeywords?.length > 0,
          hasEditableDescription: !!data.editableDescription,
          hasRedditResults: !!data.redditResults
        })
        
        // Only set state if we have meaningful data
        if (data.websiteUrl || data.analysisResult || data.redditResults) {
          setWebsiteUrl(data.websiteUrl || '')
          setAnalysisResult(data.analysisResult || null)
          setEditableKeywords(data.editableKeywords || [])
          setEditableDescription(data.editableDescription || '')
          setRedditResults(data.redditResults || null)
          console.log('📁 Loaded saved Research page data from localStorage')
        } else {
          console.log('📁 Saved data found but no meaningful content')
        }
      } else {
        console.log('📁 No saved data found in localStorage')
      }
    } catch (error) {
      console.error('Error loading saved data:', error)
      // Clear corrupted data
      localStorage.removeItem('research-page-data')
    } finally {
      setDataLoaded(true)
    }
  }, [])

  // Save data to localStorage whenever important state changes
  useEffect(() => {
    if (dataLoaded) { // Only save after initial data load
      const dataToSave = {
        websiteUrl,
        analysisResult,
        editableKeywords,
        editableDescription,
        redditResults
      }
      localStorage.setItem('research-page-data', JSON.stringify(dataToSave))
      console.log('💾 Saved Research page data to localStorage:', {
        hasWebsiteUrl: !!websiteUrl,
        hasAnalysisResult: !!analysisResult,
        hasEditableKeywords: editableKeywords.length > 0,
        hasEditableDescription: !!editableDescription,
        hasRedditResults: !!redditResults
      })
    }
  }, [websiteUrl, analysisResult, editableKeywords, editableDescription, redditResults, dataLoaded])

  const handleAnalyze = async () => {
    if (!websiteUrl.trim()) {
      alert('Please enter a website URL')
      return
    }

    setIsAnalyzing(true)
    setAnalysisResult(null)

    try {
      const response = await fetch('/api/research/analyze-keywords', {
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
        setEditableKeywords(data.keywords || [])
        setEditableDescription(data.description || '')
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

  const handleEditKeywords = () => {
    setIsEditing(true)
  }

  const handleSaveKeywords = () => {
    setIsEditing(false)
    setAnalysisResult({ 
      ...analysisResult, 
      keywords: editableKeywords,
      description: editableDescription
    })
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditableKeywords(analysisResult.keywords || [])
    setEditableDescription(analysisResult.description || '')
  }

  const handleKeywordChange = (index: number, value: string) => {
    const newKeywords = [...editableKeywords]
    newKeywords[index] = value
    setEditableKeywords(newKeywords)
  }

  const handleClearAllData = () => {
    if (confirm('Are you sure you want to clear all data? This will remove your analysis results and Reddit search data.')) {
      setWebsiteUrl('')
      setAnalysisResult(null)
      setEditableKeywords([])
      setEditableDescription('')
      setRedditResults(null)
      setIsEditing(false)
      localStorage.removeItem('research-page-data')
      console.log('🗑️ Cleared all Research page data')
    }
  }


  const handleSaveRedditLead = async (post: any, keyword: string) => {
    const postId = `${post.subreddit}-${post.title.substring(0, 20)}`
    
    try {
      setSavingPosts(prev => new Set(prev).add(postId))
      
      const saveData = {
        title: post.title,
        selftext: post.selftext,
        subreddit: post.subreddit,
        score: post.score,
        num_comments: post.num_comments,
        url: post.url,
        created_utc: post.created_utc,
        author: post.author,
        reasoning: post.reasoning,
        sample_pitch: post.samplePitch,
        keyword: keyword,
        product_name: analysisResult?.productName || '',
        product_description: isEditing ? editableDescription : analysisResult?.description || ''
      }
      
      console.log('💾 Saving Reddit lead data:', {
        title: saveData.title,
        subreddit: saveData.subreddit,
        keyword: saveData.keyword,
        hasReasoning: !!saveData.reasoning,
        hasSamplePitch: !!saveData.sample_pitch,
        samplePitchPreview: saveData.sample_pitch?.substring(0, 50) + '...'
      })
      
      const response = await fetch('/api/reddit-leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saveData)
      })

      if (response.ok) {
        alert('Reddit lead saved successfully! You can view it in the Reddit Leads page.')
      } else {
        const errorData = await response.json()
        alert(`Failed to save lead: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error: any) {
      alert(`Error saving lead: ${error.message}`)
    } finally {
      setSavingPosts(prev => {
        const newSet = new Set(prev)
        newSet.delete(postId)
        return newSet
      })
    }
  }

  const handleSearchReddit = async () => {
    const keywords = isEditing ? editableKeywords : analysisResult.keywords
    const description = isEditing ? editableDescription : analysisResult.description
    
    if (!keywords || keywords.length === 0) {
      alert('Please analyze a website first to get keywords')
      return
    }

    if (!description) {
      alert('Product description is required for strategic Reddit search')
      return
    }

    setIsSearchingReddit(true)
    setRedditResults(null)

    try {
      console.log('🔍 Starting Reddit search with:', { 
        keywordsCount: keywords?.length, 
        hasDescription: !!description,
        productName: analysisResult.productName 
      })
      
      const response = await fetch('/api/research/search-reddit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          keywords,
          productDescription: description,
          productName: analysisResult.productName
        })
      })

      console.log('📡 Reddit search response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Reddit search results:', {
          totalKeywords: data.totalKeywords,
          totalStrategicPosts: data.totalStrategicPosts,
          resultsCount: data.results?.length,
          success: data.success
        })
        setRedditResults(data)
      } else {
        const errorData = await response.json()
        console.error('❌ Reddit search failed:', errorData)
        setRedditResults({
          error: errorData.error || 'Reddit search failed',
          details: errorData.details
        })
      }
    } catch (error: any) {
      console.error('❌ Network error during Reddit search:', error)
      setRedditResults({
        error: 'Network error',
        details: error.message
      })
    } finally {
      setIsSearchingReddit(false)
    }
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Plane className="h-8 w-8 text-blue-600 mr-3" />
                <h1 className="text-3xl font-bold text-gray-900">Research</h1>
              </div>
              {(analysisResult || redditResults) && (
                <button
                  onClick={handleClearAllData}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear All Data
                </button>
              )}
            </div>
            <p className="text-gray-600 text-lg">Website research and Reddit lead discovery</p>
            {dataLoaded && (analysisResult || redditResults) && (
              <div className="mt-2 bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <p className="text-green-800 text-sm">
                    <strong>📁 Data Restored:</strong> Your previous analysis and Reddit search results have been loaded from your browser's storage.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Website Analysis Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Website Analysis Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center">
                  <Globe className="h-5 w-5 text-blue-600 mr-2" />
                  <h2 className="text-lg font-semibold text-gray-900">Website Analysis</h2>
                </div>
                <p className="text-sm text-gray-600 mt-1">Extract keywords from any website</p>
              </div>
              
              <div className="p-6">
                {/* Input Box */}
                <div className="mb-4">
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
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !websiteUrl.trim()}
                  className="w-full inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Analyse Website
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Keywords Card */}
            {analysisResult && !analysisResult.error && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <h3 className="text-lg font-semibold text-gray-900">Extracted Information</h3>
                  </div>
                </div>
                
                <div className="p-6">
                  {analysisResult.keywords && (
                    <div className="space-y-4">
                      {/* Product Name Display */}
                      {analysisResult.productName && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-center mb-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                            <h4 className="text-sm font-semibold text-blue-900">Product/Service</h4>
                          </div>
                          <p className="text-blue-800 font-medium text-lg">{analysisResult.productName}</p>
                        </div>
                      )}
                      
                      {/* Description Display */}
                      {analysisResult.description && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <div className="w-2 h-2 bg-gray-500 rounded-full mr-2"></div>
                              <h4 className="text-sm font-semibold text-gray-900">Description</h4>
                            </div>
                            {!isEditing && (
                              <button
                                onClick={handleEditKeywords}
                                className="text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 px-2 py-1 rounded"
                              >
                                <Edit2 className="h-3 w-3 mr-1 inline" />
                                Edit
                              </button>
                            )}
                          </div>
                          {isEditing ? (
                            <textarea
                              value={editableDescription}
                              onChange={(e) => setEditableDescription(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
                              rows={3}
                              placeholder="Enter product/service description..."
                            />
                          ) : (
                            <p className="text-gray-700 text-sm leading-relaxed">{analysisResult.description}</p>
                          )}
                        </div>
                      )}
                      
                      {/* Keywords Display */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                            <h4 className="text-sm font-semibold text-gray-900">Keywords</h4>
                          </div>
                          {!isEditing && (
                            <button
                              onClick={handleEditKeywords}
                              className="text-xs text-green-600 hover:text-green-800 hover:bg-green-50 px-2 py-1 rounded"
                            >
                              <Edit2 className="h-3 w-3 mr-1 inline" />
                              Edit
                            </button>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(isEditing ? editableKeywords : analysisResult.keywords).map((keyword: string, index: number) => (
                            isEditing ? (
                              <input
                                key={index}
                                type="text"
                                value={keyword}
                                onChange={(e) => handleKeywordChange(index, e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            ) : (
                              <span 
                                key={index} 
                                className="inline-flex items-center px-3 py-2 bg-blue-100 text-blue-800 text-sm font-medium rounded-lg border border-blue-200"
                              >
                                {keyword}
                              </span>
                            )
                          ))}
                        </div>
                      </div>
                      
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-yellow-800 text-xs">
                          <strong>💡 Tip:</strong> Edit description and keywords if needed before searching Reddit
                        </p>
                      </div>
                      
                      {/* Edit Controls */}
                      {isEditing && (
                        <div className="flex gap-2 pt-4 border-t border-gray-200">
                          <button
                            onClick={handleSaveKeywords}
                            className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Save Changes
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Reddit Search Section */}
          {analysisResult && !analysisResult.error && analysisResult.keywords && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center">
                  <MessageSquare className="h-5 w-5 text-orange-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Reddit Search</h3>
                </div>
                <p className="text-sm text-gray-600 mt-1">Find strategic pitching opportunities on Reddit</p>
              </div>
              
              <div className="p-6">
                <button
                  onClick={handleSearchReddit}
                  disabled={isSearchingReddit || isEditing}
                  className="w-full inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSearchingReddit ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Searching Reddit...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Search Reddit for Pitching Opportunities
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Results Section */}
          <div className="space-y-6">
              {/* Error Display */}
              {analysisResult && analysisResult.error && (
                <div className="bg-white rounded-lg shadow-sm border border-red-200">
                  <div className="px-6 py-4 border-b border-red-200 bg-red-50">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                      <h3 className="text-lg font-semibold text-red-900">Analysis Failed</h3>
                    </div>
                  </div>
                  <div className="p-6">
                    <p className="text-red-700 mb-2">{analysisResult.error}</p>
                    {analysisResult.details && (
                      <p className="text-red-600 text-sm">{analysisResult.details}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Reddit Results */}
              {redditResults && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                      <h3 className="text-lg font-semibold text-gray-900">Reddit Results</h3>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {redditResults.totalStrategicPosts || 0} strategic pitching opportunities found across {redditResults.totalKeywords || 0} keywords
                    </p>
                  </div>
                  
                  <div className="p-6">
                    {redditResults.error ? (
                      <div className="text-center py-8">
                        <div className="text-red-600 mb-2">
                          <MessageSquare className="h-12 w-12 mx-auto" />
                        </div>
                        <h4 className="text-lg font-medium text-red-900 mb-2">Search Failed</h4>
                        <p className="text-red-700 mb-2">{redditResults.error}</p>
                        {redditResults.details && (
                          <p className="text-red-600 text-sm">{redditResults.details}</p>
                        )}
                      </div>
                    ) : redditResults.totalStrategicPosts === 0 ? (
                      <div className="text-center py-8">
                        <div className="text-gray-400 mb-4">
                          <MessageSquare className="h-12 w-12 mx-auto" />
                        </div>
                        <h4 className="text-lg font-medium text-gray-900 mb-2">No Strategic Opportunities Found</h4>
                        <p className="text-gray-600 mb-4">
                          We analyzed {redditResults.results?.reduce((sum: number, result: any) => sum + (result.totalPosts || 0), 0) || 0} Reddit posts across {redditResults.totalKeywords || 0} keywords but didn't find any high-quality pitching opportunities.
                        </p>
                        <p className="text-gray-500 text-sm">
                          Try editing your keywords or product description to find more relevant opportunities.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Summary Stats */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                              <div className="text-2xl font-bold text-blue-600">{redditResults.totalKeywords || 0}</div>
                              <div className="text-gray-600 text-sm">Keywords</div>
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-orange-600">{redditResults.totalStrategicPosts || 0}</div>
                              <div className="text-gray-600 text-sm">Strategic Opportunities</div>
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-green-600">
                                {redditResults.results?.reduce((sum: number, result: any) => sum + (result.totalPosts || 0), 0) || 0}
                              </div>
                              <div className="text-gray-600 text-sm">Total Analyzed</div>
                            </div>
                          </div>
                        </div>

                        {/* Results by Keyword */}
                        {redditResults.results?.map((result: any, index: number) => (
                          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200">
                            {/* Keyword Header */}
                            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-red-50">
                              <div className="flex items-center">
                                <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                                <h4 className="text-lg font-semibold text-gray-900">🔍 "{result.keyword}"</h4>
                              </div>
                              <p className="text-gray-600 text-sm mt-1">
                                {result.strategicPosts || 0} strategic opportunities found • {result.totalPosts} total posts analyzed
                              </p>
                            </div>
                            
                            {/* Posts in Rows */}
                            {result.posts && result.posts.length > 0 ? (
                              <div className="divide-y divide-gray-200">
                                {result.posts.map((post: any, postIndex: number) => (
                                  <div key={postIndex} className="p-6 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1 min-w-0">
                                        {/* Post Title */}
                                        <h5 className="text-lg font-semibold text-gray-900 mb-2 leading-tight">
                                          {post.title}
                                        </h5>
                                        
                                        {/* Post Meta */}
                                        <div className="flex items-center text-sm text-gray-500 gap-4 mb-3">
                                          <span className="bg-gray-100 px-2 py-1 rounded-full text-xs">r/{post.subreddit}</span>
                                          <span className="flex items-center text-green-600">
                                            <span className="font-medium">{post.score}</span>
                                            <span className="ml-1">↑</span>
                                          </span>
                                          <span className="flex items-center text-blue-600">
                                            <span className="font-medium">{post.num_comments}</span>
                                            <span className="ml-1">💬</span>
                                          </span>
                                        </div>
                                        
                                        {/* Post Content */}
                                        {post.selftext && (
                                          <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-orange-300 mb-3">
                                            <p className="text-gray-700 text-sm leading-relaxed">
                                              {post.selftext.length > 300 
                                                ? `${post.selftext.substring(0, 300)}...` 
                                                : post.selftext
                                              }
                                            </p>
                                            {post.selftext.length > 300 && (
                                              <p className="text-orange-600 text-xs mt-2 font-medium">
                                                Click "View Post" to read the full content
                                              </p>
                                            )}
                                          </div>
                                        )}
                                        
                                        {/* Strategic Analysis */}
                                        {post.reasoning && (
                                          <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-300 mb-3">
                                            <div className="flex items-start mb-2">
                                              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 mt-2"></div>
                                              <h6 className="text-blue-900 font-semibold text-sm">Why This Is A Good Opportunity:</h6>
                                            </div>
                                            <p className="text-blue-800 text-sm leading-relaxed">{post.reasoning}</p>
                                          </div>
                                        )}
                                        
                                        {/* Sample Pitch */}
                                        {post.samplePitch && (
                                          <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-300 mb-3">
                                            <div className="flex items-start mb-2">
                                              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 mt-2"></div>
                                              <h6 className="text-green-900 font-semibold text-sm">Sample Pitch Idea:</h6>
                                            </div>
                                            <p className="text-green-800 text-sm leading-relaxed italic">"{post.samplePitch}"</p>
                                          </div>
                                        )}
                                      </div>
                                      
                                      {/* Action Buttons */}
                                      <div className="ml-6 flex-shrink-0 flex space-x-2">
                                        <a
                                          href={post.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors"
                                        >
                                          <MessageSquare className="h-4 w-4 mr-2" />
                                          View Post
                                        </a>
                                        <button
                                          onClick={() => handleSaveRedditLead(post, result.keyword)}
                                          disabled={savingPosts.has(`${post.subreddit}-${post.title.substring(0, 20)}`)}
                                          className="inline-flex items-center px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                          {savingPosts.has(`${post.subreddit}-${post.title.substring(0, 20)}`) ? (
                                            <>
                                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                              Saving...
                                            </>
                                          ) : (
                                            <>
                                              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                              </svg>
                                              Save Lead
                                            </>
                                          )}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="p-8 text-center text-gray-500">
                                <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                <p className="text-sm">No strategic opportunities found for this keyword</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
