import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  createAppError,
  checkBrowserSupport,
  isNetworkError,
  isTimeoutError,
  getUserFriendlyErrorMessage,
  logError,
  withErrorHandling,
  createRetryHandler,
  withFallback
} from './errorHandling'

// Mock sessionStorage
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage
})

describe('createAppError', () => {
  it('should create an AppError with all properties', () => {
    const originalError = new Error('Test error')
    const context = { userId: '123' }
    
    const appError = createAppError('network', 'Network failed', originalError, context)
    
    expect(appError.type).toBe('network')
    expect(appError.message).toBe('Network failed')
    expect(appError.originalError).toBe(originalError)
    expect(appError.context).toBe(context)
    expect(appError.timestamp).toBeTypeOf('number')
    expect(appError.timestamp).toBeCloseTo(Date.now(), -2) // Within 100ms
  })

  it('should create an AppError without optional properties', () => {
    const appError = createAppError('validation', 'Invalid input')
    
    expect(appError.type).toBe('validation')
    expect(appError.message).toBe('Invalid input')
    expect(appError.originalError).toBeUndefined()
    expect(appError.context).toBeUndefined()
    expect(appError.timestamp).toBeTypeOf('number')
  })
})

describe('checkBrowserSupport', () => {
  let originalFetch: any
  let originalAbortController: any
  let originalLocalStorage: any

  beforeEach(() => {
    originalFetch = window.fetch
    originalAbortController = window.AbortController
    originalLocalStorage = window.localStorage
  })

  afterEach(() => {
    if (originalFetch) {
      window.fetch = originalFetch
    }
    if (originalAbortController) {
      window.AbortController = originalAbortController
    }
    if (originalLocalStorage) {
      window.localStorage = originalLocalStorage
    }
  })

  it('should return supported true when all features are available', () => {
    const result = checkBrowserSupport()
    expect(result.supported).toBe(true)
    expect(result.missing).toEqual([])
  })

  it('should detect missing fetch', () => {
    // @ts-ignore
    delete window.fetch
    
    const result = checkBrowserSupport()
    expect(result.supported).toBe(false)
    expect(result.missing).toContain('fetch')
  })

  it('should detect missing AbortController', () => {
    // @ts-ignore
    delete window.AbortController
    
    const result = checkBrowserSupport()
    expect(result.supported).toBe(false)
    expect(result.missing).toContain('AbortController')
  })

  it('should detect missing localStorage', () => {
    // @ts-ignore
    delete window.localStorage
    
    const result = checkBrowserSupport()
    expect(result.supported).toBe(false)
    expect(result.missing).toContain('localStorage')
  })
})

describe('isNetworkError', () => {
  it('should detect network errors', () => {
    const networkErrors = [
      new Error('Network request failed'),
      new Error('Failed to fetch'),
      new Error('Connection timeout'),
      new Error('CORS error occurred'),
      { name: 'NetworkError', message: 'Network issue' } as Error
    ]

    networkErrors.forEach(error => {
      expect(isNetworkError(error)).toBe(true)
    })
  })

  it('should not detect non-network errors', () => {
    const nonNetworkErrors = [
      new Error('Validation failed'),
      new Error('Invalid input'),
      new Error('Permission denied')
    ]

    nonNetworkErrors.forEach(error => {
      expect(isNetworkError(error)).toBe(false)
    })
  })
})

describe('isTimeoutError', () => {
  it('should detect timeout errors', () => {
    const timeoutErrors = [
      { name: 'AbortError', message: 'Request aborted' } as Error,
      new Error('Request timeout'),
      new Error('Operation was aborted')
    ]

    timeoutErrors.forEach(error => {
      expect(isTimeoutError(error)).toBe(true)
    })
  })

  it('should not detect non-timeout errors', () => {
    const nonTimeoutErrors = [
      new Error('Network failed'),
      new Error('Invalid response'),
      new Error('Permission denied')
    ]

    nonTimeoutErrors.forEach(error => {
      expect(isTimeoutError(error)).toBe(false)
    })
  })
})

describe('getUserFriendlyErrorMessage', () => {
  it('should return localized messages for AppError types', () => {
    const networkError = createAppError('network', 'Network failed')
    
    expect(getUserFriendlyErrorMessage(networkError, 'en'))
      .toContain('Connection failed')
    expect(getUserFriendlyErrorMessage(networkError, 'pt'))
      .toContain('Falha na conexão')
  })

  it('should handle timeout errors', () => {
    const timeoutError = createAppError('timeout', 'Request timed out')
    
    expect(getUserFriendlyErrorMessage(timeoutError, 'en'))
      .toContain('took too long')
    expect(getUserFriendlyErrorMessage(timeoutError, 'pt'))
      .toContain('demorou muito')
  })

  it('should handle validation errors', () => {
    const validationError = createAppError('validation', 'Custom validation message')
    
    expect(getUserFriendlyErrorMessage(validationError, 'en'))
      .toBe('Custom validation message')
  })

  it('should handle browser support errors', () => {
    const browserError = createAppError('browser_support', 'Browser not supported')
    
    expect(getUserFriendlyErrorMessage(browserError, 'en'))
      .toContain('browser doesn\'t support')
    expect(getUserFriendlyErrorMessage(browserError, 'pt'))
      .toContain('navegador não suporta')
  })

  it('should handle regular Error objects', () => {
    const timeoutError = new Error('Request timeout')
    timeoutError.name = 'AbortError'
    
    const networkError = new Error('Failed to fetch')
    const genericError = new Error('Something went wrong')
    
    expect(getUserFriendlyErrorMessage(timeoutError, 'en'))
      .toContain('took too long')
    expect(getUserFriendlyErrorMessage(networkError, 'en'))
      .toContain('Connection failed')
    expect(getUserFriendlyErrorMessage(genericError, 'en'))
      .toContain('Something went wrong')
  })
})

