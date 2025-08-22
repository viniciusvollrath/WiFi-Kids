/**
 * Tests for SimulationBadge component
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SimulationBadge } from './SimulationBadge'

describe('SimulationBadge', () => {
  it('should not render when visible is false', () => {
    const { container } = render(
      <SimulationBadge visible={false} locale="en" />
    )
    
    expect(container.firstChild).toBeNull()
  })

  it('should render when visible is true', () => {
    render(<SimulationBadge visible={true} locale="en" />)
    
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText('Simulation')).toBeInTheDocument()
  })

  it('should display Portuguese text when locale is pt', () => {
    render(<SimulationBadge visible={true} locale="pt" />)
    
    expect(screen.getByText('Simulação')).toBeInTheDocument()
  })

  it('should display English text when locale is en', () => {
    render(<SimulationBadge visible={true} locale="en" />)
    
    expect(screen.getByText('Simulation')).toBeInTheDocument()
  })

  it('should have proper accessibility attributes', () => {
    render(<SimulationBadge visible={true} locale="en" />)
    
    const badge = screen.getByRole('status')
    expect(badge).toHaveAttribute('aria-label', 'Simulation')
  })

  it('should have proper accessibility attributes in Portuguese', () => {
    render(<SimulationBadge visible={true} locale="pt" />)
    
    const badge = screen.getByRole('status')
    expect(badge).toHaveAttribute('aria-label', 'Simulação')
  })

  it('should display the wrench icon', () => {
    render(<SimulationBadge visible={true} locale="en" />)
    
    expect(screen.getByText('🔧')).toBeInTheDocument()
  })

  it('should have CSS module classes applied', () => {
    render(<SimulationBadge visible={true} locale="en" />)
    
    const badge = screen.getByRole('status')
    // CSS modules generate hashed class names, so we check for the presence of a class
    expect(badge.className).toMatch(/badge/)
    
    const icon = screen.getByText('🔧')
    expect(icon.className).toMatch(/icon/)
    
    const text = screen.getByText('Simulation')
    expect(text.className).toMatch(/text/)
  })

  it('should render with proper structure', () => {
    render(<SimulationBadge visible={true} locale="en" />)
    
    const badge = screen.getByRole('status')
    expect(badge).toBeInTheDocument()
    
    // Verify the badge contains both icon and text
    expect(badge).toContainElement(screen.getByText('🔧'))
    expect(badge).toContainElement(screen.getByText('Simulation'))
  })
})