'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import AppLayout from '@/components/app-layout'
import { AccessGuard, UpgradeButton } from '@/components/AccessGuard'
import { useSubscription } from '@/lib/subscription-context'
import { 
  Search, 
  MessageCircle, 
  Loader2, 
  Users, 
  ExternalLink,
  Calendar,
  MessageSquare,
  Tag,
  Brain,
  CheckCircle,
  XCircle,
  Eye,
  Copy,
  RefreshCw
} from 'lucide-react'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface ChatFindLead {
  id: string
  title: string
  content: string
  subreddit: string
  author: string
  url: string
  score: number
  comments: number
  createdAt: string
  relevanceScore: number
  aiAnalysisReasons: string[]
  aiSampleReply: string
  aiAnalysisScore: number
  leadType: 'post' | 'comment'
  parentPostTitle?: string
  parentPostUrl?: string
  isComment: boolean
}

export default function ChatFindPage() {
  const { user, loading: authLoading } = useAuth()
  const { canAccess, accessLevel, isLoading: subscriptionLoading } = useSubscription()
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [leads, setLeads] = useState<ChatFindLead[]>([])
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [copiedReply, setCopiedReply] = useState<string | null>(null)
  const [currentSearchId, setCurrentSearchId] = useState<string | null>(null)
  const [searchProgress, setSearchProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState('')
  const [savedSearches, setSavedSearches] = useState<any[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [usageInfo, setUsageInfo] = useState<{used: number, limit: number} | null>(null)
  const [userUsage, setUserUsage] = useState<{used: number, limit: number, isSubscribed: boolean} | null>(null)
  const [redditStatus, setRedditStatus] = useState<{connected: boolean, hasToken: boolean, tokenExpired: boolean, username?: string} | null>(null)

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    console.log('Auth check useEffect:', { authLoading, user: !!user })
    if (!authLoading && !user) {
      console.log('Redirecting to sign-in')
      router.push('/auth/signin')
    }
  }, [user, authLoading, router])

  const loadSearchResults = async (searchId: string) => {
    try {
      console.log('Loading search results for searchId:', searchId)
      const response = await fetch(`/api/chat-find/results?searchId=${searchId}`)
      console.log('Results API response:', response.status, response.statusText)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Results data:', data)
        setLeads(data.results || [])
        console.log('Leads set:', data.results?.length || 0, 'leads')
      } else {
        const errorData = await response.text()
        console.error('Results API error:', errorData)
      }
    } catch (error) {
      console.error('Error loading search results:', error)
    }
  }

  // Load search history and usage on component mount
  useEffect(() => {
    if (user) {
      loadSearchHistory()
      loadUserUsage()
      loadRedditStatus()
    }
  }, [user])

  // Track search progress
  useEffect(() => {
    if (currentSearchId && isSearching) {
      // Add a fallback timeout to load results after 30 seconds
      const fallbackTimeout = setTimeout(async () => {
        console.log('Fallback timeout reached, loading results...')
        await loadSearchResults(currentSearchId)
        setIsSearching(false)
        setCurrentSearchId(null)
        loadSearchHistory()
        loadUserUsage()
      }, 30000) // 30 seconds fallback
      
      const interval = setInterval(async () => {
        try {
          const response = await fetch(`/api/chat-find/progress?searchId=${currentSearchId}`)
          console.log('Progress check response:', response.status, response.statusText)
          
          if (response.ok) {
            const data = await response.json()
            console.log('Progress data:', data)
            setSearchProgress(data.progress)
            setProgressMessage(data.message)
            
            if (data.status === 'completed') {
              console.log('Search completed! Loading results...')
              clearTimeout(fallbackTimeout) // Clear the fallback timeout
              setIsSearching(false)
              setCurrentSearchId(null)
              // Load the final results
              await loadSearchResults(data.searchId)
              // Reload the search history and usage
              loadSearchHistory()
              loadUserUsage()
            } else if (data.status === 'failed') {
              console.log('Search failed:', data.message)
              clearTimeout(fallbackTimeout) // Clear the fallback timeout
              setIsSearching(false)
              setCurrentSearchId(null)
              alert('Search failed: ' + data.message)
            }
          } else if (response.status === 401) {
            console.log('Progress tracking unauthorized, stopping progress check')
            setIsSearching(false)
            setCurrentSearchId(null)
          }
        } catch (error) {
          console.error('Error tracking progress:', error)
          // Don't stop searching on progress tracking errors
        }
      }, 1000)

      return () => {
        clearInterval(interval)
        clearTimeout(fallbackTimeout)
      }
    }
  }, [currentSearchId, isSearching])

  const loadSearchHistory = async () => {
    try {
      const response = await fetch('/api/chat-find/history?limit=20')
      if (response.ok) {
        const data = await response.json()
        setSavedSearches(data.searches)
      } else if (response.status === 401) {
        console.log('Search history unauthorized, skipping')
      }
    } catch (error) {
      console.error('Error loading search history:', error)
    }
  }

  const loadUserUsage = async () => {
    try {
      const response = await fetch('/api/chat-find/usage')
      if (response.ok) {
        const data = await response.json()
        setUserUsage(data)
      } else if (response.status === 401) {
        console.log('Usage info unauthorized, skipping')
      }
    } catch (error) {
      console.error('Error loading user usage:', error)
    }
  }

  const loadRedditStatus = async () => {
    try {
      const response = await fetch('/api/chat-find/reddit-status')
      if (response.ok) {
        const data = await response.json()
        setRedditStatus(data)
        console.log('Reddit status:', data)
      } else if (response.status === 401) {
        console.log('Reddit status unauthorized, skipping')
      }
    } catch (error) {
      console.error('Error loading Reddit status:', error)
    }
  }

  const handleSearch = async () => {
    if (!query.trim()) return

    setIsSearching(true)
    setLeads([])
    setSearchProgress(0)
    setProgressMessage('Starting search...')

    try {
      const response = await fetch('/api/chat-find/search-leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: query.trim() }),
      })

      if (!response.ok) {
        let errorData
        let errorMessage = 'Search failed'
        
        try {
          // Clone the response to avoid "body already read" error
          const responseClone = response.clone()
          errorData = await responseClone.json()
          errorMessage = errorData.error || errorMessage
        } catch (jsonError) {
          // Handle non-JSON responses (like 504 Gateway Timeout)
          try {
            const textResponse = await response.text()
            console.error('Non-JSON response:', textResponse)
            errorMessage = `Server error: ${response.status} - ${textResponse}`
          } catch (textError) {
            console.error('Failed to read response as text:', textError)
            errorMessage = `Server error: ${response.status} - ${response.statusText}`
          }
        }
        
        // Handle usage limit error
        if (response.status === 402 && errorData?.code === 'USAGE_LIMIT_EXCEEDED') {
          setUsageInfo({
            used: errorData.freeSearchesUsed,
            limit: errorData.limit
          })
          setShowUpgradeModal(true)
          setIsSearching(false)
          setCurrentSearchId(null)
          return
        }
        
        // Handle timeout errors specifically
        if (response.status === 504) {
          errorMessage = 'Search timed out. The search is taking longer than expected. Please try again with a more specific query or check back later.'
        }
        
        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log('API response data:', data)
      setCurrentSearchId(data.searchId)
      
      // If leads are returned immediately, set them
      if (data.leads && data.leads.length > 0) {
        console.log('Setting leads from immediate response:', data.leads.length)
        setLeads(data.leads)
        setIsSearching(false)
        setCurrentSearchId(null)
        // Reload the search history and usage
        loadSearchHistory()
        loadUserUsage()
      } else if (data.totalFound === 0) {
        // No leads found, stop searching
        console.log('No leads found, stopping search')
        setLeads([])
        setIsSearching(false)
        setCurrentSearchId(null)
        loadSearchHistory()
        loadUserUsage()
      } else {
        console.log('No immediate leads, waiting for progress tracking...')
      }
      
      // Add to search history
      if (!searchHistory.includes(query.trim())) {
        setSearchHistory(prev => [query.trim(), ...prev.slice(0, 4)])
      }
    } catch (error) {
      console.error('Search error:', error)
      alert('Search failed. Please try again.')
      setIsSearching(false)
      setCurrentSearchId(null)
    }
  }


  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSearch()
    }
  }

  const handleCopyReply = async (reply: string, leadId: string) => {
    try {
      await navigator.clipboard.writeText(reply)
      setCopiedReply(leadId)
      setTimeout(() => setCopiedReply(null), 2000)
    } catch (error) {
      console.error('Failed to copy reply:', error)
      alert('Failed to copy reply. Please try again.')
    }
  }

  const getStatusIcon = (score: number) => {
    if (score >= 8) return <CheckCircle className="w-4 h-4 text-green-600" />
    if (score >= 6) return <Eye className="w-4 h-4 text-yellow-600" />
    return <XCircle className="w-4 h-4 text-red-600" />
  }

  const getStatusColor = (score: number) => {
    if (score >= 8) return 'bg-green-100 text-green-800 border-green-200'
    if (score >= 6) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    return 'bg-red-100 text-red-800 border-red-200'
  }

  // Debug authentication state
  console.log('Chat & Find auth state:', {
    user: !!user,
    authLoading,
    subscriptionLoading,
    userEmail: user?.email,
    accessLevel,
    canAccess
  })

  console.log('About to check loading state:', { authLoading, subscriptionLoading })

  // Show loading while authentication is in progress
  if (authLoading || subscriptionLoading) {
    console.log('Showing loading state')
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render anything if not authenticated (redirect will happen)
  if (!user) {
    console.log('No user, returning null')
    return null
  }

  // Temporarily bypass AccessGuard for debugging
  console.log('Rendering Chat & Find page (bypassing AccessGuard for debugging)')
  
  return (
    <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            {/* Header */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Chat & Find</h1>
                    <p className="text-gray-600">AI-powered lead discovery with natural language</p>
                    {redditStatus && (
                      <div className="mt-2">
                        {redditStatus.connected ? (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            Reddit connected as {redditStatus.username}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-red-600">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            {redditStatus.tokenExpired ? 'Reddit token expired' : 'Reddit not connected'}
                            <a href="/settings" className="text-blue-600 hover:underline">Connect Reddit</a>
                          </div>
                        )}
                      </div>
                    )}
                    {userUsage && !userUsage.isSubscribed && (
                      <div className="mt-2 text-sm">
                        <span className="text-gray-500">Free searches: </span>
                        <span className={`font-semibold ${userUsage.remaining === 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {userUsage.remaining === 'unlimited' ? 'Unlimited' : `${userUsage.remaining} remaining`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  {showHistory ? 'Hide History' : 'Show History'}
                </button>
              </div>
            </div>

            {/* Search History */}
            {showHistory && (
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-200/50 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Search History</h2>
                {savedSearches.length > 0 ? (
                  <div className="space-y-4">
                    {savedSearches.map((search) => (
                      <div key={search.id} className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-gray-900">{search.query}</h3>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              search.search_status === 'completed' 
                                ? 'bg-green-100 text-green-800' 
                                : search.search_status === 'failed'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {search.search_status}
                            </span>
                            <span className="text-sm text-gray-500">
                              {new Date(search.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          Found {search.total_leads_found} leads
                        </p>
                        {search.topResults && search.topResults.length > 0 && (
                          <div className="text-xs text-gray-500">
                            Top results: {search.topResults.map(r => r.title).slice(0, 2).join(', ')}
                            {search.topResults.length > 2 && '...'}
                          </div>
                        )}
                        <button
                          onClick={() => {
                            console.log('View Results clicked for search:', search.id)
                            window.open(`/chat-find/results?searchId=${search.id}`, '_blank')
                          }}
                          className="mt-2 text-blue-600 hover:text-blue-500 text-sm font-medium"
                        >
                          View Results →
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No search history yet</p>
                )}
              </div>
            )}

            {/* Search Interface */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-200/50 p-8">
              <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                  <label htmlFor="search-query" className="block text-sm font-semibold text-gray-700 mb-2">
                    What are you looking for?
                  </label>
                  <div className="space-y-4">
                    <textarea
                      id="search-query"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="e.g., Find people looking for project management tools, Show me discussions about CRM systems, I need leads for my email marketing software..."
                      className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-colors text-base"
                      rows={3}
                      disabled={isSearching}
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={handleSearch}
                        disabled={isSearching || !query.trim()}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 font-semibold"
                      >
                        {isSearching ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Search className="w-4 h-4" />
                        )}
                        {isSearching ? 'Searching...' : 'Find Leads'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                {isSearching && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Search Progress</span>
                      <span className="text-sm text-gray-500">{searchProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${searchProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{progressMessage}</p>
                  </div>
                )}

                {/* Search History */}
                {searchHistory.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Recent Searches</h3>
                    <div className="flex flex-wrap gap-2">
                      {searchHistory.map((historyQuery, index) => (
                        <button
                          key={index}
                          onClick={() => setQuery(historyQuery)}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                        >
                          {historyQuery}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Example Queries */}
                <div className="text-sm text-gray-500">
                  <p className="mb-2">💡 Try these examples:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <button
                      onClick={() => setQuery('Find people looking for project management tools')}
                      className="text-left p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      "Find people looking for project management tools"
                    </button>
                    <button
                      onClick={() => setQuery('Show me discussions about CRM systems')}
                      className="text-left p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      "Show me discussions about CRM systems"
                    </button>
                    <button
                      onClick={() => setQuery('I need leads for my email marketing software')}
                      className="text-left p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      "I need leads for my email marketing software"
                    </button>
                    <button
                      onClick={() => setQuery('Find people discussing accounting software')}
                      className="text-left p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      "Find people discussing accounting software"
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Results */}
            {leads.length > 0 && (
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-200/50 p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Found {leads.length} leads
                  </h2>
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-600">
                      Query: "{query}"
                    </div>
                    <button
                      onClick={() => {
                        console.log('Refresh results clicked')
                        if (currentSearchId) {
                          loadSearchResults(currentSearchId)
                        }
                      }}
                      className="text-sm text-blue-600 hover:text-blue-500 font-medium"
                    >
                      Refresh Results
                    </button>
                  </div>
                </div>

                <div className="grid gap-6">
                  {leads.map((lead) => (
                    <div key={lead.id} className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-200">
                      {/* Header with status and metadata */}
                      <div className="mb-4">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(lead.relevanceScore)}`}>
                            {getStatusIcon(lead.relevanceScore)}
                            Score: {lead.relevanceScore}/10
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            lead.isComment ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {lead.isComment ? '💬' : '📝'}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                          <span>r/{lead.subreddit}</span>
                          <span>•</span>
                          <span>u/{lead.author}</span>
                        </div>
                      </div>

                      {/* Title and content */}
                      <div className="mb-4">
                        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                          {lead.title}
                        </h3>
                        
                        {lead.isComment && lead.parentPostTitle && (
                          <div className="bg-gray-50 border-l-2 border-blue-400 rounded-r-lg p-3 mb-3">
                            <p className="text-xs text-gray-600 mb-1 font-medium">Parent Post:</p>
                            <p className="text-sm text-gray-800 line-clamp-1">{lead.parentPostTitle}</p>
                          </div>
                        )}
                        
                        <p className="text-gray-600 text-sm line-clamp-3 leading-relaxed">
                          {lead.content}
                        </p>
                      </div>

                      {/* Metadata row */}
                      <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-gray-500 mb-4">
                        <div className="flex flex-wrap items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(lead.createdAt).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {lead.comments}
                          </div>
                          <div className="flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            {lead.subreddit}
                          </div>
                        </div>
                        {lead.aiAnalysisScore > 0 && (
                          <div className="flex items-center gap-1">
                            <Brain className="w-3 h-3 text-purple-600" />
                            <span className="font-semibold text-purple-600">{lead.aiAnalysisScore}/10</span>
                          </div>
                        )}
                      </div>

                      {/* AI Analysis */}
                      {lead.aiAnalysisReasons && lead.aiAnalysisReasons.length > 0 && (
                        <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl">
                          <h4 className="text-xs font-semibold text-purple-900 mb-2 flex items-center gap-1">
                            <Brain className="w-3 h-3" />
                            AI Analysis:
                          </h4>
                          <ul className="text-xs text-purple-800 space-y-1">
                            {lead.aiAnalysisReasons.slice(0, 3).map((reason, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="text-purple-600 mt-0.5">•</span>
                                <span>{reason}</span>
                              </li>
                            ))}
                            {lead.aiAnalysisReasons && lead.aiAnalysisReasons.length > 3 && (
                              <li className="text-purple-600 text-xs">+{lead.aiAnalysisReasons.length - 3} more reasons</li>
                            )}
                          </ul>
                        </div>
                      )}

                      {/* AI Sample Reply */}
                      {lead.aiSampleReply && (
                        <div className="mb-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                          <h4 className="text-xs font-semibold text-green-900 mb-2 flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            AI Reply:
                          </h4>
                          <div className="text-xs text-green-800 bg-white p-2 rounded-lg border mb-2">
                            {lead.aiSampleReply}
                          </div>
                          <button
                            onClick={() => handleCopyReply(lead.aiSampleReply, lead.id)}
                            className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            {copiedReply === lead.id ? (
                              <>
                                <CheckCircle className="w-3 h-3" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                Copy
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-4 border-t border-gray-100">
                        <div className="text-xs text-gray-500">
                          Relevance: {lead.relevanceScore}/10
                        </div>
                        <a
                          href={lead.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-500 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View on Reddit
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No results state */}
            {!isSearching && leads.length === 0 && query && (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Search className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No leads found</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Try rephrasing your search or use one of the example queries above.
                </p>
                <button
                  onClick={() => setQuery('')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Upgrade Modal */}
        {showUpgradeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-100 to-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <MessageCircle className="w-8 h-8 text-orange-600" />
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Free Search Limit Reached
                </h2>
                
                <p className="text-gray-600 mb-6">
                  You've used your free search! Upgrade to Pro to continue using Chat & Find with unlimited searches.
                </p>
                
                {usageInfo && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Searches used:</span>
                      <span className="font-semibold text-gray-900">
                        {usageInfo.used} / {usageInfo.limit}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-orange-500 h-2 rounded-full"
                        style={{ width: '100%' }}
                      ></div>
                    </div>
                  </div>
                )}
                
                <div className="space-y-3">
                  <button
                    onClick={() => router.push('/pricing')}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
                  >
                    Upgrade to Pro - $29/month
                  </button>
                  
                  <button
                    onClick={() => setShowUpgradeModal(false)}
                    className="w-full text-gray-500 hover:text-gray-700 py-2"
                  >
                    Maybe Later
                  </button>
                </div>
                
                <div className="mt-6 text-xs text-gray-500">
                  <p>✨ Pro includes unlimited Chat & Find searches</p>
                  <p>🚀 Plus all other Truleado features</p>
                </div>
              </div>
            </div>
          </div>
        )}
    </AppLayout>
  )
}
