/**
 * Type validators and utility functions for the chat system
 */

import {
  ChatMessage,
  DecisionResponse,
  AppState,
  MockContext,
  BilingualContent,
  StateTransitions
} from '../types'

/**
 * Validates if a response matches the DecisionResponse interface
 */
export function isValidDecisionResponse(response: any): response is DecisionResponse {
  return (
    response &&
    typeof response === 'object' &&
    ['ALLOW', 'DENY', 'ASK_MORE'].includes(response.decision) &&
    typeof response.message_pt === 'string' &&
    response.message_pt.length > 0 &&
    typeof response.message_en === 'string' &&
    response.message_en.length > 0 &&
    typeof response.allowed_minutes === 'number' &&
    response.allowed_minutes >= 0 &&
    (response.question_pt === null || typeof response.question_pt === 'string') &&
    (response.question_en === null || typeof response.question_en === 'string') &&
    response.metadata &&
    typeof response.metadata.reason === 'string' &&
    ['tutor', 'maternal', 'general'].includes(response.metadata.persona)
  )
}

/**
 * Validates if a state transition is allowed
 */
export function isValidStateTransition(from: AppState, to: AppState): boolean {
  const transitions: Record<AppState, AppState[]> = {
    IDLE: ['REQUESTING'],
    REQUESTING: ['ASK_MORE', 'ALLOW', 'DENY'],
    ASK_MORE: ['REQUESTING'],
    ALLOW: ['IDLE'],
    DENY: ['IDLE']
  }

  return transitions[from].includes(to)
}

/**
 * Creates a bilingual content object
 */
export function createBilingualContent(pt: string, en: string): BilingualContent {
  return { pt, en }
}

/**
 * Generates a unique message ID
 */
export function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Creates a chat message with proper structure
 */
export function createChatMessage(
  from: 'agent' | 'user',
  content: BilingualContent,
  metadata?: ChatMessage['metadata']
): ChatMessage {
  return {
    id: generateMessageId(),
    from,
    content,
    timestamp: Date.now(),
    metadata
  }
}

/**
 * Validates if a MockContext object is properly structured
 */
export function isValidMockContext(context: any): context is MockContext {
  return (
    context &&
    typeof context === 'object' &&
    context.now instanceof Date &&
    typeof context.tz === 'string' &&
    Array.isArray(context.block_windows) &&
    Array.isArray(context.study_windows) &&
    context.block_windows.every((w: any) => 
      typeof w.start === 'string' && typeof w.end === 'string'
    ) &&
    context.study_windows.every((w: any) => 
      typeof w.start === 'string' && typeof w.end === 'string'
    )
  )
}