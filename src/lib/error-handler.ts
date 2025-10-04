// Global error handling utilities
export class ErrorHandler {
  static logError(error: any, context: string) {
    const timestamp = new Date().toISOString()
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    
    console.error(`[${timestamp}] Error in ${context}:`, {
      message: errorMessage,
      stack: errorStack,
      context
    })
  }

  static handleApiError(error: any, context: string) {
    this.logError(error, context)
    
    // Return a user-friendly error response
    return {
      error: 'An unexpected error occurred. Please try again later.',
      context,
      timestamp: new Date().toISOString()
    }
  }

  static handleDatabaseError(error: any, operation: string) {
    this.logError(error, `Database ${operation}`)
    
    return {
      error: `Database operation failed: ${operation}`,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }
  }

  static handleAiError(error: any, provider: string) {
    this.logError(error, `AI ${provider}`)
    
    // Don't expose AI API errors to users
    return {
      error: 'AI analysis temporarily unavailable. Using fallback analysis.',
      fallback: true
    }
  }

  static handleRedditError(error: any, operation: string) {
    this.logError(error, `Reddit ${operation}`)
    
    return {
      error: `Reddit ${operation} failed. Please check your Reddit connection.`,
      retryable: true
    }
  }
}

// Global error handler for unhandled promise rejections
if (typeof process !== 'undefined') {
  process.on('unhandledRejection', (reason, promise) => {
    ErrorHandler.logError(reason, 'Unhandled Promise Rejection')
  })

  process.on('uncaughtException', (error) => {
    ErrorHandler.logError(error, 'Uncaught Exception')
    // Don't exit the process in production
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1)
    }
  })
}
