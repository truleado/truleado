'use client'

import Link from "next/link";
import { Check, ArrowRight, Filter, Zap, Target, Users } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Pricing() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-[#148cfc] rounded-lg flex items-center justify-center mx-auto mb-4">
            <Filter className="w-5 h-5 text-white" />
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="w-8 h-8 bg-[#148cfc] rounded-lg flex items-center justify-center">
                  <Filter className="w-5 h-5 text-white" />
                </div>
                <span className="ml-2 text-xl font-semibold text-gray-900">Truleado</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/" 
                className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium"
              >
                Home
              </Link>
              <Link 
                href="/auth/signin" 
                className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium"
              >
                Sign In
              </Link>
              <Link 
                href="/auth/signup" 
                className="bg-[#148cfc] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#0d7ce8]"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Simple, Transparent Pricing
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 max-w-3xl mx-auto">
              Start with a free trial, then pay $29/month if you want to continue. No commitment required.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Trial Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900">Free Trial</h3>
                <p className="mt-2 text-gray-600">Try everything for 1 day</p>
                
                <div className="mt-8">
                  <div className="flex items-baseline justify-center">
                    <span className="text-5xl font-bold text-gray-900">$0</span>
                    <span className="text-xl text-gray-500 ml-1">for 1 day</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">No credit card required</p>
                </div>

                <div className="mt-8">
                  <Link 
                    href="/auth/signup" 
                    className="w-full bg-green-600 text-white px-6 py-3 rounded-md text-sm font-semibold hover:bg-green-700 flex items-center justify-center"
                  >
                    Start Free Trial
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </div>
              </div>

              <div className="mt-8 border-t border-gray-200 pt-8">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">What's included:</h4>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">Full access to all features</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">Unlimited product monitoring</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">All subreddits monitored</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">AI-powered lead analysis</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">24/7 background monitoring</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">Real-time lead notifications</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">Full conversation context</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">Export leads to CSV <span className="text-[#148cfc] font-medium">(Coming Soon)</span></span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Pro Plan Card */}
            <div className="bg-white rounded-2xl shadow-xl border-2 border-blue-200 p-8 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-[#148cfc] text-white px-4 py-1 rounded-full text-sm font-medium">Most Popular</span>
              </div>
              
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900">Pro Plan</h3>
                <p className="mt-2 text-gray-600">Everything you need to find quality leads</p>
                
                <div className="mt-8">
                  <div className="flex items-baseline justify-center">
                    <span className="text-5xl font-bold text-gray-900">$29</span>
                    <span className="text-xl text-gray-500 ml-1">/month</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">Less than $1 per day for unlimited leads</p>
                </div>

                <div className="mt-8">
                  <Link 
                    href="/auth/signup" 
                    className="w-full bg-[#148cfc] text-white px-6 py-3 rounded-md text-sm font-semibold hover:bg-[#0d7ce8] flex items-center justify-center"
                  >
                    Start Free Trial
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </div>
              </div>

              <div className="mt-8 border-t border-gray-200 pt-8">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">What's included:</h4>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">Unlimited product monitoring</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">All subreddits monitored</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">AI-powered lead analysis</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">24/7 background monitoring</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">Real-time lead notifications</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">Full conversation context</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">Export leads to CSV <span className="text-[#148cfc] font-medium">(Coming Soon)</span></span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">Email support</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Why Choose Truleado?
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Our AI-powered platform helps you find high-quality leads where they're already discussing their problems.
            </p>
          </div>
          
          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#148cfc] rounded-lg flex items-center justify-center mx-auto">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="mt-6 text-lg font-semibold text-gray-900">Targeted Discovery</h3>
              <p className="mt-2 text-gray-600">
                Find leads in relevant subreddits where people are actively seeking solutions.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-[#148cfc] rounded-lg flex items-center justify-center mx-auto">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="mt-6 text-lg font-semibold text-gray-900">AI-Powered Analysis</h3>
              <p className="mt-2 text-gray-600">
                Our AI filters out noise and identifies only the most promising opportunities.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-[#148cfc] rounded-lg flex items-center justify-center mx-auto">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="mt-6 text-lg font-semibold text-gray-900">Real Context</h3>
              <p className="mt-2 text-gray-600">
                Get the full Reddit conversation to understand exactly what they need.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Frequently Asked Questions
            </h2>
          </div>
          
          <div className="mt-16 max-w-3xl mx-auto">
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">How does the free trial work?</h3>
                <p className="mt-2 text-gray-600">
                  You get full access to all features for 1 day. No credit card required to start. You can choose to pay $29/month to continue, or simply stop using the service.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Can I cancel anytime?</h3>
                <p className="mt-2 text-gray-600">
                  Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your current billing period.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900">How many products can I monitor?</h3>
                <p className="mt-2 text-gray-600">
                  You can monitor unlimited products with your subscription. Add as many SaaS products as you want to find leads for.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900">What subreddits do you monitor?</h3>
                <p className="mt-2 text-gray-600">
                  We monitor all relevant subreddits including business, entrepreneurship, marketing, and industry-specific communities where people discuss problems and seek solutions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[#148cfc]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to Find Your Next Customers?
            </h2>
            <p className="mt-4 text-lg text-blue-100 max-w-2xl mx-auto">
              Start your free trial today. No credit card required. Pay only if you want to continue.
            </p>
            <div className="mt-8">
              <Link 
                href="/auth/signup" 
                className="bg-white text-[#148cfc] px-6 py-3 rounded-md text-sm font-semibold hover:bg-gray-100 inline-flex items-center"
              >
                Start Your Free Trial
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-[#148cfc] rounded-lg flex items-center justify-center">
                  <Filter className="w-5 h-5 text-white" />
                </div>
                <span className="ml-2 text-xl font-semibold text-white">Truleado</span>
              </div>
              <p className="text-gray-400 text-sm mb-4 max-w-md">
                Find your next customers on Reddit. Stop cold emailing strangers and discover relevant discussions where people are actively seeking your solution.
              </p>
            </div>

            {/* Product Links */}
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li><a href="/auth/signup" className="text-gray-400 hover:text-white transition-colors text-sm">Get Started</a></li>
                <li><a href="/auth/signin" className="text-gray-400 hover:text-white transition-colors text-sm">Sign In</a></li>
                <li><a href="/pricing" className="text-gray-400 hover:text-white transition-colors text-sm">Pricing</a></li>
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><a href="/terms" className="text-gray-400 hover:text-white transition-colors text-sm">Terms of Service</a></li>
                <li><a href="/privacy" className="text-gray-400 hover:text-white transition-colors text-sm">Privacy Policy</a></li>
                <li><a href="/refund" className="text-gray-400 hover:text-white transition-colors text-sm">Refund Policy</a></li>
                <li><a href="/cookie-policy" className="text-gray-400 hover:text-white transition-colors text-sm">Cookie Policy</a></li>
                <li><a href="/gdpr" className="text-gray-400 hover:text-white transition-colors text-sm">GDPR</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-gray-800 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm">
                © 2025 Truleado. All rights reserved.
              </p>
              <div className="mt-4 md:mt-0 flex space-x-6">
                <a href="/support" className="text-gray-400 hover:text-white transition-colors text-sm">Support</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
