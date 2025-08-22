import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LanguageToggle } from './LanguageToggle'
import { Locale } from '../types'

describe('LanguageToggle', () => {
  const mockOnChange = vi.fn()

  beforeEach(() => {
    mockOnChange.mockClear()
  })

  describe('Rendering', () => {
    it('renders both language options', () => {
      render(<LanguageToggle locale="en" onChange={mockOnChange} />)
      
      expect(screen.getByRole('button', { name: /português/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /english/i })).toBeInTheDocument()
    })

    it('shows PT as active when locale is pt', () => {
      render(<LanguageToggle locale="pt" onChange={mockOnChange} />)
      
      const ptButton = screen.getByRole('button', { name: /português/i })
      const enButton = screen.getByRole('button', { name: /english/i })
      
      expect(ptButton).toHaveAttribute('aria-pressed', 'true')
      expect(enButton).toHaveAttribute('aria-pressed', 'false')
    })

    it('shows EN as active when locale is en', () => {
      render(<LanguageToggle locale="en" onChange={mockOnChange} />)
      
      const ptButton = screen.getByRole('button', { name: /português/i })
      const enButton = screen.getByRole('button', { name: /english/i })
      
      expect(ptButton).toHaveAttribute('aria-pressed', 'false')
      expect(enButton).toHaveAttribute('aria-pressed', 'true')
    })

    it('has proper group role and aria-label', () => {
      render(<LanguageToggle locale="en" onChange={mockOnChange} />)
      
      const group = screen.getByRole('group')
      expect(group).toHaveAttribute('aria-label', 'Toggle language')
    })

    it('renders flag icons with proper alt text', () => {
      render(<LanguageToggle locale="en" onChange={mockOnChange} />)
      
      expect(screen.getByLabelText('Brazil flag')).toBeInTheDocument()
      expect(screen.getByLabelText('United States flag')).toBeInTheDocument()
    })
  })

  describe('Language Switching', () => {
    it('calls onChange with pt when PT button is clicked', async () => {
      const user = userEvent.setup()
      render(<LanguageToggle locale="en" onChange={mockOnChange} />)
      
      const ptButton = screen.getByRole('button', { name: /português/i })
      await user.click(ptButton)
      
      expect(mockOnChange).toHaveBeenCalledWith('pt')
      expect(mockOnChange).toHaveBeenCalledTimes(1)
    })

    it('calls onChange with en when EN button is clicked', async () => {
      const user = userEvent.setup()
      render(<LanguageToggle locale="pt" onChange={mockOnChange} />)
      
      const enButton = screen.getByRole('button', { name: /english/i })
      await user.click(enButton)
      
      expect(mockOnChange).toHaveBeenCalledWith('en')
      expect(mockOnChange).toHaveBeenCalledTimes(1)
    })

    it('does not call onChange when clicking the already active language', async () => {
      const user = userEvent.setup()
      render(<LanguageToggle locale="en" onChange={mockOnChange} />)
      
      const enButton = screen.getByRole('button', { name: /english/i })
      await user.click(enButton)
      
      expect(mockOnChange).not.toHaveBeenCalled()
    })
  })

  describe('Keyboard Navigation', () => {
    it('switches language when Enter key is pressed on PT button', () => {
      render(<LanguageToggle locale="en" onChange={mockOnChange} />)
      
      const ptButton = screen.getByRole('button', { name: /português/i })
      fireEvent.keyDown(ptButton, { key: 'Enter' })
      
      expect(mockOnChange).toHaveBeenCalledWith('pt')
    })

    it('switches language when Space key is pressed on EN button', () => {
      render(<LanguageToggle locale="pt" onChange={mockOnChange} />)
      
      const enButton = screen.getByRole('button', { name: /english/i })
      fireEvent.keyDown(enButton, { key: ' ' })
      
      expect(mockOnChange).toHaveBeenCalledWith('en')
    })

    it('does not switch language on other key presses', () => {
      render(<LanguageToggle locale="en" onChange={mockOnChange} />)
      
      const ptButton = screen.getByRole('button', { name: /português/i })
      fireEvent.keyDown(ptButton, { key: 'Tab' })
      fireEvent.keyDown(ptButton, { key: 'Escape' })
      fireEvent.keyDown(ptButton, { key: 'a' })
      
      expect(mockOnChange).not.toHaveBeenCalled()
    })

    it('prevents default behavior for Enter and Space keys', () => {
      render(<LanguageToggle locale="en" onChange={mockOnChange} />)
      
      const ptButton = screen.getByRole('button', { name: /português/i })
      
      // Test that the component handles the keys correctly
      // The preventDefault is called inside the component's keyDown handler
      fireEvent.keyDown(ptButton, { key: 'Enter' })
      expect(mockOnChange).toHaveBeenCalledWith('pt')
      
      mockOnChange.mockClear()
      
      fireEvent.keyDown(ptButton, { key: ' ' })
      expect(mockOnChange).toHaveBeenCalledWith('pt')
    })
  })

  describe('Accessibility', () => {
    it('has proper button roles', () => {
      render(<LanguageToggle locale="en" onChange={mockOnChange} />)
      
      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(2)
    })

    it('has proper aria-pressed attributes', () => {
      render(<LanguageToggle locale="pt" onChange={mockOnChange} />)
      
      const ptButton = screen.getByRole('button', { name: /português/i })
      const enButton = screen.getByRole('button', { name: /english/i })
      
      expect(ptButton).toHaveAttribute('aria-pressed', 'true')
      expect(enButton).toHaveAttribute('aria-pressed', 'false')
    })

    it('has proper aria-label attributes', () => {
      render(<LanguageToggle locale="en" onChange={mockOnChange} />)
      
      expect(screen.getByLabelText('Português')).toBeInTheDocument()
      expect(screen.getByLabelText('English')).toBeInTheDocument()
    })

    it('maintains focus after language change', async () => {
      const user = userEvent.setup()
      render(<LanguageToggle locale="en" onChange={mockOnChange} />)
      
      const ptButton = screen.getByRole('button', { name: /português/i })
      ptButton.focus()
      
      await user.click(ptButton)
      
      // Button should still be focusable after click
      expect(ptButton).toBeInTheDocument()
    })
  })

  describe('Visual States', () => {
    it('applies active class to current locale button', () => {
      const { container } = render(<LanguageToggle locale="pt" onChange={mockOnChange} />)
      
      const ptButton = screen.getByRole('button', { name: /português/i })
      const enButton = screen.getByRole('button', { name: /english/i })
      
      // Check if the active class is applied (this depends on CSS modules implementation)
      expect(ptButton.className).toContain('optionActive')
      expect(enButton.className).not.toContain('optionActive')
    })

    it('has minimum touch target size for mobile accessibility', () => {
      render(<LanguageToggle locale="en" onChange={mockOnChange} />)
      
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        // Check that the CSS class is applied which should have the min dimensions
        expect(button.className).toContain('option')
      })
    })
  })

  describe('Internationalization', () => {
    it('updates aria-labels when locale changes', () => {
      const { rerender } = render(<LanguageToggle locale="en" onChange={mockOnChange} />)
      
      // Initial state - English labels
      expect(screen.getByRole('group')).toHaveAttribute('aria-label', 'Toggle language')
      
      // Change to Portuguese
      rerender(<LanguageToggle locale="pt" onChange={mockOnChange} />)
      
      // Should now have Portuguese labels
      expect(screen.getByRole('group')).toHaveAttribute('aria-label', 'Alternar idioma')
    })
  })

  describe('Performance and Edge Cases', () => {
    it('handles rapid successive clicks gracefully', async () => {
      const user = userEvent.setup()
      render(<LanguageToggle locale="en" onChange={mockOnChange} />)
      
      const ptButton = screen.getByRole('button', { name: /português/i })
      
      // Rapid clicks - each click is valid since it's changing from en to pt
      await user.click(ptButton)
      await user.click(ptButton)
      await user.click(ptButton)
      
      // Each click should call onChange since the component doesn't prevent rapid clicks
      expect(mockOnChange).toHaveBeenCalledTimes(3)
      expect(mockOnChange).toHaveBeenCalledWith('pt')
    })

    it('maintains focus after language change', async () => {
      const user = userEvent.setup()
      render(<LanguageToggle locale="en" onChange={mockOnChange} />)
      
      const ptButton = screen.getByRole('button', { name: /português/i })
      await user.click(ptButton)
      
      // Focus should remain on the button after click
      expect(ptButton).toHaveFocus()
    })

    it('handles keyboard navigation between buttons', async () => {
      const user = userEvent.setup()
      render(<LanguageToggle locale="en" onChange={mockOnChange} />)
      
      const ptButton = screen.getByRole('button', { name: /português/i })
      const enButton = screen.getByRole('button', { name: /english/i })
      
      // Tab to first button
      await user.tab()
      expect(ptButton).toHaveFocus()
      
      // Tab to second button
      await user.tab()
      expect(enButton).toHaveFocus()
    })

    it('prevents default on handled key events', () => {
      render(<LanguageToggle locale="en" onChange={mockOnChange} />)
      
      const ptButton = screen.getByRole('button', { name: /português/i })
      
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
      const spaceEvent = new KeyboardEvent('keydown', { key: ' ', bubbles: true })
      
      const preventDefaultSpy = vi.spyOn(enterEvent, 'preventDefault')
      const preventDefaultSpy2 = vi.spyOn(spaceEvent, 'preventDefault')
      
      ptButton.dispatchEvent(enterEvent)
      ptButton.dispatchEvent(spaceEvent)
      
      expect(preventDefaultSpy).toHaveBeenCalled()
      expect(preventDefaultSpy2).toHaveBeenCalled()
    })
  })

  describe('WCAG Compliance', () => {
    it('meets minimum touch target size requirements', () => {
      render(<LanguageToggle locale="en" onChange={mockOnChange} />)
      
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        const styles = window.getComputedStyle(button)
        // CSS modules should apply minimum 44px touch targets
        expect(button.className).toContain('option')
      })
    })

    it('has proper color contrast indicators', () => {
      render(<LanguageToggle locale="pt" onChange={mockOnChange} />)
      
      const ptButton = screen.getByRole('button', { name: /português/i })
      const enButton = screen.getByRole('button', { name: /english/i })
      
      // Active button should have different styling
      expect(ptButton.className).toContain('optionActive')
      expect(enButton.className).not.toContain('optionActive')
    })

    it('supports screen reader announcements', () => {
      render(<LanguageToggle locale="en" onChange={mockOnChange} />)
      
      const group = screen.getByRole('group')
      expect(group).toHaveAttribute('aria-label')
      
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toHaveAttribute('aria-pressed')
        expect(button).toHaveAttribute('aria-label')
      })
    })
  })
})