describe('logError', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSessionStorage.getItem.mockReturnValue('[]')
  })

  it('should log AppError to sessionStorage', () => {
    const appError = createAppError('network', 'Test error')
    const context = { test: 'context' }
    
    logError(appError, context)
    
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
      'app_errors',
      expect.stringContaining('"error"')
    )
  })

  it('should log regular Error to sessionStorage', () => {
    const error = new Error('Test error')
    
    logError(error)
    
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
      'app_errors',
      expect.stringContaining('"name":"Error"')
    )
  })

  it('should handle sessionStorage errors gracefully', () => {
    mockSessionStorage.setItem.mockImplementation(() => {
      throw new Error('Storage full')
    })
    
    const error = new Error('Test error')
    
    // Should not throw
    expect(() => logError(error)).not.toThrow()
  })

  it('should keep only last 10 errors', () => {
    const existingErrors = Array(12).fill(null).map((_, i) => ({ id: i }))
    mockSessionStorage.getItem.mockReturnValue(JSON.stringify(existingErrors))
    
    const error = new Error('New error')
    logError(error)
    
    const savedData = mockSessionStorage.setItem.mock.calls[0][1]
    const parsedData = JSON.parse(savedData)
    
    expect(parsedData).toHaveLength(10)
  })
})

describe('withErrorHandling', () => {
  it('should wrap function and return result on success', async () => {
    const successFn = vi.fn().mockResolvedValue('success')
    const wrappedFn = withErrorHandling(successFn, 'network')
    
    const result = await wrappedFn('arg1', 'arg2')
    
    expect(result).toBe('success')
    expect(successFn).toHaveBeenCalledWith('arg1', 'arg2')
  })

  it('should catch errors and throw AppError', async () => {
    const errorFn = vi.fn().mockRejectedValue(new Error('Test error'))
    const wrappedFn = withErrorHandling(errorFn, 'network')
    
    await expect(wrappedFn()).rejects.toMatchObject({
      type: 'network',
      message: 'Test error'
    })
  })

  it('should handle non-Error rejections', async () => {
    const errorFn = vi.fn().mockRejectedValue('string error')
    const wrappedFn = withErrorHandling(errorFn, 'validation')
    
    await expect(wrappedFn()).rejects.toMatchObject({
      type: 'validation',
      message: 'Unknown error'
    })
  })
})

describe('createRetryHandler', () => {
  it('should retry failed operations', async () => {
    let attempts = 0
    const operation = vi.fn().mockImplementation(() => {
      attempts++
      if (attempts < 3) {
        throw new Error('Temporary failure')
      }
      return 'success'
    })
    
    const retryHandler = createRetryHandler(operation, 3, 10) // 10ms delay for fast test
    
    const result = await retryHandler()
    
    expect(result).toBe('success')
    expect(operation).toHaveBeenCalledTimes(3)
  })

  it('should throw last error after max retries', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('Persistent failure'))
    const retryHandler = createRetryHandler(operation, 2, 10)
    
    await expect(retryHandler()).rejects.toThrow('Persistent failure')
    expect(operation).toHaveBeenCalledTimes(2)
  })

  it('should succeed on first try', async () => {
    const operation = vi.fn().mockResolvedValue('immediate success')
    const retryHandler = createRetryHandler(operation, 3, 10)
    
    const result = await retryHandler()
    
    expect(result).toBe('immediate success')
    expect(operation).toHaveBeenCalledTimes(1)
  })
})

describe('withFallback', () => {
  it('should return primary function result when successful', () => {
    const primaryFn = vi.fn().mockReturnValue('primary')
    const fallbackFn = vi.fn().mockReturnValue('fallback')
    
    const result = withFallback(primaryFn, fallbackFn)
    
    expect(result).toBe('primary')
    expect(primaryFn).toHaveBeenCalled()
    expect(fallbackFn).not.toHaveBeenCalled()
  })

  it('should return fallback result when primary throws', () => {
    const primaryFn = vi.fn().mockImplementation(() => {
      throw new Error('Primary failed')
    })
    const fallbackFn = vi.fn().mockReturnValue('fallback')
    
    const result = withFallback(primaryFn, fallbackFn)
    
    expect(result).toBe('fallback')
    expect(primaryFn).toHaveBeenCalled()
    expect(fallbackFn).toHaveBeenCalled()
  })

  it('should use fallback when feature check fails', () => {
    const primaryFn = vi.fn().mockReturnValue('primary')
    const fallbackFn = vi.fn().mockReturnValue('fallback')
    const featureCheck = vi.fn().mockReturnValue(false)
    
    const result = withFallback(primaryFn, fallbackFn, featureCheck)
    
    expect(result).toBe('fallback')
    expect(featureCheck).toHaveBeenCalled()
    expect(primaryFn).not.toHaveBeenCalled()
    expect(fallbackFn).toHaveBeenCalled()
  })

  it('should use primary when feature check passes', () => {
    const primaryFn = vi.fn().mockReturnValue('primary')
    const fallbackFn = vi.fn().mockReturnValue('fallback')
    const featureCheck = vi.fn().mockReturnValue(true)
    
    const result = withFallback(primaryFn, fallbackFn, featureCheck)
    
    expect(result).toBe('primary')
    expect(featureCheck).toHaveBeenCalled()
    expect(primaryFn).toHaveBeenCalled()
    expect(fallbackFn).not.toHaveBeenCalled()
  })
})