import React, { useState, useRef, useEffect } from 'react'
import { ChatInputProps } from '../types'
import { t } from '../i18n'
import { processUserInput } from '../utils/inputValidation'
import styles from './ChatInput.module.css'

export const ChatInput: React.FC<ChatInputProps & { locale: 'pt' | 'en' }> = ({ 
  onSend, 
  disabled, 
  placeholder,
  locale 
}) => {
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const translations = t(locale)

  // Focus input after sending message
  useEffect(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus()
    }
  }, [disabled])

  const validateInput = (input: string): { isValid: boolean; sanitized: string; error?: string } => {
    return processUserInput(input, locale)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (disabled) return
    
    const validation = validateInput(message)
    if (!validation.isValid) {
      setError(validation.error || translations.invalid_input)
      return
    }
    
    setError('')
    // Use the sanitized input instead of raw message
    onSend(validation.sanitized)
    setMessage('')
    
    // Return focus to input after sending
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus()
      }
    }, 0)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setMessage(value)
    
    // Clear error when user starts typing
    if (error) {
      setError('')
    }
  }

  return (
    <div className={styles.chatInputContainer}>
      {error && (
        <div className={styles.errorMessage} role="alert">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className={styles.inputForm}>
        <input
          ref={inputRef}
          type="text"
          value={message}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || translations.chat_placeholder}
          disabled={disabled}
          className={styles.chatInput}
          aria-label={translations.chat_input_label}
          maxLength={250} // Slightly higher than validation limit for better UX
        />
        <button
          type="submit"
          disabled={disabled || message.trim().length === 0}
          className={styles.sendButton}
          aria-label={translations.send_message_button}
        >
          {translations.send}
        </button>
      </form>
    </div>
  )
}