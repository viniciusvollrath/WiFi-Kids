/**
 * Enhanced error handling utilities for the PWA
 * Provides graceful degradation and user-friendly error messages
 */

export type ErrorType = 
  | 'network'
  | 'timeout'
  | 'validation'
  | 'browser_support'
  | 'unknown'

export interface AppError {
  type: ErrorType
  message: string
  originalError?: Error
  timestamp: number
  context?: Record<string, any>
}

/**
 * Creates a standardized error object
 */
export function createAppError(
  type: ErrorType,
  message: string,
  originalError?: Error,
  context?: Record<string, any>
): AppError {
  return {
    type,
    message,
    originalError,
    timestamp: Date.now(),
    context
  }
}

/**
 * Checks if the current browser supports required features
 */
export function checkBrowserSupport(): { supported: boolean; missing: string[] } {
  const missing: string[] = []

  // Check for essential features
  if (!window.fetch) {
    missing.push('fetch')
  }

  if (!window.AbortController) {
    missing.push('AbortController')
  }

  if (!window.Promise) {
    missing.push('Promise')
  }

  if (!window.localStorage) {
    missing.push('localStorage')
  }

  // Check for modern JavaScript features
  try {
    // Test arrow functions by checking if they exist
    const testArrow = () => {}
    if (typeof testArrow !== 'function') {
      missing.push('ES6 arrow functions')
    }
  } catch {
    missing.push('ES6 arrow functions')
  }

  try {
    // Test async/await by checking if async functions are supported
    const AsyncFunction = (async function() {}).constructor
    if (typeof AsyncFunction !== 'function') {
      missing.push('async/await')
    }
  } catch {
    missing.push('async/await')
  }

  return {
    supported: missing.length === 0,
    missing
  }
}

/**
 * Determines if an error is a network-related error
 */
export function isNetworkError(error: Error): boolean {
  const networkErrorPatterns = [
    /network/i,
    /fetch/i,
    /connection/i,
    /timeout/i,
    /abort/i,
    /cors/i,
    /failed to fetch/i
  ]

  return networkErrorPatterns.some(pattern => 
    pattern.test(error.message) || pattern.test(error.name)
  )
}

/**
 * Determines if an error is a timeout error
 */
export function isTimeoutError(error: Error): boolean {
  return error.name === 'AbortError' || 
         /timeout/i.test(error.message) ||
         /aborted/i.test(error.message)
}

/**
 * Gets a user-friendly error message based on error type and locale
 */
export function getUserFriendlyErrorMessage(
  error: AppError | Error, 
  locale: 'pt' | 'en' = 'en'
): string {
  if (error instanceof Error) {
    // Convert regular Error to AppError
    if (isTimeoutError(error)) {
      return locale === 'pt' 
        ? 'A solicitação demorou muito. Usando modo simulação.'
        : 'Request took too long. Using simulation mode.'
    }
    
    if (isNetworkError(error)) {
      return locale === 'pt'
        ? 'Falha na conexão. Verificando modo simulação...'
        : 'Connection failed. Checking simulation mode...'
    }
    
    return locale === 'pt'
      ? 'Algo deu errado. Tente novamente.'
      : 'Something went wrong. Please try again.'
  }

  // Handle AppError
  switch (error.type) {
    case 'network':
      return locale === 'pt'
        ? 'Falha na conexão. Verificando modo simulação...'
        : 'Connection failed. Checking simulation mode...'
    
    case 'timeout':
      return locale === 'pt'
        ? 'A solicitação demorou muito. Usando modo simulação.'
        : 'Request took too long. Using simulation mode.'
    
    case 'validation':
      return error.message // Validation errors are already localized
    
    case 'browser_support':
      return locale === 'pt'
        ? 'Seu navegador não suporta todos os recursos. Algumas funcionalidades podem não funcionar.'
        : 'Your browser doesn\'t support all features. Some functionality may not work.'
    
    default:
      return locale === 'pt'
        ? 'Algo deu errado. Tente novamente.'
        : 'Something went wrong. Please try again.'
  }
}

/**
 * Logs errors for debugging while respecting user privacy
 */
export function logError(error: AppError | Error, context?: Record<string, any>) {
  const errorData = {
    timestamp: new Date().toISOString(),
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : error,
    context,
    userAgent: navigator.userAgent,
    url: window.location.href
  }

  // In development, log to console
  if (process.env.NODE_ENV === 'development') {
    console.error('App Error:', errorData)
  }

  // In production, you might want to send to an error reporting service
  // For now, we'll just store in sessionStorage for debugging
  try {
    const existingErrors = JSON.parse(sessionStorage.getItem('app_errors') || '[]')
    existingErrors.push(errorData)
    
    // Keep only the last 10 errors to avoid storage bloat
    const recentErrors = existingErrors.slice(-10)
    sessionStorage.setItem('app_errors', JSON.stringify(recentErrors))
  } catch {
    // Ignore storage errors
  }
}

/**
 * Wraps async functions with error handling
 */
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  errorType: ErrorType = 'unknown'
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args)
    } catch (error) {
      const appError = createAppError(
        errorType,
        error instanceof Error ? error.message : 'Unknown error',
        error instanceof Error ? error : undefined
      )
      
      logError(appError)
      throw appError
    }
  }
}

/**
 * Creates a retry mechanism for failed operations
 */
export function createRetryHandler<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
) {
  return async (): Promise<T> => {
    let lastError: Error

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error')
        
        if (attempt === maxRetries) {
          break
        }

        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, delay * attempt))
      }
    }

    throw lastError!
  }
}

/**
 * Graceful degradation helper for unsupported features
 */
export function withFallback<T>(
  primaryFn: () => T,
  fallbackFn: () => T,
  featureCheck?: () => boolean
): T {
  try {
    if (featureCheck && !featureCheck()) {
      return fallbackFn()
    }
    return primaryFn()
  } catch {
    return fallbackFn()
  }
}