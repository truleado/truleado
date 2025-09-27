import { createClient } from '@/lib/supabase-server'
import { EmailService } from './email-service'

export interface NotificationPreferences {
  email: boolean
  newLeads: boolean
  weeklyReport: boolean
}

export interface NewLeadNotification {
  userId: string
  leadId: string
  productName: string
  subreddit: string
  title: string
  content: string
  author: string
  score: number
  url: string
}

export interface WeeklyReportData {
  userId: string
  userName: string
  userEmail: string
  weekStart: string
  weekEnd: string
  totalLeads: number
  newLeads: number
  topSubreddits: Array<{ name: string; count: number }>
  topProducts: Array<{ name: string; leads: number }>
}

export class NotificationService {
  /**
   * Get user notification preferences
   */
  static async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      const supabase = createClient()
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('notification_preferences')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching user preferences:', error)
        // Return default preferences if error
        return {
          email: true,
          newLeads: true,
          weeklyReport: true
        }
      }

      return profile.notification_preferences || {
        email: true,
        newLeads: true,
        weeklyReport: true
      }
    } catch (error) {
      console.error('Error in getUserPreferences:', error)
      return {
        email: true,
        newLeads: true,
        weeklyReport: true
      }
    }
  }

  /**
   * Send new lead notification (email + browser)
   */
  static async sendNewLeadNotification(notification: NewLeadNotification): Promise<{ success: boolean; error?: string }> {
    try {
      const preferences = await this.getUserPreferences(notification.userId)
      
      if (!preferences.email || !preferences.newLeads) {
        console.log(`User ${notification.userId} has disabled new lead notifications`)
        return { success: true }
      }

      // Send email notification
      const emailResult = await EmailService.sendNewLeadNotification({
        userEmail: notification.userEmail || '',
        userName: notification.userName || 'User',
        productName: notification.productName,
        subreddit: notification.subreddit,
        title: notification.title,
        content: notification.content,
        author: notification.author,
        score: notification.score,
        url: notification.url
      })

      if (!emailResult.success) {
        return { success: false, error: emailResult.error }
      }

      // TODO: Send browser notification (will implement next)
      await this.sendBrowserNotification(notification.userId, {
        title: `New Lead Found for ${notification.productName}`,
        body: `${notification.title} in r/${notification.subreddit}`,
        icon: '/favicon.ico',
        url: `/leads/${notification.leadId}`
      })

      return { success: true }
    } catch (error) {
      console.error('Error sending new lead notification:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Send weekly report notification (email only)
   */
  static async sendWeeklyReport(reportData: WeeklyReportData): Promise<{ success: boolean; error?: string }> {
    try {
      const preferences = await this.getUserPreferences(reportData.userId)
      
      if (!preferences.email || !preferences.weeklyReport) {
        console.log(`User ${reportData.userId} has disabled weekly report notifications`)
        return { success: true }
      }

      // Send email notification
      const emailResult = await EmailService.sendWeeklyReport({
        userEmail: reportData.userEmail,
        userName: reportData.userName,
        weekStart: reportData.weekStart,
        weekEnd: reportData.weekEnd,
        totalLeads: reportData.totalLeads,
        newLeads: reportData.newLeads,
        topSubreddits: reportData.topSubreddits,
        topProducts: reportData.topProducts
      })

      return emailResult
    } catch (error) {
      console.error('Error sending weekly report:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Send browser notification (if user has granted permission)
   */
  static async sendBrowserNotification(
    userId: string, 
    notification: { title: string; body: string; icon?: string; url?: string }
  ): Promise<void> {
    try {
      // This would typically be called from the frontend
      // For now, we'll store it in a way that the frontend can pick up
      const supabase = createClient()
      
      await supabase
        .from('browser_notifications')
        .insert({
          user_id: userId,
          title: notification.title,
          body: notification.body,
          icon: notification.icon || '/favicon.ico',
          url: notification.url || '/dashboard',
          read: false,
          created_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('Error storing browser notification:', error)
    }
  }

  /**
   * Check if user should receive email notifications
   */
  static async shouldSendEmail(userId: string): Promise<boolean> {
    const preferences = await this.getUserPreferences(userId)
    return preferences.email
  }

  /**
   * Check if user should receive new lead notifications
   */
  static async shouldSendNewLeadNotification(userId: string): Promise<boolean> {
    const preferences = await this.getUserPreferences(userId)
    return preferences.email && preferences.newLeads
  }

  /**
   * Check if user should receive weekly reports
   */
  static async shouldSendWeeklyReport(userId: string): Promise<boolean> {
    const preferences = await this.getUserPreferences(userId)
    return preferences.email && preferences.weeklyReport
  }
}
