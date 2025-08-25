/**
 * Agent service for backend communication with timeout and fallback logic
 * Handles communication with the backend API and provides mock mode fallback
 */

import { DecisionResponse, RequestOptions } from '../types'
import { decideMock, getCurrentMockContext, isValidDecisionResponse } from './mockService'
import { config } from './config'
import { t } from '../i18n'
import { 
  createAppError, 
  isNetworkError, 
  isTimeoutError, 
  logError, 
  getUserFriendlyErrorMessage,
  withErrorHandling,
  createRetryHandler
} from '../utils/errorHandling'

/**
 * AgentService class that handles backend communication with automatic fallback to mock mode
 */
export class AgentService {
  private mockMode: boolean = false
  private backendUrl: string
  private deviceId: string
  private routerId: string
  private currentChallenge: any = null
  private defaultPersona: 'tutor' | 'maternal' | 'general'

  constructor(backendUrl?: string) {
    const appConfig = config.get()
    this.backendUrl = backendUrl || appConfig.apiUrl
    this.mockMode = appConfig.mockMode
    this.deviceId = this.generateDeviceMAC()
    this.routerId = appConfig.routerId
    this.defaultPersona = appConfig.defaultPersona
    
    if (this.mockMode) {
      console.warn('[AgentService] Mock mode enabled via VITE_MOCK environment variable')
    }
  }

  /**
   * Generates a mock MAC address for session tracking
   * Format: XX:XX:XX:XX:XX:XX
   */
  private generateDeviceMAC(): string {
    return Array.from({ length: 6 }, () => 
      Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
    ).join(':').toUpperCase()
  }

  /**
   * Validates a DecisionResponse object
   * Ensures the response matches the expected interface
   */
  private validateResponse(response: any): response is DecisionResponse {
    return isValidDecisionResponse(response)
  }

  /**
   * Makes a request to the WiFi-Kids API with timeout and error handling
   * Automatically falls back to mock mode on timeout or error
   */
  async requestDecision(options: RequestOptions = {}): Promise<DecisionResponse> {
    const { answer, timeout = config.getApiTimeout() } = options

    // If already in mock mode, use mock directly
    if (this.mockMode) {
      console.log('[AgentService] Using mock mode (VITE_MOCK enabled)')
      return this.decideMock(getCurrentMockContext(), answer)
    }

    // Try real backend first, fallback to mock on any error
    try {
      console.log('[AgentService] Attempting real backend connection...')
      
      if (!answer || answer === 'continue_learning') {
        // Step 1: Generate challenge - either first time or continue learning
        const result = await this.generateChallenge(timeout)
        console.log('[AgentService] Real backend challenge generation success!')
        return result
      } else {
        // Step 2: Answer submission - validate answers and get access decision
        const result = await this.submitAnswer(answer, timeout)
        console.log('[AgentService] Real backend answer validation success!')
        return result
      }
      
    } catch (error) {
      console.warn('[AgentService] Real backend failed, falling back to enhanced mock mode:', error)
      this.mockMode = true
      return this.decideMock(getCurrentMockContext(), answer)
    }
  }

  /**
   * Step 1: Generate a new challenge from the WiFi-Kids API
   */
  private async generateChallenge(timeout: number): Promise<DecisionResponse> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const payload = {
      mac: this.deviceId,
      router_id: this.routerId,
      locale: this.getCurrentLocale() === 'pt' ? 'pt-BR' : 'en-US',
      persona: this.defaultPersona,
    }

    console.log('[AgentService] Generating challenge:', {
      url: `${this.backendUrl}/challenge/generate`,
      mac: payload.mac.substring(0, 8) + '...',
      persona: payload.persona
    })

