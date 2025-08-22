import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MessageList } from './MessageList'
import { ChatMessage } from '../types'

describe('MessageList', () => {
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

  it('renders messages correctly', () => {
    render(<MessageList messages={mockMessages} loading={false} locale="pt" />)
    
    expect(screen.getByText('Olá!')).toBeInTheDocument()
    expect(screen.getByText('Oi!')).toBeInTheDocument()
  })

  it('renders messages in English', () => {
    render(<MessageList messages={mockMessages} loading={false} locale="en" />)
    
    expect(screen.getByText('Hello!')).toBeInTheDocument()
    expect(screen.getByText('Hi!')).toBeInTheDocument()
  })

  it('shows typing indicator when loading', () => {
    render(<MessageList messages={mockMessages} loading={true} locale="pt" />)
    
    expect(screen.getByText('digitando...')).toBeInTheDocument()
  })

  it('does not show typing indicator when not loading', () => {
    render(<MessageList messages={mockMessages} loading={false} locale="pt" />)
    
    expect(screen.queryByText('digitando...')).not.toBeInTheDocument()
  })

  it('has proper accessibility attributes', () => {
    render(<MessageList messages={mockMessages} loading={false} locale="pt" />)
    
    const messageList = screen.getByLabelText('Chat messages')
    expect(messageList).toHaveAttribute('aria-live', 'polite')
    expect(messageList).toHaveAttribute('role', 'log')
  })

  it('renders empty list without errors', () => {
    render(<MessageList messages={[]} loading={false} locale="pt" />)
    
    const messageList = screen.getByLabelText('Chat messages')
    expect(messageList).toBeInTheDocument()
  })

  it('handles large number of messages', () => {
    const manyMessages: ChatMessage[] = Array.from({ length: 100 }, (_, i) => ({
      id: `msg-${i}`,
      from: i % 2 === 0 ? 'agent' : 'user',
      content: { pt: `Mensagem ${i}`, en: `Message ${i}` },
      timestamp: Date.now() + i
    }))

    render(<MessageList messages={manyMessages} loading={false} locale="pt" />)
    
    // Should render without errors
    const messageList = screen.getByLabelText('Chat messages')
    expect(messageList).toBeInTheDocument()
  })
})