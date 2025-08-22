import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

describe('App Integration with LanguageToggle', () => {
  it('renders the app with LanguageToggle component', () => {
    render(<App />)
    
    // Check that the app title is rendered
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    
    // Check that the LanguageToggle is rendered
    expect(screen.getByRole('group', { name: /toggle language|alternar idioma/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /português/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /english/i })).toBeInTheDocument()
  })

  it('switches language and updates app content', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    // Initially should be in English (based on inferLocale mock)
    expect(screen.getByText('Wi‑Fi Kids')).toBeInTheDocument()
    expect(screen.getByText('Request a safe internet session.')).toBeInTheDocument()
    expect(screen.getByText('Access Internet')).toBeInTheDocument()
    
    // Switch to Portuguese
    const ptButton = screen.getByRole('button', { name: /português/i })
    await user.click(ptButton)
    
    // Content should now be in Portuguese
    expect(screen.getByText('Peça uma sessão segura para acessar a internet.')).toBeInTheDocument()
    expect(screen.getByText('Acessar Internet')).toBeInTheDocument()
  })

  it('maintains LanguageToggle state when switching languages', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    const ptButton = screen.getByRole('button', { name: /português/i })
    const enButton = screen.getByRole('button', { name: /english/i })
    
    // Initially EN should be active
    expect(enButton).toHaveAttribute('aria-pressed', 'true')
    expect(ptButton).toHaveAttribute('aria-pressed', 'false')
    
    // Switch to PT
    await user.click(ptButton)
    
    // Now PT should be active
    expect(ptButton).toHaveAttribute('aria-pressed', 'true')
    expect(enButton).toHaveAttribute('aria-pressed', 'false')
    
    // Switch back to EN
    await user.click(enButton)
    
    // EN should be active again
    expect(enButton).toHaveAttribute('aria-pressed', 'true')
    expect(ptButton).toHaveAttribute('aria-pressed', 'false')
  })
})