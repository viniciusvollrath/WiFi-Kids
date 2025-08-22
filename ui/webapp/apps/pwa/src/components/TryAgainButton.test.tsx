import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { TryAgainButton } from './TryAgainButton'

describe('TryAgainButton', () => {
  const mockOnRetry = vi.fn()

  beforeEach(() => {
    mockOnRetry.mockClear()
  })

  it('renders try again button in Portuguese', () => {
    render(<TryAgainButton onRetry={mockOnRetry} locale="pt" />)
    
    expect(screen.getByText('Tentar Novamente')).toBeInTheDocument()
  })

  it('renders try again button in English', () => {
    render(<TryAgainButton onRetry={mockOnRetry} locale="en" />)
    
    expect(screen.getByText('Try Again')).toBeInTheDocument()
  })

  it('calls onRetry when clicked', () => {
    render(<TryAgainButton onRetry={mockOnRetry} locale="pt" />)
    
    const button = screen.getByText('Tentar Novamente')
    fireEvent.click(button)
    
    expect(mockOnRetry).toHaveBeenCalledTimes(1)
  })

  it('is a button element', () => {
    render(<TryAgainButton onRetry={mockOnRetry} locale="pt" />)
    
    const button = screen.getByText('Tentar Novamente')
    expect(button.tagName).toBe('BUTTON')
    expect(button).toHaveAttribute('type', 'button')
  })
})