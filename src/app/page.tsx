'use client'

import Link from "next/link";
import { ArrowRight, Filter, Target, Zap, Users, TrendingUp, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
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
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-[#148cfc] rounded-lg flex items-center justify-center">
                  <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <span className="ml-2 text-lg sm:text-xl font-semibold text-gray-900">Truleado</span>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link 
                href="/pricing" 
                className="text-gray-500 hover:text-gray-900 px-2 sm:px-3 py-2 text-sm font-medium hidden sm:block"
              >
                Pricing
              </Link>
              <Link 
                href="/auth/signin" 
                className="text-gray-500 hover:text-gray-900 px-2 sm:px-3 py-2 text-sm font-medium"
              >
                Sign In
              </Link>
              <Link 
                href="/auth/signup" 
                className="bg-[#148cfc] text-white px-3 sm:px-4 py-2 rounded-md text-sm font-medium hover:bg-[#0d7ce8]"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-white py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-gray-900">
              Engage with Your Audience on Reddit
            </h1>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg leading-7 sm:leading-8 text-gray-600 max-w-3xl mx-auto px-4">
              Stop cold emailing strangers. Discover relevant Reddit discussions where people are actively seeking solutions your SaaS product provides.
            </p>
            <div className="mt-8 sm:mt-10 flex items-center justify-center">
              <Link 
                href="/auth/signup" 
                className="bg-[#148cfc] text-white px-5 sm:px-6 py-3 rounded-md text-sm font-semibold hover:bg-[#0d7ce8] flex items-center"
              >
                Start Engaging
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900">
              How Truleado Works
            </h2>
            <p className="mt-3 sm:mt-4 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
              Our AI-powered social media engagement tool monitors Reddit conversations to find the perfect opportunities for your SaaS product.
            </p>
          </div>
          
          <div className="mt-12 sm:mt-16 grid grid-cols-1 gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#148cfc] rounded-lg flex items-center justify-center mx-auto">
                <Target className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <h3 className="mt-4 sm:mt-6 text-base sm:text-lg font-semibold text-gray-900">Define Your Product</h3>
              <p className="mt-2 text-sm sm:text-base text-gray-600">
                Add your SaaS product details and let our AI understand what problems you solve.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#148cfc] rounded-lg flex items-center justify-center mx-auto">
                <Filter className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <h3 className="mt-4 sm:mt-6 text-base sm:text-lg font-semibold text-gray-900">Monitor Reddit</h3>
              <p className="mt-2 text-sm sm:text-base text-gray-600">
                We scan all relevant subreddits to find discussions where people need your solution.
              </p>
            </div>
            
            <div className="text-center sm:col-span-2 lg:col-span-1">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#148cfc] rounded-lg flex items-center justify-center mx-auto">
                <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <h3 className="mt-4 sm:mt-6 text-base sm:text-lg font-semibold text-gray-900">Engage & Convert</h3>
              <p className="mt-2 text-sm sm:text-base text-gray-600">
                Connect with high-intent prospects with full context from the original Reddit conversations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Why Choose Truleado?
              </h2>
              <div className="mt-8 space-y-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-gray-900">Real Conversation Context</h3>
                    <p className="mt-1 text-gray-600">Get the exact Reddit post that proves they're interested in your solution.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-gray-900">AI-Powered Analysis</h3>
                    <p className="mt-1 text-gray-600">Our AI filters out noise and finds only the most relevant opportunities.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-gray-900">Continuous Monitoring</h3>
                    <p className="mt-1 text-gray-600">Background jobs run 24/7 to find new leads as they appear.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-gray-900">Easy Integration</h3>
                    <p className="mt-1 text-gray-600">Works seamlessly with your existing workflow and tools.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-8 rounded-lg">
              <div className="space-y-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-[#148cfc]" />
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-gray-900">All</p>
                    <p className="text-gray-600">Subreddits Monitored</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-[#148cfc]" />
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-gray-900">24/7</p>
                    <p className="text-gray-600">Continuous Monitoring</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Zap className="h-8 w-8 text-[#148cfc]" />
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-gray-900">AI-Powered</p>
                    <p className="text-gray-600">Smart Lead Filtering</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Simple Pricing
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Start with a free trial and see how Truleado can help you find your next customers.
            </p>
          </div>
          
          <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
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
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">Full access to all features</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">Unlimited product monitoring</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">All subreddits monitored</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">AI-powered lead analysis</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">24/7 background monitoring</span>
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
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">Unlimited product monitoring</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">All subreddits monitored</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">AI-powered lead analysis</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">24/7 background monitoring</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">Real-time lead notifications</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="mt-12 text-center">
            <Link 
              href="/pricing" 
              className="text-[#148cfc] hover:text-[#0c6bc7] font-medium"
            >
              View detailed pricing →
            </Link>
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
              Join hundreds of SaaS founders who are already finding quality leads on Reddit.
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
              <div className="flex space-x-4">
                <a href="https://x.com/truleado" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
              </div>
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