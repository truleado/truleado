'use client'

import { useState, useEffect } from 'react'
import AppLayout from '@/components/app-layout'
import { Users, MessageSquare, ExternalLink, Trash2, Calendar, TrendingUp, MessageCircle } from 'lucide-react'

interface RedditLead {
  id: string
  title: string
  selftext: string
  subreddit: string
  score: number
  num_comments: number
  url: string
  created_utc: number
  author: string
  reasoning: string
  sample_pitch: string
  keyword: string
  product_name: string
  product_description: string
  saved_at: string
}

export default function RedditLeadsPage() {
  const [leads, setLeads] = useState<RedditLead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchRedditLeads()
  }, [])

  const fetchRedditLeads = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/reddit-leads', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setLeads(data.leads || [])
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch Reddit leads' }))
        setError(errorData.error || 'Failed to fetch Reddit leads')
      }
    } catch (err: any) {
      setError(err.message || 'Network error')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm('Are you sure you want to delete this Reddit lead?')) {
      return
    }

    try {
      const response = await fetch(`/api/reddit-leads/${leadId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        setLeads(leads.filter(lead => lead.id !== leadId))
      } else {
        alert('Failed to delete lead')
      }
    } catch (err) {
      alert('Error deleting lead')
    }
  }

  const handleEngageLead = async (lead: RedditLead) => {
    if (!confirm('Engage with this lead? This will move it to Track Leads and remove it from Reddit Leads.')) {
      return
    }

    // Open the Reddit post in a new tab
    window.open(lead.url, '_blank')

    try {
      const response = await fetch('/api/reddit-leads/engage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(lead)
      })

      if (response.ok) {
        // Remove from reddit leads list
        setLeads(leads.filter(l => l.id !== lead.id))
        alert('Lead moved to Track Leads successfully!')
      } else {
        const errorData = await response.json()
        alert(`Failed to engage: ${errorData.error || 'Unknown error'}`)
      }
    } catch (err: any) {
      alert(`Error engaging with lead: ${err.message}`)
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatSavedDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center mb-2">
              <Users className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-3xl font-bold text-gray-900">Saved Leads</h1>
            </div>
            <p className="text-gray-600 text-lg">Saved Reddit opportunities for strategic pitching</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MessageSquare className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Saved</p>
                  <p className="text-2xl font-bold text-gray-900">{leads.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Subreddits</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {new Set(leads.map(lead => lead.subreddit)).size}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <MessageCircle className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Keywords</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {new Set(leads.map(lead => lead.keyword)).size}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">This Week</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {leads.filter(lead => {
                      const savedDate = new Date(lead.saved_at)
                      const weekAgo = new Date()
                      weekAgo.setDate(weekAgo.getDate() - 7)
                      return savedDate > weekAgo
                    }).length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {leads.length === 0 && !error && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Reddit Leads Yet</h3>
              <p className="text-gray-600 mb-6">
                Start by analyzing websites and searching for Reddit opportunities in the Research page.
              </p>
              <a
                href="/research"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go to Research
              </a>
            </div>
          )}

          {/* Leads List */}
          {leads.length > 0 && (
            <div className="space-y-6">
              {leads.map((lead) => (
                <div key={lead.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
                  {/* Lead Header */}
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                          {lead.title}
                        </h3>
                        <div className="flex items-center text-sm text-gray-500 space-x-4">
                          <span className="bg-gray-100 px-2 py-1 rounded-full text-xs">r/{lead.subreddit}</span>
                          <span className="flex items-center text-green-600">
                            <span className="font-medium">{lead.score}</span>
                            <span className="ml-1">↑</span>
                          </span>
                          <span className="flex items-center text-blue-600">
                            <span className="font-medium">{lead.num_comments}</span>
                            <span className="ml-1">💬</span>
                          </span>
                          <span className="text-gray-500">
                            by u/{lead.author}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4 flex space-x-2">
                        <button
                          onClick={() => handleEngageLead(lead)}
                          className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Engage
                        </button>
                        <button
                          onClick={() => handleDeleteLead(lead.id)}
                          className="inline-flex items-center px-3 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Lead Content */}
                  <div className="p-6">
                    {/* Post Content */}
                    {lead.selftext && (
                      <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-orange-300 mb-4">
                        <p className="text-gray-700 text-sm leading-relaxed">
                          {lead.selftext.length > 500 
                            ? `${lead.selftext.substring(0, 500)}...` 
                            : lead.selftext
                          }
                        </p>
                        {lead.selftext.length > 500 && (
                          <p className="text-orange-600 text-xs mt-2 font-medium">
                            Click "View Post" to read the full content
                          </p>
                        )}
                      </div>
                    )}

                    {/* Strategic Analysis */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                      <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-300">
                        <div className="flex items-start mb-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 mt-2"></div>
                          <h6 className="text-blue-900 font-semibold text-sm">Why This Is A Good Opportunity:</h6>
                        </div>
                        <p className="text-blue-800 text-sm leading-relaxed">{lead.reasoning}</p>
                      </div>

                      <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-300">
                        <div className="flex items-start mb-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2 mt-2"></div>
                          <h6 className="text-green-900 font-semibold text-sm">Sample Pitch Idea:</h6>
                        </div>
                        <p className="text-green-800 text-sm leading-relaxed italic">"{lead.sample_pitch}"</p>
                      </div>
                    </div>

                    {/* Product Context */}
                    <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-300 mb-4">
                      <div className="flex items-start mb-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mr-2 mt-2"></div>
                        <h6 className="text-purple-900 font-semibold text-sm">Product Context:</h6>
                      </div>
                      <div className="text-purple-800 text-sm">
                        <p className="font-medium mb-1">{lead.product_name}</p>
                        <p className="text-xs">{lead.product_description}</p>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-200">
                      <div className="flex items-center space-x-4">
                        <span>Keyword: <span className="font-medium text-gray-700">{lead.keyword}</span></span>
                        <span>Posted: {formatDate(lead.created_utc)}</span>
                      </div>
                      <span>Saved: {formatSavedDate(lead.saved_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
