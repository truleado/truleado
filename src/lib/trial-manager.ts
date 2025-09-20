import { createClient } from '@supabase/supabase-js'

// Trial configuration
const trialConfig = {
  maxTrialPerEmail: 1,
  maxTrialPerIP: 3,
  trialDays: 7,
  trialCooldownHours: 24
}

export interface TrialAbuseCheck {
  allowed: boolean
  reason?: string
  blockUntil?: Date
}

export class TrialManager {
  private supabase: any

  constructor() {
    // Use service role key for server-side operations
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }

  async checkTrialEligibility(email: string, ipAddress: string, userAgent: string): Promise<TrialAbuseCheck> {
    try {
      // Check if email has already used a trial
      const { data: emailCheck, error: emailError } = await this.supabase
        .from('trial_abuse_prevention')
        .select('*')
        .eq('email', email.toLowerCase())
        .single()

      if (emailError && emailError.code !== 'PGRST116') {
        console.error('Error checking email trial eligibility:', emailError)
        return { allowed: false, reason: 'Database error' }
      }

      if (emailCheck) {
        if (emailCheck.blocked_until && new Date() < new Date(emailCheck.blocked_until)) {
          return { 
            allowed: false, 
            reason: 'Trial blocked due to abuse prevention',
            blockUntil: new Date(emailCheck.blocked_until)
          }
        }

        if (emailCheck.trial_count >= trialConfig.maxTrialPerEmail) {
          return { allowed: false, reason: 'Email has already used trial' }
        }
      }

      // Check IP address trial count
      const { data: ipCheck, error: ipError } = await this.supabase
        .from('trial_abuse_prevention')
        .select('*')
        .eq('ip_address', ipAddress)

      if (ipError) {
        console.error('Error checking IP trial eligibility:', ipError)
        return { allowed: false, reason: 'Database error' }
      }

      if (ipCheck && ipCheck.length >= trialConfig.maxTrialPerIP) {
        return { allowed: false, reason: 'IP address has exceeded trial limit' }
      }

      return { allowed: true }
    } catch (error) {
      console.error('Trial eligibility check error:', error)
      return { allowed: false, reason: 'System error' }
    }
  }

  async startTrial(userId: string, email: string, ipAddress: string, userAgent: string): Promise<boolean> {
    try {
      const trialEndsAt = new Date()
      trialEndsAt.setDate(trialEndsAt.getDate() + trialConfig.trialDays)

      // Update user profile with trial information
      const { error: profileError } = await this.supabase
        .from('profiles')
        .update({
          subscription_status: 'trial',
          trial_ends_at: trialEndsAt.toISOString(),
          trial_count: 1,
          last_trial_at: new Date().toISOString(),
          ip_address: ipAddress,
          user_agent: userAgent
        })
        .eq('id', userId)

      if (profileError) {
        console.error('Error updating user profile for trial:', profileError)
        return false
      }

      // Record trial usage for abuse prevention
      const { error: abuseError } = await this.supabase
        .from('trial_abuse_prevention')
        .upsert({
          email: email.toLowerCase(),
          ip_address: ipAddress,
          user_agent: userAgent,
          trial_count: 1,
          last_trial_at: new Date().toISOString()
        }, {
          onConflict: 'email,ip_address'
        })

      if (abuseError) {
        console.error('Error recording trial usage:', abuseError)
        // Don't fail the trial start if abuse prevention fails
      }

      // Log subscription history
      await this.logSubscriptionChange(userId, 'trial', null, 'trial_started')

      return true
    } catch (error) {
      console.error('Error starting trial:', error)
      return false
    }
  }

  async checkAndUpdateTrialStatus(userId: string): Promise<void> {
    try {
      const { data: user, error: userError } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (userError || !user) {
        console.error('Error fetching user for trial status check:', userError)
        return
      }

      if (user.subscription_status === 'trial') {
        const now = new Date()
        const trialEndsAt = new Date(user.trial_ends_at)

        if (now > trialEndsAt) {
          // Trial expired
          const { error: updateError } = await this.supabase
            .from('profiles')
            .update({
              subscription_status: 'expired'
            })
            .eq('id', userId)

          if (updateError) {
            console.error('Error updating trial status to expired:', updateError)
          } else {
            await this.logSubscriptionChange(userId, 'expired', 'trial', 'trial_expired')
          }
        }
      }
    } catch (error) {
      console.error('Error checking trial status:', error)
    }
  }

  async logSubscriptionChange(
    userId: string, 
    newStatus: string, 
    previousStatus: string | null, 
    eventType: string,
    razorpayEventId?: string,
    metadata?: any
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('subscription_history')
        .insert({
          user_id: userId,
          status: newStatus,
          previous_status: previousStatus,
          razorpay_event_id: razorpayEventId,
          razorpay_event_type: eventType,
          metadata: metadata
        })

      if (error) {
        console.error('Error logging subscription change:', error)
      }
    } catch (error) {
      console.error('Error logging subscription change:', error)
    }
  }

  async blockAbusiveUser(email: string, ipAddress: string, reason: string): Promise<void> {
    try {
      const blockUntil = new Date()
      blockUntil.setHours(blockUntil.getHours() + trialConfig.trialCooldownHours)

      const { error } = await this.supabase
        .from('trial_abuse_prevention')
        .upsert({
          email: email.toLowerCase(),
          ip_address: ipAddress,
          trial_count: trialConfig.maxTrialPerEmail,
          blocked_until: blockUntil.toISOString()
        }, {
          onConflict: 'email,ip_address'
        })

      if (error) {
        console.error('Error blocking abusive user:', error)
      }
    } catch (error) {
      console.error('Error blocking abusive user:', error)
    }
  }
}

export const trialManager = new TrialManager()
