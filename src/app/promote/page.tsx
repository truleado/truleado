'use client'

import AppLayout from '@/components/app-layout'
import { Megaphone, Sparkles, Rocket, Zap } from 'lucide-react'

export default function PromotePage() {
  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto px-6">
          {/* Main Icon */}
          <div className="relative mb-8">
            <div className="w-32 h-32 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
              <Megaphone className="w-16 h-16 text-white" />
            </div>
            {/* Floating sparkles */}
            <div className="absolute -top-2 -right-2">
              <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse" />
            </div>
            <div className="absolute -bottom-2 -left-2">
              <Rocket className="w-6 h-6 text-pink-400 animate-bounce" />
            </div>
            <div className="absolute top-4 -left-4">
              <Zap className="w-5 h-5 text-orange-400 animate-pulse" />
            </div>
          </div>

          {/* Main Content */}
          <h1 className="text-5xl font-bold text-gray-900 mb-6 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Something Exciting is Coming Soon!
          </h1>
          
          <p className="text-xl text-gray-700 mb-8 leading-relaxed">
            We're working on something amazing that will revolutionize how you promote your products on Reddit. 
            Get ready for an incredible experience that will take your marketing to the next level! 🚀
          </p>

          {/* Features Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
              <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">AI-Powered</h3>
              <p className="text-gray-600 text-sm">Advanced AI technology for smarter promotion strategies</p>
            </div>
            
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Rocket className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Lightning Fast</h3>
              <p className="text-gray-600 text-sm">Generate high-quality content in seconds, not hours</p>
            </div>
            
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-red-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Game Changing</h3>
              <p className="text-gray-600 text-sm">Revolutionary features that will transform your workflow</p>
            </div>
          </div>

          {/* Call to Action */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white shadow-2xl">
            <h2 className="text-2xl font-bold mb-4">Stay Tuned!</h2>
            <p className="text-purple-100 mb-6">
              We're putting the finishing touches on something incredible. 
              Follow our updates to be the first to experience the future of Reddit marketing.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-3 bg-white text-purple-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg">
                Get Notified
              </button>
              <button className="px-8 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-purple-600 transition-colors">
                Learn More
              </button>
            </div>
          </div>

          {/* Footer */}
          <p className="text-gray-500 text-sm mt-8">
            Coming Soon • Powered by Advanced AI • Built for Success
          </p>
        </div>
      </div>
    </AppLayout>
  )
}