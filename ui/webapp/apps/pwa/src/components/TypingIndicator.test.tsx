import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { TypingIndicator } from './TypingIndicator'

describe('TypingIndicator', () => {
  it('renders when visible is true', () => {
    render(<TypingIndicator visible={true} locale="pt" />)
    
    expect(screen.getByText('digitando...')).toBeInTheDocument()
    expect(screen.getByText('🤖')).toBeInTheDocument()
  })

  it('renders in English', () => {
    render(<TypingIndicator visible={true} locale="en" />)
    
    expect(screen.getByText('typing...')).toBeInTheDocument()
  })

  it('does not render when visible is false', () => {
    render(<TypingIndicator visible={false} locale="pt" />)
    
    expect(screen.queryByText('digitando...')).not.toBeInTheDocument()
  })

  it('has proper accessibility attributes', () => {
    const { container } = render(<TypingIndicator visible={true} locale="pt" />)
    
    const indicator = container.querySelector('[aria-live="polite"]')
    expect(indicator).toBeInTheDocument()
  })

  it('renders animated dots', () => {
    render(<TypingIndicator visible={true} locale="pt" />)
    
    // Check that the component renders without errors
    expect(screen.getByText('digitando...')).toBeInTheDocument()
    expect(screen.getByText('🤖')).toBeInTheDocument()
  })
})