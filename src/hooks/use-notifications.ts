import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'

export interface BrowserNotification {
  id: string
  title: string
  body: string
  icon: string
  url: string
  read: boolean
  created_at: string
}

export function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<BrowserNotification[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications')
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission === 'denied') {
      console.warn('Notification permission denied')
      return false
    }

    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }, [])

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/notifications')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
      } else {
        setError('Failed to fetch notifications')
      }
    } catch (err) {
      setError('Failed to fetch notifications')
      console.error('Error fetching notifications:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  // Mark notifications as read
  const markAsRead = useCallback(async (notificationIds: string[]) => {
    if (!user || notificationIds.length === 0) return

    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationIds }),
      })

      if (response.ok) {
        // Update local state
        setNotifications(prev => 
          prev.map(notification => 
            notificationIds.includes(notification.id) 
              ? { ...notification, read: true }
              : notification
          )
        )
      }
    } catch (err) {
      console.error('Error marking notifications as read:', err)
    }
  }, [user])

  // Show browser notification
  const showNotification = useCallback((notification: BrowserNotification) => {
    if (Notification.permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.body,
        icon: notification.icon,
        tag: notification.id,
      })

      browserNotification.onclick = () => {
        window.focus()
        window.location.href = notification.url
        browserNotification.close()
      }

      // Auto-close after 5 seconds
      setTimeout(() => {
        browserNotification.close()
      }, 5000)
    }
  }, [])

  // Check for new notifications periodically
  useEffect(() => {
    if (!user) return

    // Fetch immediately
    fetchNotifications()

    // Set up polling every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)

    return () => clearInterval(interval)
  }, [user, fetchNotifications])

  // Show browser notifications for new unread notifications
  useEffect(() => {
    if (notifications.length === 0) return

    const unreadNotifications = notifications.filter(n => !n.read)
    
    // Show browser notification for the most recent unread notification
    const latestUnread = unreadNotifications[0]
    if (latestUnread) {
      showNotification(latestUnread)
    }
  }, [notifications, showNotification])

  // Initialize notification permission on mount
  useEffect(() => {
    requestPermission()
  }, [requestPermission])

  return {
    notifications,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    requestPermission,
    unreadCount: notifications.filter(n => !n.read).length,
  }
}
