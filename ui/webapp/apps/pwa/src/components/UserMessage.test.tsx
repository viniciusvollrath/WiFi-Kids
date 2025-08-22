import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { UserMessage } from './UserMessage'
import { ChatMessage } from '../types'

describe('UserMessage', () => {
  const mockMessage: ChatMessage = {
    id: 'test-1',
    from: 'user',
    content: {
      pt: 'Quero acessar a internet',
      en: 'I want to access the internet'
    },
    timestamp: Date.now()
  }

  it('renders user message with Portuguese content', () => {
    render(<UserMessage message={mockMessage} locale="pt" />)
    
    expect(screen.getByText('Quero acessar a internet')).toBeInTheDocument()
    expect(screen.getByText('🙂')).toBeInTheDocument()
  })

  it('renders user message with English content', () => {
    render(<UserMessage message={mockMessage} locale="en" />)
    
    expect(screen.getByText('I want to access the internet')).toBeInTheDocument()
    expect(screen.getByText('🙂')).toBeInTheDocument()
  })

  it('displays timestamp', () => {
    const testTimestamp = new Date('2024-01-01T15:30:00').getTime()
    const messageWithTimestamp = {
      ...mockMessage,
      timestamp: testTimestamp
    }
    
    render(<UserMessage message={messageWithTimestamp} locale="pt" />)
    
    // Should display time in HH:MM format
    expect(screen.getByText(/15:30/)).toBeInTheDocument()
  })

  it('renders message content correctly', () => {
    const { container } = render(<UserMessage message={mockMessage} locale="pt" />)
    
    // Check that the component renders without errors
    expect(container.firstChild).not.toBeNull()
    expect(screen.getByText('Quero acessar a internet')).toBeInTheDocument()
  })
})