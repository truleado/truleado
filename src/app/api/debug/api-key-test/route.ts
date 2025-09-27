import { NextRequest, NextResponse } from 'next/server'
import { paddleConfig } from '@/lib/paddle-config'

export async function GET(request: NextRequest) {
  try {
    console.log('Testing API key for whitespace issues...')
    
    const apiKey = process.env.PADDLE_API_KEY || ''
    const clientToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || ''
    const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET || ''
    const priceId = process.env.NEXT_PUBLIC_PADDLE_PRICE_ID || process.env.PADDLE_PRICE_ID || ''
    
    const analysis = {
      apiKey: {
        raw: apiKey,
        length: apiKey.length,
        trimmed: apiKey.trim(),
        trimmedLength: apiKey.trim().length,
        hasWhitespace: /\s/.test(apiKey),
        hasLeadingWhitespace: /^\s/.test(apiKey),
        hasTrailingWhitespace: /\s$/.test(apiKey),
        hasNewlines: /\n/.test(apiKey),
        hasTabs: /\t/.test(apiKey),
        hasCarriageReturns: /\r/.test(apiKey),
        preview: apiKey ? `"${apiKey.substring(0, 12)}..."` : 'Not set',
        trimmedPreview: apiKey.trim() ? `"${apiKey.trim().substring(0, 12)}..."` : 'Not set'
      },
      clientToken: {
        raw: clientToken,
        length: clientToken.length,
        trimmed: clientToken.trim(),
        trimmedLength: clientToken.trim().length,
        hasWhitespace: /\s/.test(clientToken),
        preview: clientToken ? `"${clientToken.substring(0, 12)}..."` : 'Not set'
      },
      webhookSecret: {
        raw: webhookSecret,
        length: webhookSecret.length,
        trimmed: webhookSecret.trim(),
        trimmedLength: webhookSecret.trim().length,
        hasWhitespace: /\s/.test(webhookSecret),
        preview: webhookSecret ? `"${webhookSecret.substring(0, 12)}..."` : 'Not set'
      },
      priceId: {
        raw: priceId,
        length: priceId.length,
        trimmed: priceId.trim(),
        trimmedLength: priceId.trim().length,
        hasWhitespace: /\s/.test(priceId),
        preview: priceId ? `"${priceId.substring(0, 12)}..."` : 'Not set'
      }
    }

    // Check if any keys have whitespace issues
    const issues = []
    if (analysis.apiKey.hasWhitespace) {
      issues.push(`API Key has whitespace: length ${analysis.apiKey.length} vs trimmed ${analysis.apiKey.trimmedLength}`)
    }
    if (analysis.clientToken.hasWhitespace) {
      issues.push(`Client Token has whitespace: length ${analysis.clientToken.length} vs trimmed ${analysis.clientToken.trimmedLength}`)
    }
    if (analysis.webhookSecret.hasWhitespace) {
      issues.push(`Webhook Secret has whitespace: length ${analysis.webhookSecret.length} vs trimmed ${analysis.webhookSecret.trimmedLength}`)
    }
    if (analysis.priceId.hasWhitespace) {
      issues.push(`Price ID has whitespace: length ${analysis.priceId.length} vs trimmed ${analysis.priceId.trimmedLength}`)
    }

    return NextResponse.json({
      success: true,
      message: issues.length > 0 ? 'Whitespace issues detected' : 'No whitespace issues found',
      issues,
      analysis,
      recommendations: issues.length > 0 ? [
        'Remove whitespace from environment variables in Vercel',
        'Re-enter the API keys without any leading/trailing spaces',
        'Check for hidden characters like tabs or newlines',
        'Use the trimmed values shown in the analysis'
      ] : [
        'API keys look clean, no whitespace issues detected',
        'If still having issues, check for other formatting problems'
      ]
    })

  } catch (error) {
    console.error('API key test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 })
  }
}
