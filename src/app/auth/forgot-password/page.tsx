'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { Filter, ArrowLeft, Mail, CheckCircle } from 'lucide-react'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
      } else {
        setError(data.error || 'Something went wrong')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    }
    
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#e6f4ff] via-white to-purple-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center space-x-2">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                <img 
                  src="/truleadologo.png" 
                  alt="Truleado" 
                  className="w-full h-full object-contain" 
                />
              </div>
              <span className="text-2xl font-bold text-gray-900">Truleado</span>
            </Link>
          </div>

          {/* Success Message */}
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Check your email</h1>
            <p className="text-gray-600 mb-6">
              We've sent a password reset link to <strong>{email}</strong>
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Didn't receive the email? Check your spam folder or try again.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setSuccess(false)
                  setEmail('')
                }}
                className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                Try different email
              </button>
              <Link
                href="/auth/signin"
                className="block w-full bg-gradient-to-r from-[#148cfc] to-[#0d7ce8] text-white py-3 px-4 rounded-lg font-semibold hover:from-[#0c6bc7] hover:to-[#0a5bb8] transition-all duration-200 text-center"
              >
                Back to sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e6f4ff] via-white to-purple-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center">
              <img 
                src="/truleadologo.png" 
                alt="Truleado" 
                className="w-full h-full object-contain" 
              />
            </div>
            <span className="text-2xl font-bold text-gray-900">Truleado</span>
          </Link>
        </div>

        {/* Forgot Password Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-[#e6f4ff] rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-[#148cfc]" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Forgot your password?</h1>
            <p className="text-gray-600 mt-2">No worries, we'll send you reset instructions.</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Enter your email"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#148cfc] to-[#0d7ce8] text-white py-3 px-4 rounded-lg font-semibold hover:from-[#0c6bc7] hover:to-[#0a5bb8] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send reset instructions'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link 
              href="/auth/signin" 
              className="inline-flex items-center text-[#148cfc] hover:text-[#0d7ce8] font-medium"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
