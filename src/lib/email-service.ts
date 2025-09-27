import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface WelcomeEmailData {
  userEmail: string
  userName?: string
  signupDate: string
  trialEndDate: string
}

export interface NewLeadEmailData {
  userEmail: string
  userName: string
  productName: string
  subreddit: string
  title: string
  content: string
  author: string
  score: number
  url: string
}

export interface WeeklyReportEmailData {
  userEmail: string
  userName: string
  weekStart: string
  weekEnd: string
  totalLeads: number
  newLeads: number
  topSubreddits: Array<{ name: string; count: number }>
  topProducts: Array<{ name: string; leads: number }>
}

export class EmailService {
  static async sendWelcomeEmail(data: WelcomeEmailData) {
    try {
      if (!process.env.RESEND_API_KEY) {
        console.warn('RESEND_API_KEY not configured, skipping email send')
        return { success: false, error: 'Email service not configured' }
      }

      const { data: emailData, error } = await resend.emails.send({
        from: 'Truleado <onboarding@truleado.com>',
        to: [data.userEmail],
        subject: 'Welcome to Truleado! 🚀 Your Reddit Lead Generation Journey Starts Now',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Welcome to Truleado</title>
              <style>
                body {
                  font-family: 'SF Pro Display', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
                  line-height: 1.6;
                  color: #333;
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
                  background-color: #f8fafc;
                }
                .container {
                  background: white;
                  border-radius: 12px;
                  padding: 40px;
                  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
                .header {
                  text-align: center;
                  margin-bottom: 30px;
                }
                .logo {
                  font-size: 32px;
                  font-weight: bold;
                  color: #148cfc;
                  margin-bottom: 10px;
                }
                .welcome-title {
                  font-size: 28px;
                  font-weight: bold;
                  color: #1f2937;
                  margin-bottom: 20px;
                }
                .welcome-subtitle {
                  font-size: 18px;
                  color: #6b7280;
                  margin-bottom: 30px;
                }
                .trial-info {
                  background: #f0f9ff;
                  border: 2px solid #0ea5e9;
                  border-radius: 8px;
                  padding: 20px;
                  margin: 30px 0;
                  text-align: center;
                }
                .trial-title {
                  font-size: 20px;
                  font-weight: bold;
                  color: #0369a1;
                  margin-bottom: 10px;
                }
                .trial-details {
                  color: #0c4a6e;
                  font-size: 16px;
                }
                .cta-button {
                  display: inline-block;
                  background: #148cfc;
                  color: white;
                  padding: 16px 32px;
                  text-decoration: none;
                  border-radius: 8px;
                  font-weight: bold;
                  font-size: 18px;
                  margin: 20px 0;
                  transition: background-color 0.2s;
                }
                .cta-button:hover {
                  background: #0d7ce8;
                }
                .features {
                  margin: 30px 0;
                }
                .feature {
                  display: flex;
                  align-items: center;
                  margin: 15px 0;
                  padding: 15px;
                  background: #f9fafb;
                  border-radius: 8px;
                }
                .feature-icon {
                  font-size: 24px;
                  margin-right: 15px;
                }
                .feature-text {
                  font-size: 16px;
                  color: #374151;
                }
                .footer {
                  margin-top: 40px;
                  padding-top: 20px;
                  border-top: 1px solid #e5e7eb;
                  text-align: center;
                  color: #6b7280;
                  font-size: 14px;
                }
                .social-links {
                  margin: 20px 0;
                }
                .social-link {
                  display: inline-block;
                  margin: 0 10px;
                  color: #148cfc;
                  text-decoration: none;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <div class="logo">Truleado</div>
                  <h1 class="welcome-title">Welcome aboard! 🎉</h1>
                  <p class="welcome-subtitle">
                    Hi${data.userName ? ` ${data.userName}` : ''}, you're all set to start generating high-quality leads from Reddit!
                  </p>
                </div>

                <div class="trial-info">
                  <div class="trial-title">🚀 Your Free Trial is Active</div>
                  <div class="trial-details">
                    <strong>Started:</strong> ${new Date(data.signupDate).toLocaleDateString()}<br>
                    <strong>Expires:</strong> ${new Date(data.trialEndDate).toLocaleDateString()}<br>
                    <strong>Duration:</strong> 1 day of full access
                  </div>
                </div>

                <div style="text-align: center;">
                  <a href="https://truleado.com/dashboard" class="cta-button">
                    Start Finding Leads Now →
                  </a>
                </div>

                <div class="features">
                  <h2 style="font-size: 22px; font-weight: bold; color: #1f2937; margin-bottom: 20px;">
                    What you can do with Truleado:
                  </h2>
                  
                  <div class="feature">
                    <div class="feature-icon">🎯</div>
                    <div class="feature-text">
                      <strong>Smart Lead Discovery:</strong> Automatically find potential customers discussing your product or service
                    </div>
                  </div>
                  
                  <div class="feature">
                    <div class="feature-icon">📊</div>
                    <div class="feature-text">
                      <strong>AI-Powered Analysis:</strong> Get insights on lead quality and engagement potential
                    </div>
                  </div>
                  
                  <div class="feature">
                    <div class="feature-icon">⚡</div>
                    <div class="feature-text">
                      <strong>Real-time Monitoring:</strong> Never miss an opportunity with continuous Reddit scanning
                    </div>
                  </div>
                  
                  <div class="feature">
                    <div class="feature-icon">📈</div>
                    <div class="feature-text">
                      <strong>Performance Tracking:</strong> Monitor your lead generation success and ROI
                    </div>
                  </div>
                </div>

                <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 30px 0;">
                  <h3 style="color: #92400e; margin-top: 0; font-size: 18px;">💡 Pro Tip:</h3>
                  <p style="color: #92400e; margin-bottom: 0;">
                    Connect your Reddit account in Settings to get started with lead discovery immediately. 
                    The more specific your product keywords, the better results you'll see!
                  </p>
                </div>

                <div class="footer">
                  <p>
                    <strong>Need help getting started?</strong><br>
                    Reply to this email or visit our <a href="https://truleado.com/support" style="color: #148cfc;">Support Center</a>
                  </p>
                  
                  <div class="social-links">
                    <a href="https://truleado.com" class="social-link">Website</a>
                    <a href="https://truleado.com/support" class="social-link">Support</a>
                    <a href="https://truleado.com/terms" class="social-link">Terms</a>
                    <a href="https://truleado.com/privacy" class="social-link">Privacy</a>
                  </div>
                  
                  <p style="margin-top: 20px; font-size: 12px;">
                    You're receiving this email because you signed up for Truleado.<br>
                    If you didn't sign up, please ignore this email.
                  </p>
                </div>
              </div>
            </body>
          </html>
        `,
      })

      if (error) {
        console.error('Failed to send welcome email:', error)
        return { success: false, error: error.message }
      }

      console.log('Welcome email sent successfully:', emailData?.id)
      return { success: true, emailId: emailData?.id }
    } catch (error) {
      console.error('Error sending welcome email:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  static async sendTrialReminder(data: { userEmail: string; userName?: string; daysLeft: number }) {
    try {
      if (!process.env.RESEND_API_KEY) {
        console.warn('RESEND_API_KEY not configured, skipping reminder email')
        return { success: false, error: 'Email service not configured' }
      }

      const { data: emailData, error } = await resend.emails.send({
        from: 'Truleado <onboarding@truleado.com>',
        to: [data.userEmail],
        subject: `⏰ ${data.daysLeft > 0 ? `${data.daysLeft} days left` : 'Trial expired'} - Your Truleado trial`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Trial Reminder - Truleado</title>
              <style>
                body {
                  font-family: 'SF Pro Display', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
                  line-height: 1.6;
                  color: #333;
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
                  background-color: #f8fafc;
                }
                .container {
                  background: white;
                  border-radius: 12px;
                  padding: 40px;
                  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
                .header {
                  text-align: center;
                  margin-bottom: 30px;
                }
                .logo {
                  font-size: 32px;
                  font-weight: bold;
                  color: #148cfc;
                  margin-bottom: 10px;
                }
                .reminder-title {
                  font-size: 24px;
                  font-weight: bold;
                  color: #dc2626;
                  margin-bottom: 20px;
                }
                .cta-button {
                  display: inline-block;
                  background: #148cfc;
                  color: white;
                  padding: 16px 32px;
                  text-decoration: none;
                  border-radius: 8px;
                  font-weight: bold;
                  font-size: 18px;
                  margin: 20px 0;
                }
                .footer {
                  margin-top: 40px;
                  padding-top: 20px;
                  border-top: 1px solid #e5e7eb;
                  text-align: center;
                  color: #6b7280;
                  font-size: 14px;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <div class="logo">Truleado</div>
                  <h1 class="reminder-title">⏰ ${data.daysLeft > 0 ? `${data.daysLeft} days left in your trial!` : 'Your trial has expired!'}</h1>
                  <p style="font-size: 18px; color: #6b7280;">
                    Hi${data.userName ? ` ${data.userName}` : ''}, ${data.daysLeft > 0 ? 'don\'t miss out on continuing your lead generation success!' : 'continue your lead generation success with Pro!'}
                  </p>
                </div>

                <div style="text-align: center;">
                  <a href="https://truleado.com/upgrade" class="cta-button">
                    Upgrade to Pro Now →
                  </a>
                </div>

                <div class="footer">
                  <p>Questions? Reply to this email or visit our <a href="https://truleado.com/support" style="color: #148cfc;">Support Center</a></p>
                </div>
              </div>
            </body>
          </html>
        `,
      })

      if (error) {
        console.error('Failed to send trial reminder:', error)
        return { success: false, error: error.message }
      }

      console.log('Trial reminder sent successfully:', emailData?.id)
      return { success: true, emailId: emailData?.id }
    } catch (error) {
      console.error('Error sending trial reminder:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  static async sendNewLeadNotification(data: NewLeadEmailData) {
    try {
      if (!process.env.RESEND_API_KEY) {
        console.warn('RESEND_API_KEY not configured, skipping email send')
        return { success: false, error: 'Email service not configured' }
      }

      const { data: emailData, error } = await resend.emails.send({
        from: 'Truleado <noreply@truleado.com>',
        to: [data.userEmail],
        replyTo: 'truleado@gmail.com',
        subject: `🎯 New Lead Found for ${data.productName}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>New Lead Found</title>
              <style>
                body {
                  font-family: 'Inter', 'SF Pro Display', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
                  line-height: 1.6;
                  color: #333;
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
                  background-color: #f8fafc;
                }
                .container {
                  background: white;
                  border-radius: 12px;
                  padding: 40px;
                  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
                .header {
                  text-align: center;
                  margin-bottom: 30px;
                }
                .logo {
                  width: 40px;
                  height: 40px;
                  background: #148cfc;
                  border-radius: 8px;
                  margin: 0 auto 20px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  color: white;
                  font-weight: bold;
                  font-size: 18px;
                }
                .title {
                  font-size: 24px;
                  font-weight: bold;
                  color: #1f2937;
                  margin-bottom: 10px;
                }
                .subtitle {
                  color: #6b7280;
                  font-size: 16px;
                }
                .lead-card {
                  background: #f8fafc;
                  border: 1px solid #e5e7eb;
                  border-radius: 8px;
                  padding: 20px;
                  margin: 20px 0;
                }
                .lead-title {
                  font-size: 18px;
                  font-weight: 600;
                  color: #1f2937;
                  margin-bottom: 10px;
                }
                .lead-meta {
                  display: flex;
                  gap: 15px;
                  margin-bottom: 15px;
                  font-size: 14px;
                  color: #6b7280;
                }
                .lead-content {
                  background: white;
                  padding: 15px;
                  border-radius: 6px;
                  border-left: 4px solid #148cfc;
                  font-size: 14px;
                  line-height: 1.5;
                  color: #374151;
                }
                .cta-button {
                  display: inline-block;
                  background: #148cfc;
                  color: white;
                  padding: 12px 24px;
                  text-decoration: none;
                  border-radius: 6px;
                  font-weight: 600;
                  margin: 20px 0;
                }
                .footer {
                  margin-top: 30px;
                  padding-top: 20px;
                  border-top: 1px solid #e5e7eb;
                  text-align: center;
                  color: #6b7280;
                  font-size: 14px;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <div class="logo">T</div>
                  <div class="title">🎯 New Lead Found!</div>
                  <div class="subtitle">We found a potential customer for your product</div>
                </div>

                <div class="lead-card">
                  <div class="lead-title">${data.title}</div>
                  <div class="lead-meta">
                    <span><strong>Product:</strong> ${data.productName}</span>
                    <span><strong>Subreddit:</strong> r/${data.subreddit}</span>
                    <span><strong>Author:</strong> u/${data.author}</span>
                    <span><strong>Score:</strong> ${data.score}</span>
                  </div>
                  <div class="lead-content">
                    ${data.content.substring(0, 300)}${data.content.length > 300 ? '...' : ''}
                  </div>
                </div>

                <div style="text-align: center;">
                  <a href="${data.url}" class="cta-button">
                    View Full Lead →
                  </a>
                </div>

                <div class="footer">
                  <p>This lead was found by monitoring r/${data.subreddit} for mentions of your product.</p>
                  <p>Questions? Reply to this email or visit our <a href="https://truleado.com/support" style="color: #148cfc;">Support Center</a></p>
                </div>
              </div>
            </body>
          </html>
        `
      })

      if (error) {
        console.error('Error sending new lead email:', error)
        return { success: false, error: error.message }
      }

      return { success: true, messageId: emailData?.id }
    } catch (error) {
      console.error('Error sending new lead email:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  static async sendWeeklyReport(data: WeeklyReportEmailData) {
    try {
      if (!process.env.RESEND_API_KEY) {
        console.warn('RESEND_API_KEY not configured, skipping email send')
        return { success: false, error: 'Email service not configured' }
      }

      const { data: emailData, error } = await resend.emails.send({
        from: 'Truleado <noreply@truleado.com>',
        to: [data.userEmail],
        replyTo: 'truleado@gmail.com',
        subject: `📊 Your Weekly Lead Report - ${data.newLeads} New Leads Found`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Weekly Lead Report</title>
              <style>
                body {
                  font-family: 'Inter', 'SF Pro Display', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
                  line-height: 1.6;
                  color: #333;
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
                  background-color: #f8fafc;
                }
                .container {
                  background: white;
                  border-radius: 12px;
                  padding: 40px;
                  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
                .header {
                  text-align: center;
                  margin-bottom: 30px;
                }
                .logo {
                  width: 40px;
                  height: 40px;
                  background: #148cfc;
                  border-radius: 8px;
                  margin: 0 auto 20px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  color: white;
                  font-weight: bold;
                  font-size: 18px;
                }
                .title {
                  font-size: 24px;
                  font-weight: bold;
                  color: #1f2937;
                  margin-bottom: 10px;
                }
                .subtitle {
                  color: #6b7280;
                  font-size: 16px;
                }
                .stats-grid {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 20px;
                  margin: 30px 0;
                }
                .stat-card {
                  background: #f8fafc;
                  border: 1px solid #e5e7eb;
                  border-radius: 8px;
                  padding: 20px;
                  text-align: center;
                }
                .stat-number {
                  font-size: 32px;
                  font-weight: bold;
                  color: #148cfc;
                  margin-bottom: 5px;
                }
                .stat-label {
                  color: #6b7280;
                  font-size: 14px;
                }
                .section {
                  margin: 30px 0;
                }
                .section-title {
                  font-size: 18px;
                  font-weight: 600;
                  color: #1f2937;
                  margin-bottom: 15px;
                }
                .list-item {
                  display: flex;
                  justify-content: space-between;
                  padding: 10px 0;
                  border-bottom: 1px solid #f3f4f6;
                }
                .list-item:last-child {
                  border-bottom: none;
                }
                .cta-button {
                  display: inline-block;
                  background: #148cfc;
                  color: white;
                  padding: 12px 24px;
                  text-decoration: none;
                  border-radius: 6px;
                  font-weight: 600;
                  margin: 20px 0;
                }
                .footer {
                  margin-top: 30px;
                  padding-top: 20px;
                  border-top: 1px solid #e5e7eb;
                  text-align: center;
                  color: #6b7280;
                  font-size: 14px;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <div class="logo">T</div>
                  <div class="title">📊 Weekly Lead Report</div>
                  <div class="subtitle">${data.weekStart} - ${data.weekEnd}</div>
                </div>

                <div class="stats-grid">
                  <div class="stat-card">
                    <div class="stat-number">${data.newLeads}</div>
                    <div class="stat-label">New Leads This Week</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-number">${data.totalLeads}</div>
                    <div class="stat-label">Total Leads</div>
                  </div>
                </div>

                ${data.topSubreddits.length > 0 ? `
                <div class="section">
                  <div class="section-title">🔥 Top Subreddits</div>
                  ${data.topSubreddits.map(sub => `
                    <div class="list-item">
                      <span>r/${sub.name}</span>
                      <span>${sub.count} leads</span>
                    </div>
                  `).join('')}
                </div>
                ` : ''}

                ${data.topProducts.length > 0 ? `
                <div class="section">
                  <div class="section-title">🎯 Top Products</div>
                  ${data.topProducts.map(product => `
                    <div class="list-item">
                      <span>${product.name}</span>
                      <span>${product.leads} leads</span>
                    </div>
                  `).join('')}
                </div>
                ` : ''}

                <div style="text-align: center;">
                  <a href="https://truleado.com/dashboard" class="cta-button">
                    View All Leads →
                  </a>
                </div>

                <div class="footer">
                  <p>Keep monitoring Reddit for more potential customers!</p>
                  <p>Questions? Reply to this email or visit our <a href="https://truleado.com/support" style="color: #148cfc;">Support Center</a></p>
                </div>
              </div>
            </body>
          </html>
        `
      })

      if (error) {
        console.error('Error sending weekly report email:', error)
        return { success: false, error: error.message }
      }

      return { success: true, messageId: emailData?.id }
    } catch (error) {
      console.error('Error sending weekly report email:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }
}
