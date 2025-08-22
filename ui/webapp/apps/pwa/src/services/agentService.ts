/**
 * Agent service for backend communication with timeout and fallback logic
 * Handles communication with the backend API and provides mock mode fallback
 */

import { DecisionResponse, RequestOptions } from '../types'
import { decideMock, getCurrentMockContext, isValidDecisionResponse } from './mockService'
import { 
  createAppError, 
  isNetworkError, 
  isTimeoutError, 
  logError, 
  getUserFriendlyErrorMessage,
  withErrorHandling,
  createRetryHandler
} from '../utils/errorHandling'

// Default configuration
const DEFAULT_TIMEOUT = 3000 // 3 seconds
const DEFAULT_BACKEND_URL = 'http://localhost:3001'

/**
 * AgentService class that handles backend communication with automatic fallback to mock mode
 */
export class AgentService {
  private mockMode: boolean = false
  private backendUrl: string
  private deviceId: string

  constructor(backendUrl?: string) {
    this.backendUrl = backendUrl || DEFAULT_BACKEND_URL
    this.mockMode = import.meta.env.VITE_MOCK === '1' || import.meta.env.VITE_MOCK === 'true'
    this.deviceId = this.generateDeviceId()
    
    if (this.mockMode) {
      console.warn('[AgentService] Mock mode enabled via VITE_MOCK environment variable')
    }
  }

  /**
   * Generates a device ID for session tracking
   * Uses a combination of timestamp and random values for uniqueness
   */
  private generateDeviceId(): string {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 15)
    return `${timestamp}-${random}`.padEnd(16, '0').substring(0, 16)
  }

  /**
   * Validates a DecisionResponse object
   * Ensures the response matches the expected interface
   */
  private validateResponse(response: any): response is DecisionResponse {
    return isValidDecisionResponse(response)
  }

  /**
   * Makes a request to the backend API with timeout and error handling
   * Automatically falls back to mock mode on timeout or error
   */
  async requestDecision(options: RequestOptions = {}): Promise<DecisionResponse> {
    const { answer, timeout = DEFAULT_TIMEOUT } = options

    // If already in mock mode, use mock directly
    if (this.mockMode) {
      console.log('[AgentService] Using mock mode (VITE_MOCK enabled)')
      return this.decideMock(getCurrentMockContext(), answer)
    }

    return withErrorHandling(async () => {
      // Create AbortController for timeout handling
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        controller.abort()
      }, timeout)

      // Prepare request payload
      const payload = {
        device_id: this.deviceId,
        locale: this.getCurrentLocale(),
        answer: answer || null
      }

      console.log('[AgentService] Making request to backend:', {
        url: `${this.backendUrl}/api/session/request`,
        payload: { ...payload, device_id: payload.device_id.substring(0, 8) + '...' } // Log partial device_id for privacy
      })

      try {
        // Make the request
        const response = await fetch(`${this.backendUrl}/api/session/request`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        // Check if response is ok
        if (!response.ok) {
          const error = new Error(`Backend responded with status ${response.status}: ${response.statusText}`)
          throw createAppError('network', error.message, error, { 
            status: response.status, 
            statusText: response.statusText 
          })
        }

        // Parse response
        const data = await response.json()

        // Validate response format
        if (!this.validateResponse(data)) {
          const error = new Error('Invalid response format from backend')
          throw createAppError('network', error.message, error, { responseData: data })
        }

        console.log('[AgentService] Backend response received:', {
          decision: data.decision,
          allowed_minutes: data.allowed_minutes,
          persona: data.metadata?.persona
        })

        return data

      } catch (error) {
        clearTimeout(timeoutId)
        
        // Create appropriate AppError based on error type
        let appError
        if (error instanceof Error) {
          if (isTimeoutError(error)) {
            appError = createAppError('timeout', 'Request timed out', error, { timeout })
            console.warn('[AgentService] Backend request timed out, falling back to mock mode')
          } else if (isNetworkError(error)) {
            appError = createAppError('network', 'Network error occurred', error)
            console.warn('[AgentService] Network error, falling back to mock mode:', error.message)
          } else {
            appError = createAppError('unknown', 'Backend error occurred', error)
            console.warn('[AgentService] Backend error, falling back to mock mode:', error.message)
          }
        } else {
          appError = createAppError('unknown', 'Unknown error occurred', undefined, { originalError: error })
          console.warn('[AgentService] Unknown error, falling back to mock mode:', error)
        }

        // Log the error for debugging
        logError(appError, { 
          backendUrl: this.backendUrl, 
          deviceId: this.deviceId.substring(0, 8) + '...',
          payload: { ...payload, device_id: payload.device_id.substring(0, 8) + '...' }
        })

        // Activate mock mode for this session
        this.mockMode = true
        
        // Return mock decision
        return this.decideMock(getCurrentMockContext(), answer)
      }
    }, 'network')()
  }

  /**
   * Gets the current locale from the document or defaults to 'pt'
   */
  private getCurrentLocale(): 'pt' | 'en' {
    // Try to get locale from document lang attribute or localStorage
    const docLang = document.documentElement.lang
    const storedLang = localStorage.getItem('locale')
    
    if (docLang === 'en' || storedLang === 'en') {
      return 'en'
    }
    
    return 'pt' // Default to Portuguese
  }

  /**
   * Checks if the service is currently in mock mode
   */
  isInMockMode(): boolean {
    return this.mockMode
  }

  /**
   * Forces the service into mock mode
   * Useful for testing or when backend is known to be unavailable
   */
  enableMockMode(): void {
    this.mockMode = true
    console.log('[AgentService] Mock mode manually enabled')
  }

  /**
   * Disables mock mode (will attempt backend requests again)
   * Note: Mock mode may be re-enabled automatically on subsequent failures
   */
  disableMockMode(): void {
    this.mockMode = false
    console.log('[AgentService] Mock mode disabled, will attempt backend requests')
  }

  /**
   * Direct access to mock decision logic
   * Used internally and for testing
   */
  decideMock = decideMock

  /**
   * Gets the current device ID being used for requests
   */
  getDeviceId(): string {
    return this.deviceId
  }

  /**
   * Sets a custom device ID (useful for testing)
   */
  setDeviceId(deviceId: string): void {
    if (deviceId.length < 16) {
      throw new Error('Device ID must be at least 16 characters long')
    }
    this.deviceId = deviceId
  }

  /**
   * Gets the current backend URL
   */
  getBackendUrl(): string {
    return this.backendUrl
  }

  /**
   * Sets a custom backend URL
   */
  setBackendUrl(url: string): void {
    this.backendUrl = url
  }

  /**
   * Creates a simulation mode activation message
   * Used to inform users when mock mode is activated due to backend issues
   */
  createSimulationModeMessage(): DecisionResponse {
    return {
      decision: 'ASK_MORE',
      message_pt: 'Modo simulação ativo para demonstração. Como posso ajudar você?',
      message_en: 'Simulation mode active for demonstration. How can I help you?',
      allowed_minutes: 0,
      question_pt: null,
      question_en: null,
      metadata: {
        reason: 'simulation_mode_activated',
        persona: 'general'
      }
    }
  }

  /**
   * Checks if this is the first request in a session
   * Used to determine when to show simulation mode activation message
   */
  private isFirstRequest(answer?: string): boolean {
    return !answer // If no answer provided, it's likely the first request
  }
}

// Export a default instance
export const agentService = new AgentService()

// Export the class for custom instances
export default AgentService