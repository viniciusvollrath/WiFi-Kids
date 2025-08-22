import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ErrorBoundary, withErrorBoundary, useErrorHandler } from './ErrorBoundary'

// Mock console.error to avoid noise in tests
const originalConsoleError = console.error
beforeEach(() => {
  console.error = vi.fn()
})

afterEach(() => {
  console.error = originalConsoleError
})

// Test component that throws an error
const ThrowError: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow = true }) => {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>No error</div>
}

// Test component for HOC
const TestComponent: React.FC<{ message: string }> = ({ message }) => {
  return <div>{message}</div>
}

describe('ErrorBoundary', () => {
  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary locale="en">
        <div>Test content</div>
      </ErrorBoundary>
    )

    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('should render error UI when child component throws', () => {
    render(
      <ErrorBoundary locale="en">
        <ThrowError />
      </ErrorBoundary>
    )

    expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument()
    expect(screen.getByText("Don't worry, you can try again or reload the page.")).toBeInTheDocument()
    expect(screen.getByText('Try Again')).toBeInTheDocument()
    expect(screen.getByText('Reload Page')).toBeInTheDocument()
  })

  it('should render Portuguese error messages', () => {
    render(
      <ErrorBoundary locale="pt">
        <ThrowError />
      </ErrorBoundary>
    )

    expect(screen.getByText('Ops! Algo deu errado')).toBeInTheDocument()
    expect(screen.getByText('Não se preocupe, você pode tentar novamente ou recarregar a página.')).toBeInTheDocument()
    expect(screen.getByText('Tentar Novamente')).toBeInTheDocument()
    expect(screen.getByText('Recarregar Página')).toBeInTheDocument()
  })

  it('should render custom fallback when provided', () => {
    const customFallback = <div>Custom error message</div>

    render(
      <ErrorBoundary locale="en" fallback={customFallback}>
        <ThrowError />
      </ErrorBoundary>
    )

    expect(screen.getByText('Custom error message')).toBeInTheDocument()
    expect(screen.queryByText('Oops! Something went wrong')).not.toBeInTheDocument()
  })

  it('should call onError callback when error occurs', () => {
    const onError = vi.fn()

    render(
      <ErrorBoundary locale="en" onError={onError}>
        <ThrowError />
      </ErrorBoundary>
    )

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String)
      })
    )
  })

  it('should retry and render children again when retry button is clicked', () => {
    const TestComponentWithState: React.FC = () => {
      const [shouldThrow, setShouldThrow] = React.useState(true)
      
      return (
        <div>
          <button onClick={() => setShouldThrow(false)}>Fix Error</button>
          <ErrorBoundary locale="en">
            <ThrowError shouldThrow={shouldThrow} />
          </ErrorBoundary>
        </div>
      )
    }

    render(<TestComponentWithState />)

    // Initially shows error
    expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument()

    // Fix the error first
    fireEvent.click(screen.getByText('Fix Error'))

    // Then click retry
    fireEvent.click(screen.getByText('Try Again'))

    // Should show the component content now
    expect(screen.getByText('No error')).toBeInTheDocument()
    expect(screen.queryByText('Oops! Something went wrong')).not.toBeInTheDocument()
  })

  it('should reload page when reload button is clicked', () => {
    // Mock window.location.reload
    const mockReload = vi.fn()
    Object.defineProperty(window, 'location', {
      value: { reload: mockReload },
      writable: true
    })

    render(
      <ErrorBoundary locale="en">
        <ThrowError />
      </ErrorBoundary>
    )

    fireEvent.click(screen.getByText('Reload Page'))

    expect(mockReload).toHaveBeenCalled()
  })

  it('should show error details in development mode', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'

    render(
      <ErrorBoundary locale="en">
        <ThrowError />
      </ErrorBoundary>
    )

    expect(screen.getByText('Error Details (Development)')).toBeInTheDocument()

    process.env.NODE_ENV = originalEnv
  })

  it('should not show error details in production mode', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'

    render(
      <ErrorBoundary locale="en">
        <ThrowError />
      </ErrorBoundary>
    )

    expect(screen.queryByText('Error Details (Development)')).not.toBeInTheDocument()

    process.env.NODE_ENV = originalEnv
  })
})

describe('withErrorBoundary', () => {
  it('should wrap component with error boundary', () => {
    const WrappedComponent = withErrorBoundary(TestComponent, 'en')

    render(<WrappedComponent message="Test message" />)

    expect(screen.getByText('Test message')).toBeInTheDocument()
  })

  it('should catch errors in wrapped component', () => {
    const WrappedComponent = withErrorBoundary(ThrowError, 'en')

    render(<WrappedComponent />)

    expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument()
  })

  it('should use custom fallback in HOC', () => {
    const customFallback = <div>HOC Custom Error</div>
    const WrappedComponent = withErrorBoundary(ThrowError, 'en', customFallback)

    render(<WrappedComponent />)

    expect(screen.getByText('HOC Custom Error')).toBeInTheDocument()
  })
})

describe('useErrorHandler', () => {
  it('should return error handler function', () => {
    const TestHook: React.FC = () => {
      const handleError = useErrorHandler()
      
      React.useEffect(() => {
        handleError(new Error('Test error'))
      }, [handleError])
      
      return <div>Hook test</div>
    }

    render(<TestHook />)

    expect(screen.getByText('Hook test')).toBeInTheDocument()
    expect(console.error).toHaveBeenCalledWith(
      'Error caught by error handler:',
      expect.any(Error),
      undefined
    )
  })

  it('should handle error with error info', () => {
    const TestHook: React.FC = () => {
      const handleError = useErrorHandler()
      
      React.useEffect(() => {
        handleError(new Error('Test error'), { componentStack: 'test stack' })
      }, [handleError])
      
      return <div>Hook test with info</div>
    }

    render(<TestHook />)

    expect(console.error).toHaveBeenCalledWith(
      'Error caught by error handler:',
      expect.any(Error),
      { componentStack: 'test stack' }
    )
  })
})