    try {
      const response = await fetch(`${this.backendUrl}/challenge/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`API Error ${response.status}: ${response.statusText}`)
      }

      const challengeData = await response.json()
      this.currentChallenge = challengeData

      console.log('[AgentService] Challenge generated:', {
        id: challengeData.challenge_id,
        questions: challengeData.questions?.length || 0,
        persona: challengeData.metadata?.persona
      })

      // Convert to DecisionResponse format expected by frontend
      return this.formatChallengeAsDecision(challengeData)

    } catch (error) {
      clearTimeout(timeoutId)
      return this.handleAPIError(error, 'challenge generation')
    }
  }

  /**
   * Step 2: Submit answer and get access decision
   */
  private async submitAnswer(answer: string, timeout: number): Promise<DecisionResponse> {
    if (!this.currentChallenge) {
      throw new Error('No active challenge to answer')
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    // Parse user answer into structured format expected by API
    const answers = this.parseUserAnswer(answer)

    const payload = {
      challenge_id: this.currentChallenge.challenge_id,
      answers: answers
    }

    console.log('[AgentService] Submitting answer:', {
      url: `${this.backendUrl}/challenge/answer`,
      challenge_id: payload.challenge_id,
      answers: answers.length
    })

    try {
      const response = await fetch(`${this.backendUrl}/challenge/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`API Error ${response.status}: ${response.statusText}`)
      }

      const validationResult = await response.json()

      console.log('[AgentService] Answer validation result:', {
        decision: validationResult.decision,
        allowed_minutes: validationResult.allowed_minutes,
        attempts_left: validationResult.attempts_left
      })

