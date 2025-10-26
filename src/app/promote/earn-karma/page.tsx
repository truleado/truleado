'use client'

import { useState } from 'react'
import AppLayout from '@/components/app-layout'
import { TrendingUp, Search, Loader2, MessageSquare, ExternalLink } from 'lucide-react'

export default function EarnKarmaPage() {
  const [topic, setTopic] = useState('')
  const [redditResults, setRedditResults] = useState<any>(null)
  const [isSearchingReddit, setIsSearchingReddit] = useState(false)

  const handleSearch = async () => {
    if (!topic.trim()) {
      alert('Please enter a topic')
      return
    }

    setIsSearchingReddit(true)
    try {
      const allPosts: any[] = []

      // Build search terms from the topic
      const searchTerms = [
        topic.trim(),
        `${topic.trim()} problem`,
        `${topic.trim()} help`,
        `${topic.trim()} question`
      ]

      // Search for each term
      for (const searchTerm of searchTerms.slice(0, 3)) {
        try {
          const searchResponse = await fetch('/api/research/search-reddit-posts', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              keyword: searchTerm,
              limit: 5 // Get top 5 posts per search term
            }),
          })

          if (searchResponse.ok) {
            const data = await searchResponse.json()
            if (data.posts && Array.isArray(data.posts)) {
              allPosts.push(...data.posts)
            }
          }
        } catch (err) {
          console.error(`Error searching for "${searchTerm}":`, err)
        }
      }

      // Sort by engagement (score + comments) - prioritize posts with high engagement
      allPosts.sort((a, b) => {
        const engagementA = (a.score || 0) + (a.num_comments || 0)
        const engagementB = (b.score || 0) + (b.num_comments || 0)
        return engagementB - engagementA
      })

      // Remove duplicates and keep top 15 with high engagement
      const uniquePosts = Array.from(
        new Map(allPosts.map(post => [post.url, post])).values()
      ).slice(0, 15)

      setRedditResults({ posts: uniquePosts })
    } catch (error) {
      console.error('Error searching Reddit:', error)
      alert('Failed to search Reddit. Please try again.')
    } finally {
      setIsSearchingReddit(false)
    }
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900">Earn Karma</h1>
            </div>
          </div>

          {/* Note */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-8 mb-8">
            <p className="text-lg text-gray-700 leading-relaxed">
              Success on Reddit is built on genuine value and authentic engagement. We'll identify relevant posts where your expertise can genuinely help users, enabling you to contribute meaningfully while naturally building your reputation and karma. The key is finding the right moments to share knowledge that solves real problems—that's where sustainable growth happens.
            </p>
          </div>

          {/* Topic Input */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Enter Your Favorite Topic</h2>
            <p className="text-gray-600 mb-4 text-sm">
              Enter a topic you can provide value on (e.g., "SaaS marketing", "project management", "Python development")
            </p>
            <div className="flex space-x-4">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., SaaS marketing"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSearchingReddit}
              />
              <button
                onClick={handleSearch}
                disabled={isSearchingReddit || !topic.trim()}
                className="px-8 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isSearchingReddit ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    <span>Help Redditors</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Reddit Results */}
          {redditResults && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">
                  Reddit Opportunities
                  {isSearchingReddit && (
                    <span className="ml-3 text-sm font-normal text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                      Searching...
                    </span>
                  )}
                </h2>
              </div>

              {(() => {
                // Get posts from results
                const posts = redditResults.posts || []

                return posts.length > 0 ? (
                  <div className="space-y-6">
                    {posts.map((post: any, idx: number) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                            {post.title}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span className="flex items-center">
                              <MessageSquare className="w-4 h-4 mr-1" />
                              r/{post.subreddit}
                            </span>
                            <span className="flex items-center text-green-600">
                              ↑ {post.score || 0}
                            </span>
                            <span className="flex items-center text-blue-600">
                              💬 {post.num_comments || 0}
                            </span>
                            <span className="text-gray-500">
                              by u/{post.author}
                            </span>
                          </div>
                        </div>
                        <a
                          href={post.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-4 flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>View Post</span>
                        </a>
                      </div>

                      {post.selftext && (
                        <div className="bg-gray-50 p-4 rounded-lg mb-4">
                          <p className="text-gray-700 text-sm line-clamp-4">
                            {post.selftext.length > 200 ? `${post.selftext.substring(0, 200)}...` : post.selftext}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg">No Reddit opportunities found</p>
                  </div>
                )
              })()}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}

