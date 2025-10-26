'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { 
  Filter, 
  LayoutDashboard, 
  Package, 
  Users, 
  Settings, 
  Menu, 
  X, 
  LogOut,
  User,
  ChevronRight,
  ChevronDown,
  Megaphone,
  Plane,
  BarChart3
} from 'lucide-react'
import { TrialBanner } from './TrialBanner'
import { NotificationBell } from './NotificationBell'
import { UpgradeRequiredModal } from './UpgradeRequiredModal'
import { useTrial } from '@/hooks/use-trial'

// Custom Reddit Icon Component
const RedditIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
  </svg>
)

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, description: 'Overview & analytics' },
  { 
    name: 'Reddit', 
    icon: RedditIcon, 
    description: 'Reddit tools and features',
    children: [
      { name: 'Research', href: '/research', icon: Plane, description: 'Website research and Reddit lead discovery' },
      { name: 'Reddit Leads', href: '/reddit-leads', icon: Users, description: 'Saved Reddit opportunities' },
      { name: 'Track Leads', href: '/track-leads', icon: BarChart3, description: 'Track and monitor lead performance' },
      { name: 'Promote', href: '/promote', icon: Megaphone, description: 'Generate promotional posts' },
    ]
  },
  { name: 'Settings', href: '/settings', icon: Settings, description: 'Account & preferences' },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [redditSectionOpen, setRedditSectionOpen] = useState(true)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [redditLeadsCount, setRedditLeadsCount] = useState(0)
  const [trackLeadsCount, setTrackLeadsCount] = useState(0)
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut } = useAuth()
  const { showUpgradePrompt, trialTimeRemaining, handleUpgrade, isUpgrading } = useTrial()

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }


  // Show upgrade modal if trial is expiring or expired
  React.useEffect(() => {
    if (user && showUpgradePrompt && !showUpgradeModal) {
      setShowUpgradeModal(true)
    }
  }, [user, showUpgradePrompt, showUpgradeModal])

  // Fetch counts for sidebar badges
  React.useEffect(() => {
    const fetchCounts = async () => {
      if (user) {
        try {
          // Fetch Reddit leads count
          const redditResponse = await fetch('/api/reddit-leads')
          if (redditResponse.ok) {
            const redditData = await redditResponse.json()
            const redditLeadsArray = Array.isArray(redditData) ? redditData : (redditData?.leads || [])
            setRedditLeadsCount(redditLeadsArray.length)
          }

          // Fetch track leads count (from leads table)
          const trackResponse = await fetch('/api/leads')
          if (trackResponse.ok) {
            const trackData = await trackResponse.json()
            const trackLeadsArray = Array.isArray(trackData) ? trackData : (trackData?.leads || [])
            setTrackLeadsCount(Array.isArray(trackLeadsArray) ? trackLeadsArray.length : 0)
          }
        } catch (error) {
          console.error('Error fetching counts:', error)
        }
      }
    }

    fetchCounts()
    
    // Refresh counts every 30 seconds
    const interval = setInterval(fetchCounts, 30000)
    return () => clearInterval(interval)
  }, [user])


  const handleUpgradeClick = async () => {
    await handleUpgrade()
    setShowUpgradeModal(false)
  }

  // Helper function to check if any child route is active
  const isChildRouteActive = (children: any[]) => {
    return children.some(child => pathname === child.href)
  }

  // Helper function to render navigation items
  const renderNavigationItem = (item: any, isMobile = false) => {
    if (item.children) {
      // This is a collapsible section
      const isActive = isChildRouteActive(item.children)
      const isRedditSection = item.name === 'Reddit'
      const isOpen = isRedditSection ? redditSectionOpen : true
      const setSectionOpen = isRedditSection ? setRedditSectionOpen : () => {}
      
      return (
        <div key={item.name}>
          <button
            onClick={() => setSectionOpen(!isOpen)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive
                ? 'bg-[#e6f4ff] text-[#0c6bc7]'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center space-x-3">
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
            </div>
            {isOpen ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
          
          {/* Collapsible children */}
          {isOpen && (
            <div className="ml-4 mt-1 space-y-1">
              {item.children.map((child: any) => {
                const isChildActive = pathname === child.href
                const count = child.name === 'Reddit Leads' ? redditLeadsCount : 
                             child.name === 'Track Leads' ? trackLeadsCount : null
                return (
                  <Link
                    key={child.name}
                    href={child.href}
                    className={`flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isChildActive
                        ? 'bg-[#e6f4ff] text-[#0c6bc7]'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    onClick={() => isMobile && setSidebarOpen(false)}
                  >
                    <div className="flex items-center space-x-3">
                      <child.icon className="w-4 h-4" />
                      <span>{child.name}</span>
                    </div>
                    {count !== null && count > 0 && (
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                        isChildActive
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-200 text-gray-700'
                      }`}>
                        {count}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )
    } else {
      // This is a regular navigation item
      const isActive = pathname === item.href
      return (
        <Link
          key={item.name}
          href={item.href}
          className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            isActive
              ? 'bg-[#e6f4ff] text-[#0c6bc7]'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
          onClick={() => isMobile && setSidebarOpen(false)}
        >
          <item.icon className="w-5 h-5" />
          <span>{item.name}</span>
        </Link>
      )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 sm:w-72 flex-col bg-white shadow-xl">
          <div className="flex h-14 sm:h-16 items-center justify-between px-4">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center">
                <img 
                  src="/truleadologo.png" 
                  alt="Truleado" 
                  className="w-full h-full object-contain" 
                />
              </div>
              <span className="text-lg sm:text-xl font-semibold text-gray-900">Truleado</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-2">
            {navigation.map((item) => renderNavigationItem(item, true))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex h-16 items-center px-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                <img 
                  src="/truleadologo.png" 
                  alt="Truleado" 
                  className="w-full h-full object-contain" 
                />
              </div>
              <span className="text-xl font-semibold text-gray-900">Truleado</span>
            </div>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-2">
            {navigation.map((item) => renderNavigationItem(item, false))}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Trial Banner */}
        <TrialBanner />
        
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-14 sm:h-16 shrink-0 items-center gap-x-3 sm:gap-x-4 border-b border-gray-200 bg-white px-3 sm:px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2 p-2 sm:-m-2.5 sm:p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>

          <div className="flex flex-1 gap-x-3 sm:gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1" />
            <div className="flex items-center gap-x-3 sm:gap-x-4 lg:gap-x-6">
              {/* Notifications */}
              <NotificationBell />
              
              {/* User menu */}
              <div className="relative">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-32 sm:max-w-none">
                      {user?.email}
                    </p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                    title="Sign out"
                  >
                    <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-4 sm:py-6">
          <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-8">
            {children}
          </div>
        </main>
      </div>


      {/* Upgrade Required Modal */}
      <UpgradeRequiredModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onUpgrade={handleUpgradeClick}
        trialTimeRemaining={trialTimeRemaining}
        isLoading={isUpgrading}
      />
    </div>
  )
}