      // Convert to DecisionResponse format
      return this.formatValidationAsDecision(validationResult)

    } catch (error) {
      clearTimeout(timeoutId)
      return this.handleAPIError(error, 'answer submission')
    }
  }

  /**
   * Convert challenge data from API to DecisionResponse format
   */
  private formatChallengeAsDecision(challengeData: any): DecisionResponse {
    const questions = challengeData.questions || []
    
    // Create a readable message with questions
    const message_pt = this.formatQuestionsAsMessage(questions, 'pt')
    const message_en = this.formatQuestionsAsMessage(questions, 'en')
    
    return {
      decision: 'ASK_MORE',
      message_pt,
      message_en,
      allowed_minutes: 0,
      question_pt: questions[0]?.prompt || null,
      question_en: questions[0]?.prompt || null, // TODO: Add English questions in future
      metadata: {
        reason: 'challenge_generated',
        persona: challengeData.metadata?.persona || 'tutor'
      }
    }
  }

  /**
   * Convert validation result from API to DecisionResponse format
   */
  private formatValidationAsDecision(validationResult: any): DecisionResponse {
    if (validationResult.decision === 'ALLOW') {
      return {
        decision: 'ALLOW',
        message_pt: `🎉 Parabéns! Você tem ${validationResult.allowed_minutes} minutos de internet. ${validationResult.feedback || ''}`,
        message_en: `🎉 Congratulations! You have ${validationResult.allowed_minutes} minutes of internet. ${validationResult.feedback || ''}`,
        allowed_minutes: validationResult.allowed_minutes || 30,
        question_pt: null,
        question_en: null,
        metadata: {
          reason: 'access_granted',
          persona: 'tutor'
        }
      }
    } else if (validationResult.decision === 'CONTINUE') {
      // Handle correct answers that need more questions
      const questions = validationResult.questions || []
      const hasProgress = validationResult.progress && validationResult.progress.questions_answered_correctly > 0
      // Create separate feedback for each language
      const successFeedback_pt = hasProgress ? '✅ Correto! ' : ''
      const successFeedback_en = hasProgress ? '✅ Correct! ' : ''
      const continueFeedback_pt = validationResult.feedback || 'Vamos continuar!'
      const continueFeedback_en = validationResult.feedback || 'Let\'s continue!'
      
      return {
        decision: 'ASK_MORE',
        message_pt: `${successFeedback_pt}${continueFeedback_pt} ${this.formatQuestionsAsMessage(questions, 'pt')}`,
        message_en: `${successFeedback_en}${continueFeedback_en} ${this.formatQuestionsAsMessage(questions, 'en')}`,
        allowed_minutes: 0,
        question_pt: questions[0]?.prompt || null,
        question_en: questions[0]?.prompt || null,
        questions: questions,
        metadata: {
          reason: hasProgress ? 'partial_credit' : 'continue_learning',
          persona: 'tutor'
        }
      }
    } else {
      // Handle wrong answers (DENY) 
      return {
        decision: 'DENY',
        message_pt: `❌ ${validationResult.feedback || 'Não foi dessa vez! Tente novamente.'}`,
        message_en: `❌ ${validationResult.feedback || 'Not this time! Try again.'}`,
        allowed_minutes: 0,
        question_pt: null,
        question_en: null,
        metadata: {
          reason: 'access_denied',
          persona: 'tutor'
        }
      }
    }
  }

  /**
   * Format questions as readable message text
   */
  private formatQuestionsAsMessage(questions: any[], locale: 'pt' | 'en'): string {
    if (!questions.length) return 'No questions available'
    
    const intro = locale === 'pt' ? 
      'Responda às perguntas para acessar a internet:' : 
      'Answer the questions to access the internet:'

    const questionTexts = questions.map((q, index) => {
      let text = `${index + 1}. ${q.prompt}`
      if (q.options && q.options.length > 0) {
        const optionLabels = ['A', 'B', 'C', 'D']
        text += '\n' + q.options.map((option: string, i: number) => 
          `   ${optionLabels[i]}) ${option}`
        ).join('\n')
      }
      return text
    }).join('\n\n')

    return `${intro}\n\n${questionTexts}`
  }

  /**
   * Parse user text answer into structured format for API
   */
  private parseUserAnswer(userText: string): Array<{id: string, value: string}> {
    const questions = this.currentChallenge?.questions || []
    const answers = []
    
    if (questions.length === 1) {
      // Single question - entire text is the answer
      answers.push({
        id: questions[0].id,
        value: userText.trim()
      })
    } else {
      // Multiple questions - try to parse "1: A, 2: B" or "A, B" format
      const cleanText = userText.trim()
      
      if (cleanText.includes(',')) {
        // Format like "A, B, C" or "1: A, 2: B"
        const parts = cleanText.split(',').map(p => p.trim())
        parts.forEach((part, index) => {
          if (index < questions.length) {
            const cleanAnswer = part.replace(/^\d+[:.]\s*/, '').trim()
            answers.push({
              id: questions[index].id,
              value: cleanAnswer
            })
          }
        })
      } else {
        // Single answer for first question
        answers.push({
          id: questions[0].id,
          value: userText.trim()
        })
      }
    }

    return answers
  }

  /**
   * Handle API errors with fallback to mock mode
   */
  private handleAPIError(error: any, operation: string): DecisionResponse {
    let appError
    if (error instanceof Error) {
      if (isTimeoutError(error)) {
        appError = createAppError('timeout', `${operation} timed out`, error)
        console.warn(`[AgentService] ${operation} timed out, falling back to mock mode`)
      } else if (isNetworkError(error)) {
        appError = createAppError('network', `Network error during ${operation}`, error)
        console.warn(`[AgentService] Network error during ${operation}, falling back to mock mode:`, error.message)
      } else {
        appError = createAppError('unknown', `Error during ${operation}`, error)
        console.warn(`[AgentService] Error during ${operation}, falling back to mock mode:`, error.message)
      }
    } else {
      appError = createAppError('unknown', `Unknown error during ${operation}`, undefined, { originalError: error })
      console.warn(`[AgentService] Unknown error during ${operation}, falling back to mock mode:`, error)
    }

    logError(appError, { 
      backendUrl: this.backendUrl, 
      deviceId: this.deviceId.substring(0, 8) + '...',
      operation
    })

    // Activate mock mode for this session
    this.mockMode = true
    
    // Return mock decision
    return this.decideMock(getCurrentMockContext())
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
   * Gets the current persona
   */
  getCurrentPersona(): 'tutor' | 'maternal' | 'general' {
    return this.defaultPersona
  }

  /**
   * Sets the persona for future requests
   */
  setPersona(persona: 'tutor' | 'maternal' | 'general'): void {
    if (config.isValidPersona(persona)) {
      this.defaultPersona = persona
      console.log(`[AgentService] Persona changed to: ${persona}`)
    } else {
      console.warn(`[AgentService] Invalid persona: ${persona}`)
    }
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