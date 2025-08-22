/**
 * Tests for chat state machine functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { 
  ChatStateMachine, 
  STATE_TRANSITIONS, 
  isValidTransition, 
  getStateUIConfig 
} from './stateMachine'
import { AppState } from '../types'

describe('StateMachine', () => {
  describe('STATE_TRANSITIONS', () => {
    it('should define correct transition rules', () => {
      expect(STATE_TRANSITIONS).toEqual({
        IDLE: ['REQUESTING'],
        REQUESTING: ['ASK_MORE', 'ALLOW', 'DENY'],
        ASK_MORE: ['REQUESTING'],
        ALLOW: ['IDLE'],
        DENY: ['IDLE']
      })
    })
  })

  describe('isValidTransition', () => {
    it('should validate IDLE transitions', () => {
      expect(isValidTransition('IDLE', 'REQUESTING')).toBe(true)
      expect(isValidTransition('IDLE', 'ASK_MORE')).toBe(false)
      expect(isValidTransition('IDLE', 'ALLOW')).toBe(false)
      expect(isValidTransition('IDLE', 'DENY')).toBe(false)
      expect(isValidTransition('IDLE', 'IDLE')).toBe(false)
    })

    it('should validate REQUESTING transitions', () => {
      expect(isValidTransition('REQUESTING', 'ASK_MORE')).toBe(true)
      expect(isValidTransition('REQUESTING', 'ALLOW')).toBe(true)
      expect(isValidTransition('REQUESTING', 'DENY')).toBe(true)
      expect(isValidTransition('REQUESTING', 'IDLE')).toBe(false)
      expect(isValidTransition('REQUESTING', 'REQUESTING')).toBe(false)
    })

    it('should validate ASK_MORE transitions', () => {
      expect(isValidTransition('ASK_MORE', 'REQUESTING')).toBe(true)
      expect(isValidTransition('ASK_MORE', 'IDLE')).toBe(false)
      expect(isValidTransition('ASK_MORE', 'ALLOW')).toBe(false)
      expect(isValidTransition('ASK_MORE', 'DENY')).toBe(false)
      expect(isValidTransition('ASK_MORE', 'ASK_MORE')).toBe(false)
    })

    it('should validate ALLOW transitions', () => {
      expect(isValidTransition('ALLOW', 'IDLE')).toBe(true)
      expect(isValidTransition('ALLOW', 'REQUESTING')).toBe(false)
      expect(isValidTransition('ALLOW', 'ASK_MORE')).toBe(false)
      expect(isValidTransition('ALLOW', 'DENY')).toBe(false)
      expect(isValidTransition('ALLOW', 'ALLOW')).toBe(false)
    })

    it('should validate DENY transitions', () => {
      expect(isValidTransition('DENY', 'IDLE')).toBe(true)
      expect(isValidTransition('DENY', 'REQUESTING')).toBe(false)
      expect(isValidTransition('DENY', 'ASK_MORE')).toBe(false)
      expect(isValidTransition('DENY', 'ALLOW')).toBe(false)
      expect(isValidTransition('DENY', 'DENY')).toBe(false)
    })
  })

  describe('ChatStateMachine', () => {
    let stateMachine: ChatStateMachine

    beforeEach(() => {
      stateMachine = new ChatStateMachine()
    })

    describe('initial state', () => {
      it('should start in IDLE state', () => {
        expect(stateMachine.state).toBe('IDLE')
      })

      it('should have IDLE in history', () => {
        expect(stateMachine.history).toEqual(['IDLE'])
      })
    })

    describe('transition method', () => {
      it('should allow valid transitions', () => {
        const result = stateMachine.transition('REQUESTING')
        expect(result).toBe(true)
        expect(stateMachine.state).toBe('REQUESTING')
      })

      it('should reject invalid transitions', () => {
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
        
        const result = stateMachine.transition('ALLOW')
        expect(result).toBe(false)
        expect(stateMachine.state).toBe('IDLE')
        expect(consoleSpy).toHaveBeenCalledWith('Invalid state transition: IDLE → ALLOW')
        
        consoleSpy.mockRestore()
      })

      it('should update history on successful transitions', () => {
        stateMachine.transition('REQUESTING')
        stateMachine.transition('ASK_MORE')
        
        expect(stateMachine.history).toEqual(['IDLE', 'REQUESTING', 'ASK_MORE'])
      })

      it('should not update history on failed transitions', () => {
        stateMachine.transition('ALLOW') // Invalid from IDLE
        
        expect(stateMachine.history).toEqual(['IDLE'])
      })

      it('should notify listeners on successful transitions', () => {
        const listener = vi.fn()
        stateMachine.onStateChange(listener)
        
        stateMachine.transition('REQUESTING')
        
        expect(listener).toHaveBeenCalledWith('REQUESTING', 'IDLE')
      })

      it('should not notify listeners on failed transitions', () => {
        const listener = vi.fn()
        stateMachine.onStateChange(listener)
        
        stateMachine.transition('ALLOW') // Invalid
        
        expect(listener).not.toHaveBeenCalled()
      })
    })

    describe('forceTransition method', () => {
      it('should allow any transition without validation', () => {
        stateMachine.forceTransition('ALLOW') // Invalid normally
        expect(stateMachine.state).toBe('ALLOW')
      })

      it('should update history', () => {
        stateMachine.forceTransition('DENY')
        expect(stateMachine.history).toEqual(['IDLE', 'DENY'])
      })

      it('should notify listeners', () => {
        const listener = vi.fn()
        stateMachine.onStateChange(listener)
        
        stateMachine.forceTransition('ALLOW')
        
        expect(listener).toHaveBeenCalledWith('ALLOW', 'IDLE')
      })
    })

    describe('reset method', () => {
      it('should return to IDLE from any state', () => {
        stateMachine.forceTransition('DENY')
        stateMachine.reset()
        
        expect(stateMachine.state).toBe('IDLE')
      })

      it('should update history', () => {
        stateMachine.transition('REQUESTING')
        stateMachine.reset()
        
        expect(stateMachine.history).toEqual(['IDLE', 'REQUESTING', 'IDLE'])
      })

      it('should notify listeners', () => {
        const listener = vi.fn()
        stateMachine.forceTransition('DENY')
        stateMachine.onStateChange(listener)
        
        stateMachine.reset()
        
        expect(listener).toHaveBeenCalledWith('IDLE', 'DENY')
      })
    })

    describe('canTransitionTo method', () => {
      it('should check if transition is possible', () => {
        expect(stateMachine.canTransitionTo('REQUESTING')).toBe(true)
        expect(stateMachine.canTransitionTo('ALLOW')).toBe(false)
      })

      it('should work from different states', () => {
        stateMachine.transition('REQUESTING')
        
        expect(stateMachine.canTransitionTo('ASK_MORE')).toBe(true)
        expect(stateMachine.canTransitionTo('ALLOW')).toBe(true)
        expect(stateMachine.canTransitionTo('DENY')).toBe(true)
        expect(stateMachine.canTransitionTo('IDLE')).toBe(false)
      })
    })

    describe('getNextStates method', () => {
      it('should return possible next states', () => {
        expect(stateMachine.getNextStates()).toEqual(['REQUESTING'])
      })

      it('should work from different states', () => {
        stateMachine.transition('REQUESTING')
        const nextStates = stateMachine.getNextStates()
        
        expect(nextStates).toContain('ASK_MORE')
        expect(nextStates).toContain('ALLOW')
        expect(nextStates).toContain('DENY')
        expect(nextStates).toHaveLength(3)
      })
    })

    describe('state listeners', () => {
      it('should add and call listeners', () => {
        const listener1 = vi.fn()
        const listener2 = vi.fn()
        
        stateMachine.onStateChange(listener1)
        stateMachine.onStateChange(listener2)
        
        stateMachine.transition('REQUESTING')
        
        expect(listener1).toHaveBeenCalledWith('REQUESTING', 'IDLE')
        expect(listener2).toHaveBeenCalledWith('REQUESTING', 'IDLE')
      })

      it('should return unsubscribe function', () => {
        const listener = vi.fn()
        const unsubscribe = stateMachine.onStateChange(listener)
        
        unsubscribe()
        stateMachine.transition('REQUESTING')
        
        expect(listener).not.toHaveBeenCalled()
      })

      it('should handle listener errors gracefully', () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        const errorListener = vi.fn(() => { throw new Error('Listener error') })
        const normalListener = vi.fn()
        
        stateMachine.onStateChange(errorListener)
        stateMachine.onStateChange(normalListener)
        
        stateMachine.transition('REQUESTING')
        
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error in state change listener:', expect.any(Error))
        expect(normalListener).toHaveBeenCalled() // Should still be called
        
        consoleErrorSpy.mockRestore()
      })

      it('should clear all listeners', () => {
        const listener1 = vi.fn()
        const listener2 = vi.fn()
        
        stateMachine.onStateChange(listener1)
        stateMachine.onStateChange(listener2)
        stateMachine.clearListeners()
        
        stateMachine.transition('REQUESTING')
        
        expect(listener1).not.toHaveBeenCalled()
        expect(listener2).not.toHaveBeenCalled()
      })
    })

    describe('state check methods', () => {
      it('should check terminal states', () => {
        expect(stateMachine.isInTerminalState()).toBe(false)
        
        stateMachine.forceTransition('ALLOW')
        expect(stateMachine.isInTerminalState()).toBe(true)
        
        stateMachine.forceTransition('DENY')
        expect(stateMachine.isInTerminalState()).toBe(true)
        
        stateMachine.forceTransition('REQUESTING')
        expect(stateMachine.isInTerminalState()).toBe(false)
      })

      it('should check processing state', () => {
        expect(stateMachine.isProcessing()).toBe(false)
        
        stateMachine.transition('REQUESTING')
        expect(stateMachine.isProcessing()).toBe(true)
        
        stateMachine.transition('ALLOW')
        expect(stateMachine.isProcessing()).toBe(false)
      })

      it('should check waiting for input state', () => {
        expect(stateMachine.isWaitingForInput()).toBe(false)
        
        stateMachine.transition('REQUESTING')
        stateMachine.transition('ASK_MORE')
        expect(stateMachine.isWaitingForInput()).toBe(true)
        
        stateMachine.transition('REQUESTING')
        expect(stateMachine.isWaitingForInput()).toBe(false)
      })

      it('should check idle state', () => {
        expect(stateMachine.isIdle()).toBe(true)
        
        stateMachine.transition('REQUESTING')
        expect(stateMachine.isIdle()).toBe(false)
        
        stateMachine.transition('ALLOW')
        stateMachine.transition('IDLE')
        expect(stateMachine.isIdle()).toBe(true)
      })
    })

    describe('complete flow scenarios', () => {
      it('should handle successful ALLOW flow', () => {
        const listener = vi.fn()
        stateMachine.onStateChange(listener)
        
        // IDLE → REQUESTING → ALLOW → IDLE
        expect(stateMachine.transition('REQUESTING')).toBe(true)
        expect(stateMachine.transition('ALLOW')).toBe(true)
        expect(stateMachine.transition('IDLE')).toBe(true)
        
        expect(listener).toHaveBeenCalledTimes(3)
        expect(stateMachine.history).toEqual(['IDLE', 'REQUESTING', 'ALLOW', 'IDLE'])
      })

      it('should handle ASK_MORE flow', () => {
        // IDLE → REQUESTING → ASK_MORE → REQUESTING → ALLOW → IDLE
        expect(stateMachine.transition('REQUESTING')).toBe(true)
        expect(stateMachine.transition('ASK_MORE')).toBe(true)
        expect(stateMachine.transition('REQUESTING')).toBe(true)
        expect(stateMachine.transition('ALLOW')).toBe(true)
        expect(stateMachine.transition('IDLE')).toBe(true)
        
        expect(stateMachine.history).toEqual([
          'IDLE', 'REQUESTING', 'ASK_MORE', 'REQUESTING', 'ALLOW', 'IDLE'
        ])
      })

      it('should handle DENY flow with retry', () => {
        // IDLE → REQUESTING → DENY → IDLE (reset)
        expect(stateMachine.transition('REQUESTING')).toBe(true)
        expect(stateMachine.transition('DENY')).toBe(true)
        stateMachine.reset() // Try again
        
        expect(stateMachine.state).toBe('IDLE')
        expect(stateMachine.history).toEqual(['IDLE', 'REQUESTING', 'DENY', 'IDLE'])
      })
    })
  })

  describe('getStateUIConfig', () => {
    it('should return correct config for IDLE state', () => {
      const config = getStateUIConfig('IDLE')
      
      expect(config).toEqual({
        showChatPanel: false,
        ctaEnabled: true,
        ctaText: { pt: 'Acessar Internet', en: 'Access Internet' },
        showTypingIndicator: false,
        showTryAgainButton: false,
        inputEnabled: false
      })
    })

    it('should return correct config for REQUESTING state', () => {
      const config = getStateUIConfig('REQUESTING')
      
      expect(config).toEqual({
        showChatPanel: true,
        ctaEnabled: false,
        ctaText: { pt: 'Processando...', en: 'Processing...' },
        showTypingIndicator: true,
        showTryAgainButton: false,
        inputEnabled: false
      })
    })

    it('should return correct config for ASK_MORE state', () => {
      const config = getStateUIConfig('ASK_MORE')
      
      expect(config).toEqual({
        showChatPanel: true,
        ctaEnabled: false,
        ctaText: { pt: 'Aguardando resposta...', en: 'Waiting for response...' },
        showTypingIndicator: false,
        showTryAgainButton: false,
        inputEnabled: true
      })
    })

    it('should return correct config for ALLOW state', () => {
      const config = getStateUIConfig('ALLOW')
      
      expect(config).toEqual({
        showChatPanel: true,
        ctaEnabled: false,
        ctaText: { pt: 'Acesso Liberado!', en: 'Access Granted!' },
        showTypingIndicator: false,
        showTryAgainButton: false,
        inputEnabled: false
      })
    })

    it('should return correct config for DENY state', () => {
      const config = getStateUIConfig('DENY')
      
      expect(config).toEqual({
        showChatPanel: true,
        ctaEnabled: true, // Enable CTA for retry
        ctaText: { pt: 'Acessar Internet', en: 'Access Internet' },
        showTypingIndicator: false,
        showTryAgainButton: true,
        inputEnabled: false
      })
    })

    it('should return default config for invalid state', () => {
      const config = getStateUIConfig('INVALID' as AppState)
      
      expect(config).toEqual({
        showChatPanel: false,
        ctaEnabled: true,
        ctaText: { pt: 'Acessar Internet', en: 'Access Internet' },
        showTypingIndicator: false,
        showTryAgainButton: false,
        inputEnabled: false
      })
    })
  })
})