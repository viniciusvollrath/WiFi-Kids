import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { AgentMessage } from './AgentMessage'
import { ChatMessage } from '../types'

describe('AgentMessage', () => {
  const mockMessage: ChatMessage = {
    id: 'test-1',
    from: 'agent',
    content: {
      pt: 'Olá! Como posso ajudar?',
      en: 'Hello! How can I help?'
    },
    timestamp: Date.now(),
    metadata: {
      persona: 'tutor',
      reason: 'greeting'
    }
  }

  it('renders agent message with Portuguese content', () => {
    render(<AgentMessage message={mockMessage} locale="pt" />)
    
    expect(screen.getByText('Olá! Como posso ajudar?')).toBeInTheDocument()
    expect(screen.getByText('🤖')).toBeInTheDocument()
  })

  it('renders agent message with English content', () => {
    render(<AgentMessage message={mockMessage} locale="en" />)
    
    expect(screen.getByText('Hello! How can I help?')).toBeInTheDocument()
    expect(screen.getByText('🤖')).toBeInTheDocument()
  })

  it('renders message content correctly', () => {
    render(<AgentMessage message={mockMessage} locale="pt" />)
    
    // Check that the component renders without errors
    expect(screen.getByText('Olá! Como posso ajudar?')).toBeInTheDocument()
    expect(screen.getByText('🤖')).toBeInTheDocument()
  })

  it('displays timestamp and metadata', () => {
    render(<AgentMessage message={mockMessage} locale="pt" />)
    
    expect(screen.getByText('tutor')).toBeInTheDocument()
    expect(screen.getByText('greeting')).toBeInTheDocument()
  })

  it('formats timestamp correctly', () => {
    const testTimestamp = new Date('2024-01-01T15:30:00').getTime()
    const messageWithTimestamp = {
      ...mockMessage,
      timestamp: testTimestamp
    }
    
    render(<AgentMessage message={messageWithTimestamp} locale="pt" />)
    
    // Should display time in HH:MM format
    expect(screen.getByText(/15:30/)).toBeInTheDocument()
  })
})