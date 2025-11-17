'use client'

import { useState } from 'react'
import AppLayout from '@/components/app-layout'
import { FileText, Loader2, Globe, Sparkles, Copy, Check } from 'lucide-react'

export default function CreateContentPage() {
  const [url, setUrl] = useState('')
  const [contentType, setContentType] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedPosts, setGeneratedPosts] = useState<any[]>([])
  const [suggestedSubreddits, setSuggestedSubreddits] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [copiedItem, setCopiedItem] = useState<string | null>(null)

  const handleCopy = async (text: string, itemId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedItem(itemId)
      setTimeout(() => setCopiedItem(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleGenerate = async (options?: { append?: boolean }) => {
    if (!url.trim()) {
      alert('Please enter a URL')
      return
    }

    const append = options?.append ?? false

    setIsGenerating(true)
    setError(null)
    
    if (!append) {
      setGeneratedPosts([])
      setSuggestedSubreddits([])
    }
    
    try {
      const response = await fetch('/api/promote/create-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          url: url.trim(),
          contentType: contentType.trim()
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate content')
      }

      const data = await response.json()
      setGeneratedPosts(prev => append ? [...prev, ...(data.posts || [])] : (data.posts || []))
      setSuggestedSubreddits(prev => {
        const newSubs = data.suggestedSubreddits || []
        if (append) {
          const merged = [...prev, ...newSubs]
          return Array.from(new Set(merged))
        }
        return newSubs
      })
    } catch (err: any) {
      console.error('Error generating content:', err)
      setError(err.message || 'Failed to generate content. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerateMore = () => handleGenerate({ append: true })

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900">Create Content</h1>
            </div>
          </div>

          {/* Note */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-8 mb-8">
            <p className="text-lg text-gray-700 leading-relaxed mb-4">
              <strong>Truleado</strong> will help you create content that resonates with Reddit audiences. We'll analyze your URL and generate authentic, human-written Reddit posts that naturally engage communities without coming across as salesy or promotional.
            </p>
            <div className="space-y-2 text-sm text-gray-600">
              <p className="font-semibold text-gray-900">How to use:</p>
              <p>1. Drop any URL - be it your homepage or a blog post</p>
              <p>2. Click "Create Content" to generate Reddit-ready posts</p>
              <p className="text-purple-700 font-medium mt-2">Get value by sharing content that actually helps Reddit users, building genuine engagement and authority.</p>
            </div>
          </div>

              {/* URL Input */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Enter Your URL</h2>
                <p className="text-gray-600 mb-4 text-sm">
                  Provide any URL from your website (homepage, blog post, product page, etc.)
                </p>
                <div className="space-y-4">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://yourwebsite.com or https://yourblog.com/article"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    disabled={isGenerating}
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What type of content do you need?
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      Examples: promotional, informational, educational, case study, tutorial, product launch
                    </p>
                    <input
                      type="text"
                      value={contentType}
                      onChange={(e) => setContentType(e.target.value)}
                      placeholder="e.g., promotional, informational, educational"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      disabled={isGenerating}
                    />
                  </div>
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !url.trim()}
                    className="w-full px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        <span>Create Content</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Generated Content */}
          {(suggestedSubreddits.length > 0 || generatedPosts.length > 0) && (
            <div className="space-y-6">
              {/* Suggested Subreddits */}
              {suggestedSubreddits.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Suggested Subreddits</h2>
                  <div className="flex flex-wrap gap-2">
                    {suggestedSubreddits.map((subreddit: string, idx: number) => {
                      const cleanSubreddit = subreddit.startsWith('r/') ? subreddit.substring(2) : subreddit
                      return (
                        <a
                          key={`${subreddit}-${idx}`}
                          href={`https://reddit.com/r/${cleanSubreddit}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
                        >
                          r/{cleanSubreddit}
                        </a>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Generated Posts */}
              {generatedPosts.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                  <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                    <div>
                      <h2 className="text-2xl font-semibold text-gray-900">Generated Reddit Posts</h2>
                      <p className="text-sm text-gray-500">Each batch creates 3 new post ideas.</p>
                    </div>
                    <button
                      onClick={handleGenerateMore}
                      disabled={isGenerating}
                      className="inline-flex items-center px-5 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate 3 More Posts
                        </>
                      )}
                    </button>
                  </div>
                      <div className="space-y-6">
                        {generatedPosts.map((post: any, idx: number) => {
                          const titleId = `post-${idx}-title`
                          const descriptionId = `post-${idx}-description`
                          const isTitleCopied = copiedItem === titleId
                          const isDescCopied = copiedItem === descriptionId
                          
                          return (
                            <div key={idx} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                              <div className="mb-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Post {idx + 1}</h3>
                                
                                {/* Title Section */}
                                <div className="mb-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-semibold text-gray-700">Title:</label>
                                    <button
                                      onClick={() => handleCopy(post.title, titleId)}
                                      className="flex items-center space-x-1 px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                                    >
                                      {isTitleCopied ? (
                                        <>
                                          <Check className="w-4 h-4" />
                                          <span>Copied!</span>
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="w-4 h-4" />
                                          <span>Copy</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <p className="text-gray-900 font-medium">{post.title}</p>
                                  </div>
                                </div>
                                
                                {/* Description Section */}
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-semibold text-gray-700">Description:</label>
                                    <button
                                      onClick={() => handleCopy(post.description, descriptionId)}
                                      className="flex items-center space-x-1 px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                                    >
                                      {isDescCopied ? (
                                        <>
                                          <Check className="w-4 h-4" />
                                          <span>Copied!</span>
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="w-4 h-4" />
                                          <span>Copy</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <p className="text-gray-700">{post.description}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
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

