import React, { Component, ErrorInfo, ReactNode } from 'react'
import { t } from '../i18n'
import styles from './ErrorBoundary.module.css'

interface Props {
  children: ReactNode
  locale: 'pt' | 'en'
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

/**
 * ErrorBoundary component to catch and handle React errors gracefully
 * Specifically designed for ChatPanel to prevent full app crashes
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo
    })

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      const translations = t(this.props.locale)
      
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className={styles.errorBoundary} role="alert">
          <div className={styles.errorIcon}>⚠️</div>
          <h3 className={styles.errorTitle}>
            {translations.error_boundary_title}
          </h3>
          <p className={styles.errorMessage}>
            {translations.error_boundary_message}
          </p>
          <div className={styles.errorActions}>
            <button 
              onClick={this.handleRetry}
              className={styles.retryButton}
              type="button"
            >
              {translations.try_again_button}
            </button>
            <button 
              onClick={() => window.location.reload()}
              className={styles.reloadButton}
              type="button"
            >
              {translations.reload_page}
            </button>
          </div>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className={styles.errorDetails}>
              <summary>Error Details (Development)</summary>
              <pre className={styles.errorStack}>
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Higher-order component to wrap components with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  locale: 'pt' | 'en',
  fallback?: ReactNode
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary locale={locale} fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}

/**
 * Hook to provide error boundary functionality in functional components
 */
export function useErrorHandler() {
  return (error: Error, errorInfo?: ErrorInfo) => {
    console.error('Error caught by error handler:', error, errorInfo)
    
    // In a real app, you might want to send this to an error reporting service
    // For now, we'll just log it
  }
}