import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ChatInput } from './ChatInput'

describe('ChatInput', () => {
  const mockOnSend = vi.fn()

  beforeEach(() => {
    mockOnSend.mockClear()
  })

  it('renders chat input with placeholder', () => {
    render(<ChatInput onSend={mockOnSend} disabled={false} locale="pt" />)
    
    expect(screen.getByPlaceholderText('Digite sua mensagem...')).toBeInTheDocument()
    expect(screen.getByText('Enviar')).toBeInTheDocument()
  })

  it('renders in English', () => {
    render(<ChatInput onSend={mockOnSend} disabled={false} locale="en" />)
    
    expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument()
    expect(screen.getByText('Send')).toBeInTheDocument()
  })

  it('sends message on form submit', async () => {
    render(<ChatInput onSend={mockOnSend} disabled={false} locale="pt" />)
    
    const input = screen.getByPlaceholderText('Digite sua mensagem...')
    const sendButton = screen.getByText('Enviar')
    
    fireEvent.change(input, { target: { value: 'Test message' } })
    fireEvent.click(sendButton)
    
    expect(mockOnSend).toHaveBeenCalledWith('Test message')
  })

  it('sends message on Enter key press', async () => {
    render(<ChatInput onSend={mockOnSend} disabled={false} locale="pt" />)
    
    const input = screen.getByPlaceholderText('Digite sua mensagem...')
    
    fireEvent.change(input, { target: { value: 'Test message' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    
    expect(mockOnSend).toHaveBeenCalledWith('Test message')
  })

  it('trims whitespace from messages', async () => {
    render(<ChatInput onSend={mockOnSend} disabled={false} locale="pt" />)
    
    const input = screen.getByPlaceholderText('Digite sua mensagem...')
    
    fireEvent.change(input, { target: { value: '  Test message  ' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    
    expect(mockOnSend).toHaveBeenCalledWith('Test message')
  })

  it('validates message length', async () => {
    render(<ChatInput onSend={mockOnSend} disabled={false} locale="pt" />)
    
    const input = screen.getByPlaceholderText('Digite sua mensagem...')
    const longMessage = 'a'.repeat(201)
    
    fireEvent.change(input, { target: { value: longMessage } })
    fireEvent.keyDown(input, { key: 'Enter' })
    
    expect(screen.getByText('Sua mensagem é muito longa. Tente ser mais breve!')).toBeInTheDocument()
    expect(mockOnSend).not.toHaveBeenCalled()
  })

  it('validates empty messages', async () => {
    render(<ChatInput onSend={mockOnSend} disabled={false} locale="pt" />)
    
    const input = screen.getByPlaceholderText('Digite sua mensagem...')
    
    fireEvent.change(input, { target: { value: '   ' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    
    expect(screen.getByText('Por favor, digite uma mensagem válida.')).toBeInTheDocument()
    expect(mockOnSend).not.toHaveBeenCalled()
  })

  it('disables input when disabled prop is true', () => {
    render(<ChatInput onSend={mockOnSend} disabled={true} locale="pt" />)
    
    const input = screen.getByPlaceholderText('Digite sua mensagem...')
    const sendButton = screen.getByText('Enviar')
    
    expect(input).toBeDisabled()
    expect(sendButton).toBeDisabled()
  })

  it('clears input after sending message', async () => {
    render(<ChatInput onSend={mockOnSend} disabled={false} locale="pt" />)
    
    const input = screen.getByPlaceholderText('Digite sua mensagem...') as HTMLInputElement
    
    fireEvent.change(input, { target: { value: 'Test message' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    
    await waitFor(() => {
      expect(input.value).toBe('')
    })
  })

  it('has proper accessibility attributes', () => {
    render(<ChatInput onSend={mockOnSend} disabled={false} locale="pt" />)
    
    const input = screen.getByLabelText('Campo de mensagem do chat')
    const sendButton = screen.getByLabelText('Enviar mensagem')
    
    expect(input).toBeInTheDocument()
    expect(sendButton).toBeInTheDocument()
  })
})