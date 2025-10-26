'use client'

import { useState, useEffect } from 'react'
import AppLayout from '@/components/app-layout'
import { BarChart3, MessageSquare, ExternalLink, TrendingUp, Calendar, DollarSign, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react'

interface Lead {
  id: string
  title: string
  content: string
  subreddit: string
  author: string
  url: string
  score: number
  num_comments: number
  createdAt: string
  status: string
  productId: string
  productName: string
  relevanceScore: number
  tags: string[]
  notes: string
  leadType: string
  parentPostTitle: string
  parentPostUrl: string
  isComment: boolean
  aiAnalysisReasons: string[]
  aiSampleReply: string
  aiAnalysisScore: number
  aiAnalysisTimestamp: string
}

export default function TrackLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchLeads()
  }, [])

  const fetchLeads = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/leads')
      
      if (response.ok) {
        const data = await response.json()
        setLeads(data.leads || [])
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to fetch leads')
      }
    } catch (err: any) {
      setError(err.message || 'Network error')
    } finally {
      setLoading(false)
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800'
      case 'contacted': return 'bg-yellow-100 text-yellow-800'
      case 'interested': return 'bg-green-100 text-green-800'
      case 'not_interested': return 'bg-red-100 text-red-800'
      case 'converted': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <Clock className="h-4 w-4" />
      case 'contacted': return <AlertCircle className="h-4 w-4" />
      case 'interested': return <TrendingUp className="h-4 w-4" />
      case 'not_interested': return <XCircle className="h-4 w-4" />
      case 'converted': return <CheckCircle className="h-4 w-4" />
      default: return <AlertCircle className="h-4 w-4" />
    }
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
              <BarChart3 className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-3xl font-bold text-gray-900">Track Leads</h1>
            </div>
            <p className="text-gray-600 text-lg">Monitor and manage your lead performance</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MessageSquare className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Leads</p>
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
                  <p className="text-sm font-medium text-gray-600">New Leads</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {leads.filter(lead => lead.status === 'new').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Converted</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {leads.filter(lead => lead.status === 'converted').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {leads.length > 0 
                      ? `${Math.round((leads.filter(lead => lead.status === 'converted').length / leads.length) * 100)}%`
                      : '0%'
                    }
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Tracked Leads Yet</h3>
              <p className="text-gray-600 mb-6">
                Engage with Reddit leads from the Reddit Leads page to start tracking them here.
              </p>
              <a
                href="/reddit-leads"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go to Reddit Leads
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
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                            {lead.title}
                          </h3>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(lead.status)}`}>
                            {getStatusIcon(lead.status)}
                            <span className="ml-1 capitalize">{lead.status}</span>
                          </span>
                        </div>
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
                          <span className="text-gray-500">by u/{lead.author}</span>
                        </div>
                      </div>
                      <div className="ml-4 flex space-x-2">
                        <a
                          href={lead.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Post
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Lead Content */}
                  <div className="p-6">
                    {/* Post Content */}
                    {lead.content && (
                      <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-orange-300 mb-4">
                        <p className="text-gray-700 text-sm leading-relaxed">
                          {lead.content.length > 500 
                            ? `${lead.content.substring(0, 500)}...` 
                            : lead.content
                          }
                        </p>
                      </div>
                    )}

                    {/* AI Analysis */}
                    {lead.aiAnalysisReasons && lead.aiAnalysisReasons.length > 0 && (
                      <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-300 mb-4">
                        <div className="flex items-start mb-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 mt-2"></div>
                          <h6 className="text-blue-900 font-semibold text-sm">AI Analysis Reasons:</h6>
                        </div>
                        <ul className="text-blue-800 text-sm leading-relaxed list-disc list-inside">
                          {lead.aiAnalysisReasons.map((reason, idx) => (
                            <li key={idx}>{reason}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Sample Reply */}
                    {lead.aiSampleReply && (
                      <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-300 mb-4">
                        <div className="flex items-start mb-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2 mt-2"></div>
                          <h6 className="text-green-900 font-semibold text-sm">Suggested Response:</h6>
                        </div>
                        <p className="text-green-800 text-sm leading-relaxed italic">"{lead.aiSampleReply}"</p>
                      </div>
                    )}

                    {/* Product Info */}
                    <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-300 mb-4">
                      <div className="flex items-start mb-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mr-2 mt-2"></div>
                        <h6 className="text-purple-900 font-semibold text-sm">Product:</h6>
                      </div>
                      <p className="text-purple-800 text-sm font-medium">{lead.productName}</p>
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-200">
                      <div className="flex items-center space-x-4">
                        <span>Created: {formatDate(lead.createdAt)}</span>
                        {lead.relevanceScore && <span>Relevance Score: <span className="font-medium text-gray-700">{lead.relevanceScore}</span></span>}
                      </div>
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
