'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter, useSearchParams } from 'next/navigation'
import AppLayout from '@/components/app-layout'
import { 
  ExternalLink,
  MessageCircle, 
  Users, 
  Calendar,
  MessageSquare,
  Tag,
  Brain,
  CheckCircle,
  XCircle,
  Eye,
  Copy,
  ArrowLeft
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
  relevanceScore: number
  aiAnalysisReasons: string[]
  aiSampleReply: string
  aiAnalysisScore: number
  leadType: string
  parentPostTitle?: string
  parentPostUrl?: string
  isComment: boolean
}

export default function ChatFindResultsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const searchId = searchParams.get('searchId')
  
  const [leads, setLeads] = useState<ChatFindLead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchInfo, setSearchInfo] = useState<any>(null)
  const [copiedReply, setCopiedReply] = useState<string | null>(null)

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin')
    }
  }, [user, authLoading, router])

  // Load search results
  useEffect(() => {
    if (searchId && user) {
      loadSearchResults()
    }
  }, [searchId, user])

  const loadSearchResults = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Loading search results for searchId:', searchId)
      const response = await fetch(`/api/chat-find/results?searchId=${searchId}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Results data:', data)
        setLeads(data.results || [])
        setSearchInfo(data.searchInfo || null)
      } else {
        const errorData = await response.text()
        console.error('Results API error:', errorData)
        setError('Failed to load search results')
      }
    } catch (error) {
      console.error('Error loading search results:', error)
      setError('Failed to load search results')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedReply(type)
      setTimeout(() => setCopiedReply(null), 2000)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (authLoading || loading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading search results...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
          <div className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Results</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => router.push('/chat-find')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Chat & Find
            </button>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => router.push('/chat-find')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                Back to Chat & Find
              </button>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Search Results</h1>
            {searchInfo && (
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">{searchInfo.query}</h2>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(searchInfo.created_at)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {leads.length} leads found
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    searchInfo.search_status === 'completed' 
                      ? 'bg-green-100 text-green-800' 
                      : searchInfo.search_status === 'failed'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {searchInfo.search_status}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Results */}
          {leads.length > 0 ? (
            <div className="space-y-6">
              {leads.map((lead, index) => (
                <div key={lead.id} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-6 hover:shadow-xl transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                        {lead.title}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <span className="flex items-center gap-1">
                          <Tag className="h-4 w-4" />
                          r/{lead.subreddit}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          u/{lead.author}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          {lead.comments} comments
                        </span>
                        <span className="flex items-center gap-1">
                          <Brain className="h-4 w-4" />
                          Score: {lead.relevanceScore}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <a
                        href={lead.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        <ExternalLink className="h-4 w-4" />
                        View Post
                      </a>
                    </div>
                  </div>

                  {lead.content && (
                    <div className="mb-4">
                      <p className="text-gray-700 text-sm line-clamp-3">
                        {lead.content}
                      </p>
                    </div>
                  )}

                  {lead.isComment && lead.parentPostTitle && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Comment on:</p>
                      <p className="text-sm font-medium text-gray-700">{lead.parentPostTitle}</p>
                    </div>
                  )}

                  {lead.aiAnalysisReasons && lead.aiAnalysisReasons.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1">
                        <Brain className="h-4 w-4" />
                        AI Analysis Reasons
                      </h4>
                      <ul className="text-sm text-gray-700 space-y-1">
                        {lead.aiAnalysisReasons.map((reason, reasonIndex) => (
                          <li key={reasonIndex} className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {lead.aiSampleReply && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-blue-900 flex items-center gap-1">
                          <MessageCircle className="h-4 w-4" />
                          AI Sample Reply
                        </h4>
                        <button
                          onClick={() => copyToClipboard(lead.aiSampleReply, `reply-${lead.id}`)}
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs font-medium"
                        >
                          {copiedReply === `reply-${lead.id}` ? (
                            <>
                              <CheckCircle className="h-3 w-3" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-sm text-blue-800 leading-relaxed">
                        {lead.aiSampleReply}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-8 max-w-md mx-auto">
                <Eye className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Leads Found</h3>
                <p className="text-gray-600 mb-4">
                  This search completed successfully but didn't find any relevant leads matching your criteria.
                </p>
                <div className="text-sm text-gray-500 mb-6">
                  <p className="mb-2">Try adjusting your search query:</p>
                  <ul className="text-left space-y-1">
                    <li>• Use more specific keywords</li>
                    <li>• Try different subreddits</li>
                    <li>• Broaden your target audience</li>
                    <li>• Adjust your industry context</li>
                  </ul>
                </div>
                <button
                  onClick={() => router.push('/chat-find')}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try a New Search
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
