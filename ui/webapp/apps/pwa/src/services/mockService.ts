/**
 * Mock decision service for offline functionality
 * Implements time-based decision logic with support for windows crossing midnight
 */

import { MockContext, DecisionResponse, TimeWindow } from '../types'

/**
 * Checks if the current time falls within a specified time window
 * Supports windows that cross midnight (e.g., 21:00-07:00)
 * 
 * @param now - Current date/time
 * @param start - Start time in "HH:MM" format
 * @param end - End time in "HH:MM" format
 * @param timezone - Timezone string (currently unused, for future extension)
 * @returns true if current time is within the window
 */
export function inWindow(now: Date, start: string, end: string, timezone: string): boolean {
  const [startHour, startMin] = start.split(':').map(Number)
  const [endHour, endMin] = end.split(':').map(Number)
  
  // Validate time format
  if (isNaN(startHour) || isNaN(startMin) || isNaN(endHour) || isNaN(endMin)) {
    throw new Error(`Invalid time format. Expected "HH:MM", got start: "${start}", end: "${end}"`)
  }
  
  // Validate time ranges
  if (startHour < 0 || startHour > 23 || endHour < 0 || endHour > 23) {
    throw new Error(`Invalid hour. Hours must be 0-23, got start: ${startHour}, end: ${endHour}`)
  }
  
  if (startMin < 0 || startMin > 59 || endMin < 0 || endMin > 59) {
    throw new Error(`Invalid minute. Minutes must be 0-59, got start: ${startMin}, end: ${endMin}`)
  }
  
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const startMinutes = startHour * 60 + startMin
  const endMinutes = endHour * 60 + endMin
  
  if (startMinutes <= endMinutes) {
    // Same day window (e.g., 14:00-16:00)
    return currentMinutes >= startMinutes && currentMinutes < endMinutes
  } else {
    // Cross-midnight window (e.g., 21:00-07:00)
    return currentMinutes >= startMinutes || currentMinutes < endMinutes
  }
}

/**
 * Checks if current time is within any of the provided time windows
 * 
 * @param now - Current date/time
 * @param windows - Array of time windows to check
 * @param timezone - Timezone string
 * @returns true if current time is within any window
 */
export function inAnyWindow(now: Date, windows: TimeWindow[], timezone: string): boolean {
  return windows.some(window => inWindow(now, window.start, window.end, timezone))
}

/**
 * Creates a DENY response with appropriate bilingual messages
 * 
 * @param reason - Reason for denial
 * @param persona - Response persona style
 * @returns DecisionResponse with DENY decision
 */
export function createDenyResponse(
  reason: string, 
  persona: 'tutor' | 'maternal' | 'general' = 'general'
): DecisionResponse {
  const messages = {
    bedtime: {
      pt: 'É hora de dormir! Tente novamente amanhã de manhã.',
      en: 'It\'s bedtime! Try again tomorrow morning.'
    },
    study_time: {
      pt: 'Agora é hora de estudar. Tente novamente mais tarde.',
      en: 'It\'s study time now. Try again later.'
    },
    generic: {
      pt: 'Acesso não permitido no momento. Tente novamente mais tarde.',
      en: 'Access not allowed right now. Try again later.'
    }
  }
  
  const message = messages[reason as keyof typeof messages] || messages.generic
  
  return {
    decision: 'DENY',
    message_pt: message.pt,
    message_en: message.en,
    allowed_minutes: 0,
    question_pt: null,
    question_en: null,
    metadata: {
      reason,
      persona
    }
  }
}

/**
 * Creates an ALLOW response with specified time allocation
 * 
 * @param minutes - Minutes of access to grant
 * @param persona - Response persona style
 * @returns DecisionResponse with ALLOW decision
 */
export function createAllowResponse(
  minutes: number, 
  persona: 'tutor' | 'maternal' | 'general' = 'general'
): DecisionResponse {
  return {
    decision: 'ALLOW',
    message_pt: `Acesso liberado por ${minutes} minutos. Divirta-se!`,
    message_en: `Access granted for ${minutes} minutes. Have fun!`,
    allowed_minutes: minutes,
    question_pt: null,
    question_en: null,
    metadata: {
      reason: 'allowed',
      persona
    }
  }
}

/**
 * Creates an ASK_MORE response with a follow-up question
 * 
 * @param questionType - Type of question to ask
 * @param persona - Response persona style
 * @returns DecisionResponse with ASK_MORE decision
 */
export function createAskMoreResponse(
  questionType: string,
  persona: 'tutor' | 'maternal' | 'general' = 'tutor'
): DecisionResponse {
  const questions = {
    study_completion: {
      message_pt: 'Primeiro, me conta: você já terminou suas tarefas de casa?',
      message_en: 'First, tell me: have you finished your homework?',
      question_pt: 'Você terminou a lição de casa?',
      question_en: 'Did you finish your homework?'
    },
    generic: {
      message_pt: 'Preciso saber mais algumas coisas antes de liberar o acesso.',
      message_en: 'I need to know a few more things before granting access.',
      question_pt: 'Você pode me contar mais?',
      question_en: 'Can you tell me more?'
    }
  }
  
  const question = questions[questionType as keyof typeof questions] || questions.generic
  
  return {
    decision: 'ASK_MORE',
    message_pt: question.message_pt,
    message_en: question.message_en,
    allowed_minutes: 0,
    question_pt: question.question_pt,
    question_en: question.question_en,
    metadata: {
      reason: questionType,
      persona
    }
  }
}

