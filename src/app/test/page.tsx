'use client'

import { useState } from 'react'
import AppLayout from '@/components/app-layout'
import { TestTube, Play, CheckCircle, XCircle, Loader } from 'lucide-react'

export default function TestPage() {
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<any>(null)

  const runTests = async () => {
    setIsRunning(true)
    setResults(null)
    
    try {
      const response = await fetch('/api/debug/test-everything')
      const data = await response.json()
      setResults(data)
    } catch (error) {
      setResults({
        success: false,
        error: 'Failed to run tests',
        details: error.message
      })
    } finally {
      setIsRunning(false)
    }
  }

  const createTestUser = async () => {
    setIsRunning(true)
    setResults(null)
    
    try {
      const response = await fetch('/api/debug/create-test-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await response.json()
      setResults(data)
    } catch (error) {
      setResults({
        success: false,
        error: 'Failed to create test user',
        details: error.message
      })
    } finally {
      setIsRunning(false)
    }
  }

  const loginTestUser = async () => {
    setIsRunning(true)
    setResults(null)
    
    try {
      const response = await fetch('/api/debug/login-test-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await response.json()
      setResults(data)
    } catch (error) {
      setResults({
        success: false,
        error: 'Failed to login test user',
        details: error.message
      })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center">
                <TestTube className="h-6 w-6 text-blue-600 mr-3" />
                <h1 className="text-2xl font-bold text-gray-900">Test Center</h1>
              </div>
              <p className="mt-2 text-gray-600">
                Testing and development tools for debugging and validation
              </p>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <button
                  onClick={runTests}
                  disabled={isRunning}
                  className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isRunning ? (
                    <Loader className="h-5 w-5 animate-spin mr-2" />
                  ) : (
                    <Play className="h-5 w-5 mr-2" />
                  )}
                  Run All Tests
                </button>

                <button
                  onClick={createTestUser}
                  disabled={isRunning}
                  className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isRunning ? (
                    <Loader className="h-5 w-5 animate-spin mr-2" />
                  ) : (
                    <TestTube className="h-5 w-5 mr-2" />
                  )}
                  Create Test User
                </button>

                <button
                  onClick={loginTestUser}
                  disabled={isRunning}
                  className="flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isRunning ? (
                    <Loader className="h-5 w-5 animate-spin mr-2" />
                  ) : (
                    <CheckCircle className="h-5 w-5 mr-2" />
                  )}
                  Login Test User
                </button>
              </div>

              {results && (
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    {results.success ? (
                      <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-600 mr-2" />
                    )}
                    <h3 className="text-lg font-semibold text-gray-900">
                      {results.success ? 'Test Results' : 'Test Failed'}
                    </h3>
                  </div>

                  {results.success ? (
                    <div>
                      <p className="text-gray-700 mb-4">{results.message}</p>
                      
                      {results.results && (
                        <div className="space-y-4">
                          <h4 className="font-medium text-gray-900">Detailed Results:</h4>
                          {Object.entries(results.results).map(([test, result]: [string, any]) => (
                            <div key={test} className="bg-white rounded-lg p-4 border border-gray-200">
                              <div className="flex items-center mb-2">
                                {result.status === 'success' ? (
                                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                                ) : result.status === 'warning' ? (
                                  <div className="h-5 w-5 bg-yellow-500 rounded-full mr-2" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-red-600 mr-2" />
                                )}
                                <span className="font-medium text-gray-900 capitalize">
                                  {test.replace(/([A-Z])/g, ' $1').trim()}
                                </span>
                              </div>
                              <p className="text-gray-600 text-sm">{result.message}</p>
                              {result.details && (
                                <div className="mt-2 text-xs text-gray-500">
                                  <pre className="whitespace-pre-wrap">
                                    {JSON.stringify(result.details, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {results.user && (
                        <div className="mt-6 bg-blue-50 rounded-lg p-4">
                          <h4 className="font-medium text-blue-900 mb-2">Test User Created:</h4>
                          <p className="text-blue-800">
                            <strong>Email:</strong> {results.user.email}<br />
                            <strong>Password:</strong> {results.user.password}
                          </p>
                        </div>
                      )}

                      {results.counts && (
                        <div className="mt-4 bg-green-50 rounded-lg p-4">
                          <h4 className="font-medium text-green-900 mb-2">Data Created:</h4>
                          <p className="text-green-800">
                            <strong>Products:</strong> {results.counts.products}<br />
                            <strong>Leads:</strong> {results.counts.leads}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <p className="text-red-700 mb-2">
                        <strong>Error:</strong> {results.error}
                      </p>
                      {results.details && (
                        <p className="text-red-600 text-sm">{results.details}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="mt-8 bg-yellow-50 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 mb-2">Instructions:</h4>
                <ul className="text-yellow-800 text-sm space-y-1">
                  <li>• <strong>Run All Tests:</strong> Tests database, authentication, Reddit API, AI analysis, and lead discovery</li>
                  <li>• <strong>Create Test User:</strong> Creates a test user with sample products and leads</li>
                  <li>• <strong>Login Test User:</strong> Logs in the test user to access the application</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
