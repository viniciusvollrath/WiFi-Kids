/**
 * Core types and interfaces for the Wi-Fi Kids PWA chat system
 */

import { Locale } from './i18n'

// Re-export Locale type for consistency
export { Locale }

// Bilingual content structure for messages
export interface BilingualContent {
  pt: string
  en: string
}

// Chat message interface supporting bilingual content
export interface ChatMessage {
  id: string
  from: 'agent' | 'user'
  content: BilingualContent
  timestamp: number
  metadata?: {
    persona?: 'tutor' | 'maternal' | 'general'
    reason?: string
  }
}

// Application state machine states
export type AppState = 'IDLE' | 'REQUESTING' | 'ASK_MORE' | 'ALLOW' | 'DENY'

// Decision response interface (backend API contract)
export interface DecisionResponse {
  decision: 'ALLOW' | 'DENY' | 'ASK_MORE'
  message_pt: string
  message_en: string
  allowed_minutes: number
  question_pt: string | null
  question_en: string | null
  questions?: Question[]
  metadata: {
    reason: string
    persona: 'tutor' | 'maternal' | 'general'
  }
}

// Mock context for offline functionality
export interface MockContext {
  now: Date
  tz: string
  block_windows: Array<{ start: string; end: string }>
  study_windows: Array<{ start: string; end: string }>
}

// Time window interface for mock logic
export interface TimeWindow {
  start: string // Format: "HH:MM"
  end: string   // Format: "HH:MM"
}

// Message store interface for state management
export interface MessageStore {
  messages: ChatMessage[]
  add: (from: 'agent' | 'user', content: BilingualContent, metadata?: ChatMessage['metadata']) => void
  clear: () => void
  getById: (id: string) => ChatMessage | undefined
}

// State machine transition map
export type StateTransitions = Record<AppState, AppState[]>

// Agent service interface
export interface AgentService {
  requestDecision: (options?: { answer?: string }) => Promise<DecisionResponse>
  isInMockMode: () => boolean
  decideMock: (context: MockContext, answer?: string) => DecisionResponse
}

// Chat panel props interface
export interface ChatPanelProps {
  state: AppState
  messages: ChatMessage[]
  loading: boolean
  onSend: (message: string) => void
  onRetry: () => void
  locale: Locale
  questions?: Question[]
  onAnswersSubmit?: (answers: Record<string, string>) => void
}

// Language toggle props interface
export interface LanguageToggleProps {
  locale: Locale
  onChange: (locale: Locale) => void
}

// Agent message props interface
export interface AgentMessageProps {
  message: ChatMessage
  locale: Locale
}

// User message props interface
export interface UserMessageProps {
  message: ChatMessage
  locale: Locale
}

// Chat input props interface
export interface ChatInputProps {
  onSend: (message: string) => void
  disabled: boolean
  placeholder?: string
}

// Typing indicator props interface
export interface TypingIndicatorProps {
  visible: boolean
}

// Simulation badge props interface
export interface SimulationBadgeProps {
  visible: boolean
  locale: Locale
}

// Error boundary state interface
export interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

// Request options for agent service
export interface RequestOptions {
  answer?: string
  timeout?: number
}

// Mock response generators type
export type MockResponseGenerator = (
  reason: string,
  persona?: 'tutor' | 'maternal' | 'general'
) => DecisionResponse

// State transition validator type
export type StateTransitionValidator = (
  from: AppState,
  to: AppState
) => boolean

// Message ID generator type
export type MessageIdGenerator = () => string

// Time window checker type
export type TimeWindowChecker = (
  now: Date,
  start: string,
  end: string,
  timezone: string
) => boolean

// Question-related types for educational challenges
export interface Question {
  id: string
  text: string
  type: 'short' | 'multiple_choice' | 'true_false'
  options?: string[]
  correct_answer?: string | number | boolean
  answer_len?: number
  difficulty: 'easy' | 'medium' | 'hard'
  subject: string
}

// Answer input props interface
export interface AnswerInputProps {
  mode: 'chat' | 'questions'
  questions?: Question[]
  onSend: (message: string) => void
  onAnswersSubmit: (answers: Record<string, string>) => void
  disabled?: boolean
  locale: 'pt' | 'en'
  loading?: boolean
}