/**
 * Gets the current mock context with default time windows
 * 
 * @param now - Current date (optional, defaults to new Date())
 * @returns MockContext with default configuration
 */
export function getCurrentMockContext(now: Date = new Date()): MockContext {
  return {
    now,
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    block_windows: [
      { start: '21:00', end: '07:00' } // Bedtime: 9 PM to 7 AM
    ],
    study_windows: [
      { start: '14:00', end: '16:00' } // Study time: 2 PM to 4 PM
    ]
  }
}
/**
 *
 Main mock decision function that implements time-based logic
 * Simulates backend decision-making based on current time and user answers
 * 
 * @param context - Mock context with time windows and current time
 * @param answer - Optional user answer to previous question
 * @returns DecisionResponse based on time windows and logic
 */
export function decideMock(context: MockContext, answer?: string): DecisionResponse {
  const { now, tz, block_windows, study_windows } = context
  
  // Check if current time is within blocking windows (e.g., bedtime)
  if (inAnyWindow(now, block_windows, tz)) {
    return createDenyResponse('bedtime', 'maternal')
  }
  
  // Check if current time is within study windows
  if (inAnyWindow(now, study_windows, tz)) {
    // If we have an answer, process it
    if (answer !== undefined) {
      const normalizedAnswer = answer.toLowerCase().trim()
      
      // Define answer patterns with priority (longer/more specific first)
      const negativePatterns = [
        'ainda não', 'ainda nao', 'not yet', 'não', 'nao', 'no', 'nope'
      ]
      const positivePatterns = [
        'já terminei', 'ja terminei', 'finished', 'done', 'terminei', 'já', 'ja', 'sim', 'yes'
      ]
      
      // Single character answers (handle separately to avoid conflicts)
      if (normalizedAnswer === 'n') {
        return createDenyResponse('study_time', 'tutor')
      } else if (normalizedAnswer === 'y' || normalizedAnswer === 's') {
        return createAllowResponse(15, 'tutor')
      }
      
      // Check negative patterns first (more specific)
      if (negativePatterns.some(pattern => normalizedAnswer.includes(pattern))) {
        return createDenyResponse('study_time', 'tutor')
      } else if (positivePatterns.some(pattern => normalizedAnswer.includes(pattern))) {
        return createAllowResponse(15, 'tutor')
      } else {
        // Unclear answer, ask again with more specific question
        return {
          decision: 'ASK_MORE',
          message_pt: 'Não entendi bem. Você pode responder com "sim" ou "não"?',
          message_en: 'I didn\'t understand. Can you answer with "yes" or "no"?',
          allowed_minutes: 0,
          question_pt: 'Você terminou toda a lição de casa? (sim/não)',
          question_en: 'Did you finish all your homework? (yes/no)',
          metadata: {
            reason: 'clarification_needed',
            persona: 'tutor'
          }
        }
      }
    } else {
      // First time asking during study hours
      return createAskMoreResponse('study_completion', 'tutor')
    }
  }
  
  // Default case: outside blocking and study windows, allow access
  return createAllowResponse(15, 'general')
}

/**
 * Validates that a DecisionResponse matches the expected interface
 * Used for testing and ensuring mock responses are properly formatted
 * 
 * @param response - Response object to validate
 * @returns true if response is valid DecisionResponse
 */
export function isValidDecisionResponse(response: any): response is DecisionResponse {
  if (!response || typeof response !== 'object') {
    return false
  }
  
  // Check required decision field
  if (!['ALLOW', 'DENY', 'ASK_MORE'].includes(response.decision)) {
    return false
  }
  
  // Check required message fields
  if (typeof response.message_pt !== 'string' || response.message_pt.length === 0) {
    return false
  }
  
  if (typeof response.message_en !== 'string' || response.message_en.length === 0) {
    return false
  }
  
  // Check allowed_minutes field
  if (typeof response.allowed_minutes !== 'number' || response.allowed_minutes < 0) {
    return false
  }
  
  // Check question fields (can be null or string)
  if (response.question_pt !== null && typeof response.question_pt !== 'string') {
    return false
  }
  
  if (response.question_en !== null && typeof response.question_en !== 'string') {
    return false
  }
  
  // Check metadata
  if (!response.metadata || typeof response.metadata !== 'object') {
    return false
  }
  
  if (typeof response.metadata.reason !== 'string') {
    return false
  }
  
  if (!['tutor', 'maternal', 'general'].includes(response.metadata.persona)) {
    return false
  }
  
  return true
}

/**
 * Creates a mock context for testing with specific time
 * Useful for testing different time scenarios
 * 
 * @param hour - Hour (0-23)
 * @param minute - Minute (0-59)
 * @param customWindows - Optional custom time windows
 * @returns MockContext for testing
 */
export function createTestMockContext(
  hour: number, 
  minute: number = 0,
  customWindows?: {
    block_windows?: TimeWindow[]
    study_windows?: TimeWindow[]
  }
): MockContext {
  const now = new Date()
  now.setHours(hour, minute, 0, 0)
  
  return {
    now,
    tz: 'UTC',
    block_windows: customWindows?.block_windows || [
      { start: '21:00', end: '07:00' }
    ],
    study_windows: customWindows?.study_windows || [
      { start: '14:00', end: '16:00' }
    ]
  }
}