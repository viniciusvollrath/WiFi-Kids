import React from 'react'
import { Locale, LanguageToggleProps } from '../types'
import { t } from '../i18n'
import styles from './LanguageToggle.module.css'

/**
 * LanguageToggle Component
 * 
 * A segmented control for switching between Portuguese and English languages.
 * Features accessibility support, smooth animations, and flag icons.
 */
export const LanguageToggle: React.FC<LanguageToggleProps> = ({ locale, onChange, disabled = false }) => {
  const i = t(locale)

  const handleToggle = (newLocale: Locale) => {
    if (!disabled && newLocale !== locale) {
      onChange(newLocale)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent, targetLocale: Locale) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleToggle(targetLocale)
    }
  }

  return (
    <div 
      className={styles.languageToggle}
      role="group"
      aria-label={i.language_toggle_label}
    >
      <button
        type="button"
        className={`${styles.option} ${locale === 'pt' ? styles.optionActive : ''} ${disabled ? styles.optionDisabled : ''}`}
        onClick={() => handleToggle('pt')}
        onKeyDown={(e) => handleKeyDown(e, 'pt')}
        aria-pressed={locale === 'pt'}
        aria-label={i.portuguese_label}
        disabled={disabled}
      >
        <BrazilFlag className={styles.flag} />
        <span className={styles.label}>PT</span>
      </button>
      
      <button
        type="button"
        className={`${styles.option} ${locale === 'en' ? styles.optionActive : ''} ${disabled ? styles.optionDisabled : ''}`}
        onClick={() => handleToggle('en')}
        onKeyDown={(e) => handleKeyDown(e, 'en')}
        aria-pressed={locale === 'en'}
        aria-label={i.english_label}
        disabled={disabled}
      >
        <USFlag className={styles.flag} />
        <span className={styles.label}>EN</span>
      </button>
    </div>
  )
}

/**
 * Brazil Flag SVG Component
 * Inline SVG for cross-platform consistency
 */
const BrazilFlag: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    className={className}
    viewBox="0 0 16 12" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="Brazil flag"
  >
    <rect width="16" height="12" fill="#009639" rx="1"/>
    <path d="M8 2L13 6L8 10L3 6L8 2Z" fill="#FEDF00"/>
    <circle cx="8" cy="6" r="2" fill="#002776"/>
  </svg>
)

/**
 * US Flag SVG Component  
 * Inline SVG for cross-platform consistency
 */
const USFlag: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    className={className}
    viewBox="0 0 16 12" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="United States flag"
  >
    <rect width="16" height="12" fill="#B22234" rx="1"/>
    <rect width="16" height="1" y="1" fill="white"/>
    <rect width="16" height="1" y="3" fill="white"/>
    <rect width="16" height="1" y="5" fill="white"/>
    <rect width="16" height="1" y="7" fill="white"/>
    <rect width="16" height="1" y="9" fill="white"/>
    <rect width="16" height="1" y="11" fill="white"/>
    <rect width="6" height="6" fill="#3C3B6E"/>
  </svg>
)

export default LanguageToggle