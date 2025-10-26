'use client'

import Link from "next/link";
import { ArrowRight, Filter, Target, Zap, Users, TrendingUp, CheckCircle, Sparkles, BarChart3, Clock, Shield, Globe, Star, Brain, Search, Bell, Mail, Megaphone, Instagram, DollarSign, TrendingDown, Globe2, Award, CheckCircle2, PlayCircle } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/contexts/i18n-context";
import { LanguageSelector } from "@/components/LanguageSelector";
import { ResourcesDropdown } from "@/components/ResourcesDropdown";

export default function Home() {
  // Production-ready version with error handling
  const { user, loading } = useAuth();
  const router = useRouter();
  const { t } = useI18n();

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
    // Don't render anything, will redirect in useEffect
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <img src="/truleadologo.png" alt="Truleado" className="w-full h-full object-contain" />
          </div>
          <p className="text-gray-600 font-medium">Redirecting...</p>
        </div>
      </div>
    );
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
              <LanguageSelector />
              <ResourcesDropdown />
              <Link 
                href="/pricing" 
                className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
              >
                {t('nav.pricing')}
              </Link>
              <Link 
                href="/auth/signin" 
                className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
              >
                {t('nav.signin')}
              </Link>
              <Link 
                href="/auth/signup" 
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 lg:px-6 py-2 lg:py-2.5 rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {t('nav.getStarted')}
              </Link>
            </div>
            {/* Mobile menu button */}
            <div className="sm:hidden flex items-center space-x-2">
              <LanguageSelector />
              <Link 
                href="/auth/signup" 
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg"
              >
                {t('nav.getStarted')}
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
              {t('hero.badge')}
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6 leading-tight px-2 sm:px-4">
              {t('hero.title1')}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent block sm:inline"> {t('hero.title2')}</span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-gray-600 mb-4 sm:mb-6 max-w-4xl mx-auto leading-relaxed px-2 sm:px-4">
              {t('hero.subtitle')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-6 sm:mb-8 md:mb-12 px-2 sm:px-4">
              <Link 
                href="/auth/signup" 
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 rounded-lg sm:rounded-xl md:rounded-2xl text-sm sm:text-base md:text-lg font-semibold hover:from-blue-700 hover:to-indigo-700 flex items-center justify-center transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
              >
                {t('hero.cta1')}
                <ArrowRight className="ml-1.5 sm:ml-2 w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
              </Link>
              <Link 
                href="/pricing" 
                className="border-2 border-gray-200 text-gray-700 px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 rounded-lg sm:rounded-xl md:rounded-2xl text-sm sm:text-base md:text-lg font-semibold hover:bg-gray-50 hover:border-gray-300 flex items-center justify-center transition-all duration-200"
              >
                {t('hero.cta2')}
              </Link>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-3xl mx-auto px-2 sm:px-4">
              <div className="text-center">
                <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-1">{t('hero.stat1')}</div>
                <div className="text-xs sm:text-sm md:text-base text-gray-600">{t('hero.stat1Desc')}</div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-1">{t('hero.stat2')}</div>
                <div className="text-xs sm:text-sm md:text-base text-gray-600">{t('hero.stat2Desc')}</div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-1">{t('hero.stat3')}</div>
                <div className="text-xs sm:text-sm md:text-base text-gray-600">{t('hero.stat3Desc')}</div>
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
              {t('features.title')}
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto px-2">
              {t('features.subtitle')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
            
            <div className="text-center group">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-200">
                <Search className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white" />
              </div>
              <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-2 sm:mb-3 md:mb-4">{t('features.1.title')}</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed px-2">
                {t('features.1.desc')}
              </p>
            </div>
            
            <div className="text-center group">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-200">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white" />
              </div>
              <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-2 sm:mb-3 md:mb-4">{t('features.2.title')}</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed px-2">
                {t('features.2.desc')}
              </p>
            </div>
            
            <div className="text-center group">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-200">
                <Brain className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white" />
              </div>
              <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-2 sm:mb-3 md:mb-4">{t('features.3.title')}</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed px-2">
                {t('features.3.desc')}
              </p>
            </div>
            
            <div className="text-center group">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-200">
                <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white" />
              </div>
              <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-2 sm:mb-3 md:mb-4">{t('features.4.title')}</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed px-2">
                {t('features.4.desc')}
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
                {t('benefits.title')}
              </h2>
              <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8">
                {t('benefits.subtitle')}
              </p>
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-start group">
                  <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
                    <Search className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">{t('benefits.1.title')}</h3>
                    <p className="text-sm sm:text-base text-gray-600">{t('benefits.1.desc')}</p>
                  </div>
                </div>
                
                <div className="flex items-start group">
                  <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <Brain className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">{t('benefits.2.title')}</h3>
                    <p className="text-sm sm:text-base text-gray-600">{t('benefits.2.desc')}</p>
                  </div>
                </div>
                
                <div className="flex items-start group">
                  <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                    <Users className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">{t('benefits.3.title')}</h3>
                    <p className="text-sm sm:text-base text-gray-600">{t('benefits.3.desc')}</p>
                  </div>
                </div>
                
                <div className="flex items-start group">
                  <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-indigo-100 rounded-xl flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                    <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" />
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">{t('benefits.4.title')}</h3>
                    <p className="text-sm sm:text-base text-gray-600">{t('benefits.4.desc')}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl">
              <div className="space-y-6 sm:space-y-8">
                <div className="flex items-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <Search className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">Any Website</p>
                    <p className="text-sm sm:text-base text-gray-600">Research & Analysis</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                    <Users className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">Strategic</p>
                    <p className="text-sm sm:text-base text-gray-600">Reddit Opportunities</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <Brain className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">AI-Generated</p>
                    <p className="text-sm sm:text-base text-gray-600">Pitch Ideas</p>
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
              {t('pricing.title')}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('pricing.subtitle')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto">
            {/* Free Trial Card */}
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-gray-200 p-6 sm:p-8 hover:shadow-2xl transition-shadow duration-300">
              <div className="text-center">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{t('pricing.trial.title')}</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">{t('pricing.trial.desc')}</p>
                
                <div className="mb-6 sm:mb-8">
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl sm:text-5xl font-bold text-gray-900">$0</span>
                    <span className="text-lg sm:text-xl text-gray-500 ml-2">for 7 days</span>
                  </div>
                  <p className="mt-2 text-xs sm:text-sm text-gray-600">No credit card required</p>
                </div>

                <Link 
                  href="/auth/signup" 
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-base sm:text-lg font-semibold hover:from-green-600 hover:to-green-700 flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {t('pricing.trial.cta')}
                  <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
                </Link>
              </div>

              <div className="mt-6 sm:mt-8 border-t border-gray-200 pt-6 sm:pt-8">
                <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">{t('pricing.trial.included')}</h4>
                <ul className="space-y-3 sm:space-y-4">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mt-1 mr-3 flex-shrink-0" />
                    <span className="text-sm sm:text-base text-gray-700">{t('pricing.trial.1')}</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mt-1 mr-3 flex-shrink-0" />
                    <span className="text-sm sm:text-base text-gray-700">{t('pricing.trial.2')}</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mt-1 mr-3 flex-shrink-0" />
                    <span className="text-sm sm:text-base text-gray-700">{t('pricing.trial.3')}</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mt-1 mr-3 flex-shrink-0" />
                    <span className="text-sm sm:text-base text-gray-700">{t('pricing.trial.4')}</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mt-1 mr-3 flex-shrink-0" />
                    <span className="text-sm sm:text-base text-gray-700">{t('pricing.trial.5')}</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mt-1 mr-3 flex-shrink-0" />
                    <span className="text-sm sm:text-base text-gray-700">{t('pricing.trial.6')}</span>
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
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{t('pricing.pro.title')}</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">{t('pricing.pro.desc')}</p>
                
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
                  {t('pricing.pro.cta')}
                  <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
                </Link>
              </div>

              <div className="mt-6 sm:mt-8 border-t border-gray-200 pt-6 sm:pt-8">
                <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">{t('pricing.pro.included')}</h4>
                <ul className="space-y-3 sm:space-y-4">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mt-1 mr-3 flex-shrink-0" />
                    <span className="text-sm sm:text-base text-gray-700">{t('pricing.pro.1')}</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mt-1 mr-3 flex-shrink-0" />
                    <span className="text-sm sm:text-base text-gray-700">{t('pricing.pro.2')}</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mt-1 mr-3 flex-shrink-0" />
                    <span className="text-sm sm:text-base text-gray-700">{t('pricing.pro.3')}</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mt-1 mr-3 flex-shrink-0" />
                    <span className="text-sm sm:text-base text-gray-700">{t('pricing.pro.4')}</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mt-1 mr-3 flex-shrink-0" />
                    <span className="text-sm sm:text-base text-gray-700">{t('pricing.pro.5')}</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mt-1 mr-3 flex-shrink-0" />
                    <span className="text-sm sm:text-base text-gray-700">{t('pricing.pro.6')}</span>
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
              {t('pricing.viewDetails')}
            </Link>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Trusted by SaaS Founders Worldwide
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Join hundreds of founders discovering high-quality Reddit leads every day
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Award className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-gray-900">500+</div>
                  <div className="text-sm text-gray-600">Active Users</div>
                </div>
              </div>
              <p className="text-gray-700">Founders actively finding Reddit leads and growing their businesses</p>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-gray-900">10K+</div>
                  <div className="text-sm text-gray-600">Reddit Leads Found</div>
                </div>
              </div>
              <p className="text-gray-700">Strategic opportunities discovered and converted into customers</p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-gray-900">4.9/5</div>
                  <div className="text-sm text-gray-600">Average Rating</div>
                </div>
              </div>
              <p className="text-gray-700">Rated highly by founders for quality leads and AI insights</p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Case Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-gray-50 to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Perfect for Every SaaS Stage
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Whether you're launching or scaling, Truleado adapts to your growth journey
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Startups Launching</h3>
              <p className="text-gray-600 mb-4">
                Find your first 100 customers by discovering where people discuss problems you solve.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Identify target audience pain points
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Get AI-generated pitch ideas
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  No cold emails, just warm conversations
                </li>
              </ul>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Growing SaaS Companies</h3>
              <p className="text-gray-600 mb-4">
                Scale your lead generation without scaling your team. Find more opportunities, faster.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Unlimited website research
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Discover hundreds of opportunities daily
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Track performance with analytics
                </li>
              </ul>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Established Brands</h3>
              <p className="text-gray-600 mb-4">
                Enter new markets and find niche communities where your product fits perfectly.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Research competitor positioning
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Discover untapped market segments
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Save and organize leads efficiently
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ROI Section */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-8 sm:p-12 text-white">
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
                ROI That Speaks for Itself
              </h2>
              <p className="text-xl text-blue-100 max-w-3xl mx-auto">
                Stop wasting time on cold emails that get ignored. Truleado helps you find people actively seeking solutions.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
                <div className="text-4xl font-bold mb-2">87%</div>
                <div className="text-blue-100">Conversion Rate</div>
                <p className="text-sm text-blue-200 mt-2">Higher response when reaching out to active Reddit discussions</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
                <div className="text-4xl font-bold mb-2">10x</div>
                <div className="text-blue-100">Faster Results</div>
                <p className="text-sm text-blue-200 mt-2">Discover leads in minutes vs. hours of manual research</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
                <div className="text-4xl font-bold mb-2">$29</div>
                <div className="text-blue-100">Per Month</div>
                <p className="text-sm text-blue-200 mt-2">Less than $1 per day for unlimited lead discovery</p>
              </div>
            </div>
            
            <div className="flex justify-center">
              <Link 
                href="/auth/signup" 
                className="bg-white text-blue-600 px-8 py-4 rounded-2xl text-lg font-semibold hover:bg-gray-100 inline-flex items-center justify-center transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
              >
                Start Finding Leads Today
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              {t('cta.title')}
            </h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-8">
              {t('cta.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/auth/signup" 
                className="bg-white text-blue-600 px-8 py-4 rounded-2xl text-lg font-semibold hover:bg-gray-100 inline-flex items-center justify-center transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
              >
                {t('cta.1')}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link 
                href="/pricing" 
                className="border-2 border-white text-white px-8 py-4 rounded-2xl text-lg font-semibold hover:bg-white hover:text-blue-600 inline-flex items-center justify-center transition-all duration-200"
              >
                {t('cta.2')}
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
                {t('footer.tagline')}
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
              <h3 className="text-white font-semibold mb-6">{t('footer.product')}</h3>
              <ul className="space-y-3">
                <li><a href="/auth/signup" className="text-gray-400 hover:text-white transition-colors text-sm">{t('footer.getStarted')}</a></li>
                <li><a href="/auth/signin" className="text-gray-400 hover:text-white transition-colors text-sm">{t('footer.signin')}</a></li>
                <li><a href="/pricing" className="text-gray-400 hover:text-white transition-colors text-sm">{t('footer.pricing')}</a></li>
                <li><a href="/dashboard" className="text-gray-400 hover:text-white transition-colors text-sm">{t('footer.dashboard')}</a></li>
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h3 className="text-white font-semibold mb-6">{t('footer.legal')}</h3>
              <ul className="space-y-3">
                <li><a href="/terms" className="text-gray-400 hover:text-white transition-colors text-sm">{t('footer.terms')}</a></li>
                <li><a href="/privacy" className="text-gray-400 hover:text-white transition-colors text-sm">{t('footer.privacy')}</a></li>
                <li><a href="/refund" className="text-gray-400 hover:text-white transition-colors text-sm">{t('footer.refund')}</a></li>
                <li><a href="/cookie-policy" className="text-gray-400 hover:text-white transition-colors text-sm">{t('footer.cookie')}</a></li>
                <li><a href="/gdpr" className="text-gray-400 hover:text-white transition-colors text-sm">{t('footer.gdpr')}</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-gray-800 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-center md:text-left">
                <p className="text-gray-400 text-sm mb-2">
                  {t('footer.madeWith')} <span className="text-yellow-400">☕</span> {t('footer.madeWith').includes('on') ? '' : 'on'} <span className="text-blue-400">🌍</span>
                </p>
                <p className="text-gray-400 text-sm">
                  {t('footer.copyright')}
                </p>
              </div>
              <div className="mt-4 md:mt-0 flex space-x-6">
                <a href="/support" className="text-gray-400 hover:text-white transition-colors text-sm">{t('footer.support')}</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}