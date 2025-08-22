import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { ChatPanel } from './ChatPanel'
import { ChatMessage } from '../types'

describe('ChatPanel', () => {
  const mockMessages: ChatMessage[] = [
    {
      id: '1',
      from: 'agent',
      content: { pt: 'Olá!', en: 'Hello!' },
      timestamp: Date.now() - 1000
    },
    {
      id: '2',
      from: 'user',
      content: { pt: 'Oi!', en: 'Hi!' },
      timestamp: Date.now()
    }
  ]

  const defaultProps = {
    state: 'IDLE' as const,
    messages: mockMessages,
    loading: false,
    onSend: vi.fn(),
    onRetry: vi.fn(),
    locale: 'pt' as const
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders chat panel with messages', () => {
    render(<ChatPanel {...defaultProps} />)
    
    expect(screen.getByText('Chat')).toBeInTheDocument()
    expect(screen.getByText('Olá!')).toBeInTheDocument()
  })

  it('shows chat input in IDLE state', () => {
    render(<ChatPanel {...defaultProps} state="IDLE" />)
    
    expect(screen.getByPlaceholderText('Digite sua mensagem...')).toBeInTheDocument()
    expect(screen.getByText('Enviar')).toBeInTheDocument()
  })

  it('disables input when loading', () => {
    render(<ChatPanel {...defaultProps} loading={true} />)
    
    const input = screen.getByPlaceholderText('Digite sua mensagem...')
    const sendButton = screen.getByText('Enviar')
    
    expect(input).toBeDisabled()
    expect(sendButton).toBeDisabled()
  })

  it('disables input in REQUESTING state', () => {
    render(<ChatPanel {...defaultProps} state="REQUESTING" />)
    
    const input = screen.getByPlaceholderText('Digite sua mensagem...')
    const sendButton = screen.getByText('Enviar')
    
    expect(input).toBeDisabled()
    expect(sendButton).toBeDisabled()
  })

  it('shows try again button in DENY state', () => {
    render(<ChatPanel {...defaultProps} state="DENY" />)
    
    expect(screen.getByText('Tentar Novamente')).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Digite sua mensagem...')).not.toBeInTheDocument()
  })

  it('shows typing indicator when loading', () => {
    render(<ChatPanel {...defaultProps} loading={true} />)
    
    expect(screen.getByText('digitando...')).toBeInTheDocument()
  })

  it('renders in English', () => {
    render(<ChatPanel {...defaultProps} locale="en" />)
    
    expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument()
    expect(screen.getByText('Send')).toBeInTheDocument()
  })

  it('handles ASK_MORE state correctly', () => {
    render(<ChatPanel {...defaultProps} state="ASK_MORE" />)
    
    // Should show input (not disabled) and no try again button
    expect(screen.getByPlaceholderText('Digite sua mensagem...')).toBeInTheDocument()
    expect(screen.queryByText('Tentar Novamente')).not.toBeInTheDocument()
  })

  it('handles ALLOW state correctly', () => {
    render(<ChatPanel {...defaultProps} state="ALLOW" />)
    
    // Should show input and no try again button
    expect(screen.getByPlaceholderText('Digite sua mensagem...')).toBeInTheDocument()
    expect(screen.queryByText('Tentar Novamente')).not.toBeInTheDocument()
  })

  describe('Message Rendering and Interactions', () => {
    it('renders all message types correctly', () => {
      const mixedMessages: ChatMessage[] = [
        {
          id: '1',
          from: 'agent',
          content: { pt: 'Olá! Como posso ajudar?', en: 'Hello! How can I help?' },
          timestamp: Date.now() - 3000,
          metadata: { persona: 'tutor', reason: 'greeting' }
        },
        {
          id: '2',
          from: 'user',
          content: { pt: 'Quero acessar a internet', en: 'I want to access the internet' },
          timestamp: Date.now() - 2000
        },
        {
          id: '3',
          from: 'agent',
          content: { pt: 'Você terminou a lição de casa?', en: 'Did you finish your homework?' },
          timestamp: Date.now() - 1000,
          metadata: { persona: 'tutor', reason: 'study_completion' }
        }
      ]

      render(<ChatPanel {...defaultProps} messages={mixedMessages} />)
      
      expect(screen.getByText('Olá! Como posso ajudar?')).toBeInTheDocument()
      expect(screen.getByText('Quero acessar a internet')).toBeInTheDocument()
      expect(screen.getByText('Você terminou a lição de casa?')).toBeInTheDocument()
    })

    it('handles message sending with Enter key', async () => {
      const user = userEvent.setup()
      render(<ChatPanel {...defaultProps} state="ASK_MORE" />)
      
      const input = screen.getByPlaceholderText('Digite sua mensagem...')
      
      await user.type(input, 'sim')
      await user.keyboard('{Enter}')
      
      expect(defaultProps.onSend).toHaveBeenCalledWith('sim')
    })

    it('handles message sending with button click', async () => {
      const user = userEvent.setup()
      render(<ChatPanel {...defaultProps} state="ASK_MORE" />)
      
      const input = screen.getByPlaceholderText('Digite sua mensagem...')
      const sendButton = screen.getByText('Enviar')
      
      await user.type(input, 'não')
      await user.click(sendButton)
      
      expect(defaultProps.onSend).toHaveBeenCalledWith('não')
    })

    it('clears input after sending message', async () => {
      const user = userEvent.setup()
      render(<ChatPanel {...defaultProps} state="ASK_MORE" />)
      
      const input = screen.getByPlaceholderText('Digite sua mensagem...') as HTMLInputElement
      
      await user.type(input, 'test message')
      await user.keyboard('{Enter}')
      
      await waitFor(() => {
        expect(input.value).toBe('')
      })
    })

    it('validates input length and shows error', async () => {
      const user = userEvent.setup()
      render(<ChatPanel {...defaultProps} state="ASK_MORE" />)
      
      const input = screen.getByPlaceholderText('Digite sua mensagem...')
      const longMessage = 'a'.repeat(201)
      
      await user.type(input, longMessage)
      await user.keyboard('{Enter}')
      
      expect(screen.getByText('Sua mensagem é muito longa. Tente ser mais breve!')).toBeInTheDocument()
      expect(defaultProps.onSend).not.toHaveBeenCalled()
    })

    it('validates empty input and shows error', async () => {
      const user = userEvent.setup()
      render(<ChatPanel {...defaultProps} state="ASK_MORE" />)
      
      const input = screen.getByPlaceholderText('Digite sua mensagem...')
      
      await user.type(input, '   ')
      await user.keyboard('{Enter}')
      
      expect(screen.getByText('Por favor, digite uma mensagem válida.')).toBeInTheDocument()
      expect(defaultProps.onSend).not.toHaveBeenCalled()
    })
  })

  describe('State-based UI Behavior', () => {
    it('shows correct UI elements for each state', () => {
      const states = ['IDLE', 'REQUESTING', 'ASK_MORE', 'ALLOW', 'DENY'] as const
      
      states.forEach(state => {
        const { unmount } = render(<ChatPanel {...defaultProps} state={state} loading={state === 'REQUESTING'} />)
        
        if (state === 'DENY') {
          expect(screen.getByText('Tentar Novamente')).toBeInTheDocument()
          expect(screen.queryByPlaceholderText('Digite sua mensagem...')).not.toBeInTheDocument()
        } else if (state === 'REQUESTING') {
          expect(screen.getByText('digitando...')).toBeInTheDocument()
          expect(screen.getByPlaceholderText('Digite sua mensagem...')).toBeDisabled()
        } else if (state === 'ASK_MORE') {
          expect(screen.getByPlaceholderText('Digite sua mensagem...')).toBeEnabled()
          expect(screen.queryByText('Tentar Novamente')).not.toBeInTheDocument()
        }
        
        unmount()
      })
    })

    it('handles retry button click', async () => {
      const user = userEvent.setup()
      render(<ChatPanel {...defaultProps} state="DENY" />)
      
      const retryButton = screen.getByText('Tentar Novamente')
      await user.click(retryButton)
      
      expect(defaultProps.onRetry).toHaveBeenCalledTimes(1)
    })
  })

  describe('Accessibility Features', () => {
    it('has proper ARIA attributes for chat messages', () => {
      render(<ChatPanel {...defaultProps} />)
      
      const messageList = screen.getByLabelText('Chat messages')
      expect(messageList).toHaveAttribute('aria-live', 'polite')
      expect(messageList).toHaveAttribute('role', 'log')
    })

    it('has proper form labels and structure', () => {
      render(<ChatPanel {...defaultProps} state="ASK_MORE" />)
      
      const input = screen.getByLabelText('Campo de mensagem do chat')
      const sendButton = screen.getByLabelText('Enviar mensagem')
      
      expect(input).toBeInTheDocument()
      expect(sendButton).toBeInTheDocument()
    })

    it('announces typing indicator to screen readers', () => {
      render(<ChatPanel {...defaultProps} loading={true} />)
      
      const typingIndicator = screen.getByText('digitando...')
      expect(typingIndicator.closest('[aria-live="polite"]')).toBeInTheDocument()
    })
  })

  describe('Language Switching', () => {
    it('updates all text when locale changes', () => {
      const { rerender } = render(<ChatPanel {...defaultProps} locale="pt" />)
      
      expect(screen.getByPlaceholderText('Digite sua mensagem...')).toBeInTheDocument()
      expect(screen.getByText('Enviar')).toBeInTheDocument()
      
      rerender(<ChatPanel {...defaultProps} locale="en" />)
      
      expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument()
      expect(screen.getByText('Send')).toBeInTheDocument()
    })

    it('updates message content when locale changes', () => {
      const { rerender } = render(<ChatPanel {...defaultProps} locale="pt" />)
      
      expect(screen.getByText('Olá!')).toBeInTheDocument()
      expect(screen.getByText('Oi!')).toBeInTheDocument()
      
      rerender(<ChatPanel {...defaultProps} locale="en" />)
      
      expect(screen.getByText('Hello!')).toBeInTheDocument()
      expect(screen.getByText('Hi!')).toBeInTheDocument()
    })
  })

  describe('Performance and Edge Cases', () => {
    it('handles large number of messages efficiently', () => {
      const manyMessages: ChatMessage[] = Array.from({ length: 100 }, (_, i) => ({
        id: `msg-${i}`,
        from: i % 2 === 0 ? 'agent' : 'user',
        content: { pt: `Mensagem ${i}`, en: `Message ${i}` },
        timestamp: Date.now() + i
      }))

      render(<ChatPanel {...defaultProps} messages={manyMessages} />)
      
      // Should render without performance issues
      expect(screen.getByLabelText('Chat messages')).toBeInTheDocument()
    })

    it('handles empty message list gracefully', () => {
      render(<ChatPanel {...defaultProps} messages={[]} />)
      
      expect(screen.getByLabelText('Chat messages')).toBeInTheDocument()
      expect(screen.queryByText('Olá!')).not.toBeInTheDocument()
    })

    it('handles rapid state changes', () => {
      const { rerender } = render(<ChatPanel {...defaultProps} state="IDLE" />)
      
      rerender(<ChatPanel {...defaultProps} state="REQUESTING" />)
      rerender(<ChatPanel {...defaultProps} state="ASK_MORE" />)
      rerender(<ChatPanel {...defaultProps} state="ALLOW" />)
      rerender(<ChatPanel {...defaultProps} state="DENY" />)
      
      // Should handle rapid state changes without errors
      expect(screen.getByText('Tentar Novamente')).toBeInTheDocument()
    })
  })
})