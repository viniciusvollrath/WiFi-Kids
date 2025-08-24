/**
 * Finite state machine for chat flow management
 * Handles state transitions and validation for the chat interface
 */

import { AppState, StateTransitions, StateTransitionValidator } from '../types'

/**
 * Valid state transitions for the chat flow
 * IDLE → REQUESTING → (ASK_MORE | CONTINUE | ALLOW | DENY)
 * ASK_MORE → REQUESTING
 * CONTINUE → REQUESTING
 * ALLOW → IDLE | CONTINUE (for keep learning functionality)
 * DENY → IDLE
 */
export const STATE_TRANSITIONS: StateTransitions = {
  IDLE: ['REQUESTING'],
  REQUESTING: ['ASK_MORE', 'CONTINUE', 'ALLOW', 'DENY'],
  ASK_MORE: ['REQUESTING'],
  CONTINUE: ['REQUESTING'],
  ALLOW: ['IDLE', 'CONTINUE'],
  DENY: ['IDLE']
}

/**
 * Validates if a state transition is allowed
 */
export const isValidTransition: StateTransitionValidator = (from: AppState, to: AppState): boolean => {
  const allowedTransitions = STATE_TRANSITIONS[from]
  return allowedTransitions.includes(to)
}

/**
 * State machine class for managing chat flow
 */
export class ChatStateMachine {
  private currentState: AppState = 'IDLE'
  private stateHistory: AppState[] = ['IDLE']
  private listeners: Array<(state: AppState, previousState: AppState) => void> = []

  /**
   * Get the current state
   */
  get state(): AppState {
    return this.currentState
  }

  /**
   * Get the state history
   */
  get history(): readonly AppState[] {
    return [...this.stateHistory]
  }

  /**
   * Transition to a new state with validation
   */
  transition(newState: AppState): boolean {
    if (!isValidTransition(this.currentState, newState)) {
      console.warn(`Invalid state transition: ${this.currentState} → ${newState}`)
      return false
    }

    const previousState = this.currentState
    this.currentState = newState
    this.stateHistory.push(newState)

    // Notify listeners
    this.listeners.forEach(listener => {
      try {
        listener(newState, previousState)
      } catch (error) {
        console.error('Error in state change listener:', error)
      }
    })

    return true
  }

  /**
   * Force transition to a state (bypasses validation)
   * Use with caution - mainly for error recovery
   */
  forceTransition(newState: AppState): void {
    const previousState = this.currentState
    this.currentState = newState
    this.stateHistory.push(newState)

    // Notify listeners
    this.listeners.forEach(listener => {
      try {
        listener(newState, previousState)
      } catch (error) {
        console.error('Error in state change listener:', error)
      }
    })
  }

  /**
   * Reset to IDLE state (for "Try Again" functionality)
   */
  reset(): void {
    const previousState = this.currentState
    this.currentState = 'IDLE'
    this.stateHistory.push('IDLE')

    // Notify listeners
    this.listeners.forEach(listener => {
      try {
        listener('IDLE', previousState)
      } catch (error) {
        console.error('Error in state change listener:', error)
      }
    })
  }

  /**
   * Check if the current state allows a specific transition
   */
  canTransitionTo(targetState: AppState): boolean {
    return isValidTransition(this.currentState, targetState)
  }

  /**
   * Get all possible next states from current state
   */
  getNextStates(): AppState[] {
    return [...STATE_TRANSITIONS[this.currentState]]
  }

  /**
   * Add a listener for state changes
   */
  onStateChange(listener: (state: AppState, previousState: AppState) => void): () => void {
    this.listeners.push(listener)
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  /**
   * Remove all listeners
   */
  clearListeners(): void {
    this.listeners = []
  }

  /**
   * Check if currently in a terminal state (ALLOW or DENY)
   */
  isInTerminalState(): boolean {
    return this.currentState === 'ALLOW' || this.currentState === 'DENY'
  }

  /**
   * Check if currently in a processing state (REQUESTING)
   */
  isProcessing(): boolean {
    return this.currentState === 'REQUESTING'
  }

  /**
   * Check if currently waiting for user input (ASK_MORE or CONTINUE)
   */
  isWaitingForInput(): boolean {
    return this.currentState === 'ASK_MORE' || this.currentState === 'CONTINUE'
  }

  /**
   * Check if currently idle (ready to start new request)
   */
  isIdle(): boolean {
    return this.currentState === 'IDLE'
  }
}

/**
 * State-based UI rendering helpers
 */
export const getStateUIConfig = (state: AppState) => {
  switch (state) {
    case 'IDLE':
      return {
        showChatPanel: false,
        ctaEnabled: true,
        ctaText: { pt: 'Acessar Internet', en: 'Access Internet' },
        showTypingIndicator: false,
        showTryAgainButton: false,
        inputEnabled: false
      }
    
    case 'REQUESTING':
      return {
        showChatPanel: true,
        ctaEnabled: false,
        ctaText: { pt: 'Processando...', en: 'Processing...' },
        showTypingIndicator: true,
        showTryAgainButton: false,
        inputEnabled: false
      }
    
    case 'ASK_MORE':
      return {
        showChatPanel: true,
        ctaEnabled: false,
        ctaText: { pt: 'Aguardando resposta...', en: 'Waiting for response...' },
        showTypingIndicator: false,
        showTryAgainButton: false,
        inputEnabled: true
      }
    
    case 'CONTINUE':
      return {
        showChatPanel: true,
        ctaEnabled: false,
        ctaText: { pt: 'Continuar aprendendo...', en: 'Continue learning...' },
        showTypingIndicator: false,
        showTryAgainButton: false,
        inputEnabled: true
      }
    
    case 'ALLOW':
      return {
        showChatPanel: true,
        ctaEnabled: false, // Will be re-enabled after 2 seconds
        ctaText: { pt: 'Acesso Liberado!', en: 'Access Granted!' },
        showTypingIndicator: false,
        showTryAgainButton: false,
        inputEnabled: false
      }
    
    case 'DENY':
      return {
        showChatPanel: true,
        ctaEnabled: true, // Enable CTA for retry
        ctaText: { pt: 'Acessar Internet', en: 'Access Internet' },
        showTypingIndicator: false,
        showTryAgainButton: true,
        inputEnabled: false
      }
    
    default:
      return {
        showChatPanel: false,
        ctaEnabled: true,
        ctaText: { pt: 'Acessar Internet', en: 'Access Internet' },
        showTypingIndicator: false,
        showTryAgainButton: false,
        inputEnabled: false
      }
  }
}

/**
 * Global state machine instance
 */
export const chatStateMachine = new ChatStateMachine()