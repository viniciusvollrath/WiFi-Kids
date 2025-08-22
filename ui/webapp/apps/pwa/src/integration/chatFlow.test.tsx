/**
 * Integration tests for chat flow components
 * Tests integration between ChatPanel, MessageStore, and AgentService
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChatPanel } from '../components/ChatPanel'
import { createMessageStore } from '../services/messageStore'
import { ChatStateMachine } from '../services/stateMachine'
import { ChatMessage } from '../types'

describe('Chat Flow Integration Tests', () => {
  let messageStore: ReturnType<typeof createMessageStore>
  let stateMachine: ChatStateMachine
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    messageStore = createMessageStore()
    stateMachine = new ChatStateMachine()
    user = userEvent.setup()
  })

  describe('MessageStore and ChatPanel Integration', () => {
    it('should display messages from store correctly', () => {
      // Add messages to store
      messageStore.add('agent', {
        pt: 'Olá! Como posso ajudar?',
        en: 'Hello! How can I help?'
      }, { persona: 'tutor', reason: 'greeting' })

      messageStore.add('user', {
        pt: 'Quero acessar a internet',
        en: 'I want to access the internet'
      })

      const messages = messageStore.messages

      render(
        <ChatPanel
          state="ASK_MORE"
          messages={messages}
          loading={false}
          onSend={vi.fn()}
          onRetry={vi.fn()}
          locale="en"
        />
      )

      expect(screen.getByText('Hello! How can I help?')).toBeInTheDocument()
      expect(screen.getByText('I want to access the internet')).toBeInTheDocument()
    })

    it('should handle bilingual message switching', () => {
      messageStore.add('agent', {
        pt: 'Você terminou a lição de casa?',
        en: 'Did you finish your homework?'
      })

      const messages = messageStore.messages

      const { rerender } = render(
        <ChatPanel
          state="ASK_MORE"
          messages={messages}
          loading={false}
          onSend={vi.fn()}
          onRetry={vi.fn()}
          locale="pt"
        />
      )

      expect(screen.getByText('Você terminou a lição de casa?')).toBeInTheDocument()

      rerender(
        <ChatPanel
          state="ASK_MORE"
          messages={messages}
          loading={false}
          onSend={vi.fn()}
          onRetry={vi.fn()}
          locale="en"
        />
      )

      expect(screen.getByText('Did you finish your homework?')).toBeInTheDocument()
    })
  })

  describe('StateMachine and ChatPanel Integration', () => {
    it('should show correct UI based on state machine state', () => {
      const messages: ChatMessage[] = []

      // Test IDLE state
      const { rerender } = render(
        <ChatPanel
          state={stateMachine.state}
          messages={messages}
          loading={false}
          onSend={vi.fn()}
          onRetry={vi.fn()}
          locale="en"
        />
      )

      expect(stateMachine.state).toBe('IDLE')

      // Transition to REQUESTING
      stateMachine.transition('REQUESTING')
      rerender(
        <ChatPanel
          state={stateMachine.state}
          messages={messages}
          loading={true}
          onSend={vi.fn()}
          onRetry={vi.fn()}
          locale="en"
        />
      )

      expect(screen.getByText('typing...')).toBeInTheDocument()

      // Transition to ASK_MORE
      stateMachine.transition('ASK_MORE')
      rerender(
        <ChatPanel
          state={stateMachine.state}
          messages={messages}
          loading={false}
          onSend={vi.fn()}
          onRetry={vi.fn()}
          locale="en"
        />
      )

      const input = screen.getByPlaceholderText('Type your message...')
      expect(input).toBeEnabled()
    })

    it('should handle state transitions correctly', () => {
      expect(stateMachine.state).toBe('IDLE')
      expect(stateMachine.canTransitionTo('REQUESTING')).toBe(true)

      stateMachine.transition('REQUESTING')
      expect(stateMachine.state).toBe('REQUESTING')
      expect(stateMachine.canTransitionTo('ASK_MORE')).toBe(true)
      expect(stateMachine.canTransitionTo('ALLOW')).toBe(true)
      expect(stateMachine.canTransitionTo('DENY')).toBe(true)

      stateMachine.transition('ASK_MORE')
      expect(stateMachine.state).toBe('ASK_MORE')
      expect(stateMachine.canTransitionTo('REQUESTING')).toBe(true)
    })
  })

  describe('Message Flow Integration', () => {
    it('should handle complete conversation flow', async () => {
      const onSend = vi.fn()
      
      // Start with agent greeting
      messageStore.add('agent', {
        pt: 'Olá! Como posso ajudar?',
        en: 'Hello! How can I help?'
      })

      render(
        <ChatPanel
          state="ASK_MORE"
          messages={messageStore.messages}
          loading={false}
          onSend={onSend}
          onRetry={vi.fn()}
          locale="en"
        />
      )

      expect(screen.getByText('Hello! How can I help?')).toBeInTheDocument()

      // User sends message
      const input = screen.getByPlaceholderText('Type your message...')
      await user.type(input, 'yes')
      await user.keyboard('{Enter}')

      expect(onSend).toHaveBeenCalledWith('yes')

      // Add user message to store
      messageStore.add('user', {
        pt: 'sim',
        en: 'yes'
      })

      // Add agent response
      messageStore.add('agent', {
        pt: 'Ótimo! Acesso liberado.',
        en: 'Great! Access granted.'
      })

      // Re-render with updated messages
      const { rerender } = render(
        <ChatPanel
          state="ALLOW"
          messages={messageStore.messages}
          loading={false}
          onSend={onSend}
          onRetry={vi.fn()}
          locale="en"
        />
      )

      expect(screen.getByText('yes')).toBeInTheDocument()
      expect(screen.getByText('Great! Access granted.')).toBeInTheDocument()
    })
  })

  describe('Input Validation Integration', () => {
    it('should validate user input before sending', async () => {
      const onSend = vi.fn()

      render(
        <ChatPanel
          state="ASK_MORE"
          messages={[]}
          loading={false}
          onSend={onSend}
          onRetry={vi.fn()}
          locale="en"
        />
      )

      const input = screen.getByPlaceholderText('Type your message...')

      // Test empty input
      await user.type(input, '   ')
      await user.keyboard('{Enter}')

      expect(screen.getByText('Please type a valid message.')).toBeInTheDocument()
      expect(onSend).not.toHaveBeenCalled()

      // Clear error and test valid input
      await user.clear(input)
      await user.type(input, 'valid message')
      await user.keyboard('{Enter}')

      expect(onSend).toHaveBeenCalledWith('valid message')
    })

    it('should handle long messages correctly', async () => {
      const onSend = vi.fn()

      render(
        <ChatPanel
          state="ASK_MORE"
          messages={[]}
          loading={false}
          onSend={onSend}
          onRetry={vi.fn()}
          locale="en"
        />
      )

      const input = screen.getByPlaceholderText('Type your message...')
      const longMessage = 'a'.repeat(201)

      await user.type(input, longMessage)
      await user.keyboard('{Enter}')

      expect(screen.getByText('Your message is too long. Try to be more brief!')).toBeInTheDocument()
      expect(onSend).not.toHaveBeenCalled()
    })
  })

  describe('Error Handling Integration', () => {
    it('should handle retry functionality correctly', async () => {
      const onRetry = vi.fn()

      // Add a deny message
      messageStore.add('agent', {
        pt: 'Acesso negado no momento.',
        en: 'Access denied right now.'
      })

      render(
        <ChatPanel
          state="DENY"
          messages={messageStore.messages}
          loading={false}
          onSend={vi.fn()}
          onRetry={onRetry}
          locale="en"
        />
      )

      expect(screen.getByText('Access denied right now.')).toBeInTheDocument()
      expect(screen.getByText('Try Again')).toBeInTheDocument()

      await user.click(screen.getByText('Try Again'))

      expect(onRetry).toHaveBeenCalledTimes(1)
    })
  })

  describe('Performance Integration', () => {
    it('should handle large message lists efficiently', () => {
      // Add many messages to store
      for (let i = 0; i < 100; i++) {
        messageStore.add(i % 2 === 0 ? 'agent' : 'user', {
          pt: `Mensagem ${i}`,
          en: `Message ${i}`
        })
      }

      const startTime = performance.now()

      render(
        <ChatPanel
          state="IDLE"
          messages={messageStore.messages}
          loading={false}
          onSend={vi.fn()}
          onRetry={vi.fn()}
          locale="en"
        />
      )

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Should render quickly even with many messages
      expect(renderTime).toBeLessThan(1000)
      expect(screen.getByLabelText('Chat messages')).toBeInTheDocument()
    })

    it('should handle rapid state changes efficiently', () => {
      const messages: ChatMessage[] = []
      const { rerender } = render(
        <ChatPanel
          state="IDLE"
          messages={messages}
          loading={false}
          onSend={vi.fn()}
          onRetry={vi.fn()}
          locale="en"
        />
      )

      // Rapid state changes
      const states = ['REQUESTING', 'ASK_MORE', 'ALLOW', 'DENY'] as const
      
      states.forEach(state => {
        rerender(
          <ChatPanel
            state={state}
            messages={messages}
            loading={state === 'REQUESTING'}
            onSend={vi.fn()}
            onRetry={vi.fn()}
            locale="en"
          />
        )
      })

      // Should handle rapid changes without errors
      expect(screen.getByText('Try Again')).toBeInTheDocument()
    })
  })
})