'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import LoadingSpinner from './LoadingSpinner'

interface PageTransitionProps {
  children: React.ReactNode
}

export default function PageTransition({ children }: PageTransitionProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [displayChildren, setDisplayChildren] = useState(children)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    // Start transition when pathname changes
    setIsTransitioning(true)
    setIsLoading(true)
    
    // Brief delay to prevent flash and allow smooth transition
    const timer = setTimeout(() => {
      setDisplayChildren(children)
      setIsLoading(false)
      setIsTransitioning(false)
    }, 50) // Very short delay

    return () => clearTimeout(timer)
  }, [pathname, children])

  return (
    <div className={`transition-all duration-200 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
      {isLoading ? (
        <div className="min-h-screen flex items-center justify-center bg-white">
          <LoadingSpinner size="lg" text="Loading page..." />
        </div>
      ) : (
        displayChildren
      )}
    </div>
  )
}
