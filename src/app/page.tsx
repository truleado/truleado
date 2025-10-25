'use client'

import Link from "next/link";
import { ArrowRight, Filter, Target, Zap, Users, TrendingUp, CheckCircle, Sparkles, BarChart3, Clock, Shield, Globe, Star, Brain, Search, Bell, Mail, Megaphone, Instagram } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  // Production-ready version with error handling
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    try {
      if (!loading && user) {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Home page error:', error);
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <img src="/truleadologo.png" alt="Truleado" className="w-full h-full object-contain" />
          </div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect to dashboard
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center shadow-lg">
                  <img src="/truleadologo.png" alt="Truleado" className="w-full h-full object-contain" />
                </div>
                <span className="ml-2 sm:ml-3 text-lg sm:text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Truleado</span>
              </div>
            </div>
            <div className="hidden sm:flex items-center space-x-4 lg:space-x-6">
              <Link 
                href="/pricing" 
                className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
              >
                Pricing
              </Link>
              <Link 
                href="/auth/signin" 
                className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link 
                href="/auth/signup" 
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 lg:px-6 py-2 lg:py-2.5 rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Get Started
              </Link>
            </div>
            {/* Mobile menu button */}
            <div className="sm:hidden">
              <Link 
                href="/auth/signup" 
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-12 sm:py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-indigo-600/5 to-purple-600/5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-blue-100 text-blue-800 text-xs sm:text-sm font-medium mb-4 sm:mb-6">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              AI-Powered Lead Generation
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6 leading-tight px-2 sm:px-4">
              Find Quality Leads on
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent block sm:inline"> Reddit</span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-gray-600 mb-4 sm:mb-6 max-w-4xl mx-auto leading-relaxed px-2 sm:px-4">
              Find your next customers on Reddit by discovering people actively discussing problems your product solves. 
              <span className="font-semibold text-gray-800"> Powered by AI analysis.</span>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-6 sm:mb-8 md:mb-12 px-2 sm:px-4">
              <Link 
                href="/auth/signup" 
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 rounded-lg sm:rounded-xl md:rounded-2xl text-sm sm:text-base md:text-lg font-semibold hover:from-blue-700 hover:to-indigo-700 flex items-center justify-center transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
              >
                Start Free Trial
                <ArrowRight className="ml-1.5 sm:ml-2 w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
              </Link>
              <Link 
                href="/pricing" 
                className="border-2 border-gray-200 text-gray-700 px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 rounded-lg sm:rounded-xl md:rounded-2xl text-sm sm:text-base md:text-lg font-semibold hover:bg-gray-50 hover:border-gray-300 flex items-center justify-center transition-all duration-200"
              >
                View Pricing
              </Link>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-3xl mx-auto px-2 sm:px-4">
              <div className="text-center">
                <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-1">1000+</div>
                <div className="text-xs sm:text-sm md:text-base text-gray-600">Leads Found Daily</div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-1">95%</div>
                <div className="text-xs sm:text-sm md:text-base text-gray-600">Accuracy Rate</div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-1">24/7</div>
                <div className="text-xs sm:text-sm md:text-base text-gray-600">Monitoring</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              How Truleado Works
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto px-2">
              Our AI-powered platform discovers Reddit conversations where people are actively seeking solutions your product provides.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            
            <div className="text-center group">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-200">
                <Target className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white" />
              </div>
              <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-2 sm:mb-3 md:mb-4">Define Your Product</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed px-2">
                Add your product details and let our AI understand what problems you solve and who your ideal customers are.
              </p>
            </div>
            
            <div className="text-center group">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-200">
                <Search className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white" />
              </div>
              <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-2 sm:mb-3 md:mb-4">Discover Reddit</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed px-2">
                We scan all relevant subreddits 24/7 to find discussions where people need your solution.
              </p>
            </div>
            
            <div className="text-center group">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-200">
                <Zap className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white" />
              </div>
              <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-2 sm:mb-3 md:mb-4">Get Notified</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed px-2">
                Receive instant notifications with full context from Reddit conversations when high-intent prospects appear.
              </p>
            </div>
            
            <div className="text-center group">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-200">
                <Megaphone className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white" />
              </div>
              <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-2 sm:mb-3 md:mb-4">Promote Your Product</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed px-2">
                Generate highly engaging Reddit posts tailored to each subreddit's rules and culture to promote your product.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 md:gap-16 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
                Why Choose Truleado?
              </h2>
              <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8">
                Stop wasting time on cold outreach. Find customers who are already looking for your solution.
              </p>
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-start group">
                  <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
                    <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">Real Conversation Context</h3>
                    <p className="text-sm sm:text-base text-gray-600">Get the exact Reddit post that proves they're interested in your solution.</p>
                  </div>
                </div>
                
                <div className="flex items-start group">
                  <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <Brain className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">AI-Powered Analysis</h3>
                    <p className="text-sm sm:text-base text-gray-600">Our AI filters out noise and finds only the most relevant opportunities.</p>
                  </div>
                </div>
                
                <div className="flex items-start group">
                  <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                    <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">Continuous Monitoring</h3>
                    <p className="text-sm sm:text-base text-gray-600">Background jobs run 24/7 to find new leads as they appear.</p>
                  </div>
                </div>
                
                <div className="flex items-start group">
                  <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-indigo-100 rounded-xl flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                    <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" />
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">Easy Integration</h3>
                    <p className="text-sm sm:text-base text-gray-600">Works seamlessly with your existing workflow and tools.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl">
              <div className="space-y-6 sm:space-y-8">
                <div className="flex items-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <Globe className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">All</p>
                    <p className="text-sm sm:text-base text-gray-600">Subreddits Monitored</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">24/7</p>
                    <p className="text-sm sm:text-base text-gray-600">Continuous Monitoring</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <Brain className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">AI-Powered</p>
                    <p className="text-sm sm:text-base text-gray-600">Smart Lead Filtering</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Start with a free trial and see how Truleado can help you find your next customers.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto">
            {/* Free Trial Card */}
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-gray-200 p-6 sm:p-8 hover:shadow-2xl transition-shadow duration-300">
              <div className="text-center">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Free Trial</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">Try everything for 1 day</p>
                
                <div className="mb-6 sm:mb-8">
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl sm:text-5xl font-bold text-gray-900">$0</span>
                    <span className="text-lg sm:text-xl text-gray-500 ml-2">for 1 day</span>
                  </div>
                  <p className="mt-2 text-xs sm:text-sm text-gray-600">No credit card required</p>
                </div>

                <Link 
                  href="/auth/signup" 
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-base sm:text-lg font-semibold hover:from-green-600 hover:to-green-700 flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
                </Link>
              </div>

              <div className="mt-6 sm:mt-8 border-t border-gray-200 pt-6 sm:pt-8">
                <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">What's included:</h4>
                <ul className="space-y-3 sm:space-y-4">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mt-1 mr-3 flex-shrink-0" />
                    <span className="text-sm sm:text-base text-gray-700">Full access to all features</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mt-1 mr-3 flex-shrink-0" />
                    <span className="text-sm sm:text-base text-gray-700">Unlimited product monitoring</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mt-1 mr-3 flex-shrink-0" />
                    <span className="text-sm sm:text-base text-gray-700">All subreddits monitored</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mt-1 mr-3 flex-shrink-0" />
                    <span className="text-sm sm:text-base text-gray-700">AI-powered lead analysis</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mt-1 mr-3 flex-shrink-0" />
                    <span className="text-sm sm:text-base text-gray-700">24/7 background monitoring</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mt-1 mr-3 flex-shrink-0" />
                    <span className="text-sm sm:text-base text-gray-700">AI-powered Reddit post generation</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Pro Plan Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl sm:rounded-3xl shadow-2xl border-2 border-blue-200 p-6 sm:p-8 relative hover:shadow-3xl transition-shadow duration-300">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
                  Most Popular
                </span>
              </div>
              
              <div className="text-center">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Pro Plan</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">Everything you need to find quality leads</p>
                
                <div className="mb-6 sm:mb-8">
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl sm:text-5xl font-bold text-gray-900">$29</span>
                    <span className="text-lg sm:text-xl text-gray-500 ml-2">/month</span>
                  </div>
                  <p className="mt-2 text-xs sm:text-sm text-gray-600">Less than $1 per day for unlimited leads</p>
                </div>

                <Link 
                  href="/auth/signup" 
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-base sm:text-lg font-semibold hover:from-blue-700 hover:to-indigo-700 flex items-center justify-center transition-all duration-200 shadow-xl hover:shadow-2xl"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
                </Link>
              </div>

              <div className="mt-6 sm:mt-8 border-t border-gray-200 pt-6 sm:pt-8">
                <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">What's included:</h4>
                <ul className="space-y-3 sm:space-y-4">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mt-1 mr-3 flex-shrink-0" />
                    <span className="text-sm sm:text-base text-gray-700">Unlimited product monitoring</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mt-1 mr-3 flex-shrink-0" />
                    <span className="text-sm sm:text-base text-gray-700">All subreddits monitored</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mt-1 mr-3 flex-shrink-0" />
                    <span className="text-sm sm:text-base text-gray-700">AI-powered lead analysis</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mt-1 mr-3 flex-shrink-0" />
                    <span className="text-sm sm:text-base text-gray-700">24/7 background monitoring</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mt-1 mr-3 flex-shrink-0" />
                    <span className="text-sm sm:text-base text-gray-700">Real-time lead notifications</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mt-1 mr-3 flex-shrink-0" />
                    <span className="text-sm sm:text-base text-gray-700">AI-powered Reddit post generation</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="mt-12 text-center">
            <Link 
              href="/pricing" 
              className="text-blue-600 hover:text-blue-700 font-semibold text-lg"
            >
              View detailed pricing →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Ready to Find Your Next Customers?
            </h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-8">
              Join hundreds of SaaS founders who are already finding quality leads on Reddit with Truleado.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/auth/signup" 
                className="bg-white text-blue-600 px-8 py-4 rounded-2xl text-lg font-semibold hover:bg-gray-100 inline-flex items-center justify-center transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
              >
                Start Your Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link 
                href="/pricing" 
                className="border-2 border-white text-white px-8 py-4 rounded-2xl text-lg font-semibold hover:bg-white hover:text-blue-600 inline-flex items-center justify-center transition-all duration-200"
              >
                View Pricing
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
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center">
                  <img 
                    src="/truleadologo.png" 
                    alt="Truleado" 
                    className="w-full h-full object-contain" 
                  />
                </div>
                <span className="ml-3 text-xl font-bold text-white">Truleado</span>
              </div>
              <p className="text-gray-400 text-sm mb-6 max-w-md leading-relaxed">
                Find your next customers on Reddit. Stop cold emailing strangers and discover relevant discussions where people are actively seeking your solution.
              </p>
              <div className="flex space-x-4">
                <a href="https://x.com/truleado" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="https://www.instagram.com/truleado/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">Instagram</span>
                  <Instagram className="h-5 w-5" />
                </a>
                <a href="https://www.facebook.com/truleado" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">Facebook</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Product Links */}
            <div>
              <h3 className="text-white font-semibold mb-6">Product</h3>
              <ul className="space-y-3">
                <li><a href="/auth/signup" className="text-gray-400 hover:text-white transition-colors text-sm">Get Started</a></li>
                <li><a href="/auth/signin" className="text-gray-400 hover:text-white transition-colors text-sm">Sign In</a></li>
                <li><a href="/pricing" className="text-gray-400 hover:text-white transition-colors text-sm">Pricing</a></li>
                <li><a href="/dashboard" className="text-gray-400 hover:text-white transition-colors text-sm">Dashboard</a></li>
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h3 className="text-white font-semibold mb-6">Legal</h3>
              <ul className="space-y-3">
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
              <div className="text-center md:text-left">
                <p className="text-gray-400 text-sm mb-2">
                  Made with <span className="text-yellow-400">☕</span> on <span className="text-blue-400">🌍</span>
                </p>
                <p className="text-gray-400 text-sm">
                  © 2025 Truleado Inc.
                </p>
              </div>
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