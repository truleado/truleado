import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface WelcomeEmailData {
  userEmail: string
  userName?: string
  signupDate: string
  trialEndDate: string
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
                    <strong>Duration:</strong> 14 days of full access
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
        subject: `⏰ ${data.daysLeft} days left in your Truleado trial`,
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
                  <h1 class="reminder-title">⏰ ${data.daysLeft} days left in your trial!</h1>
                  <p style="font-size: 18px; color: #6b7280;">
                    Hi${data.userName ? ` ${data.userName}` : ''}, don't miss out on continuing your lead generation success!
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
}
