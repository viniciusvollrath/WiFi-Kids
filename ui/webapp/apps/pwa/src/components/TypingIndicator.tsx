import React from 'react'
import { TypingIndicatorProps } from '../types'
import { t } from '../i18n'
import styles from './TypingIndicator.module.css'

export const TypingIndicator: React.FC<TypingIndicatorProps & { locale: 'pt' | 'en' }> = ({ 
  visible, 
  locale 
}) => {
  const translations = t(locale)

  if (!visible) return null

  return (
    <div className={styles.typingIndicator} aria-live="polite">
      <div className={styles.avatar}>
        🤖
      </div>
      <div className={styles.content}>
        <div className={styles.typingText}>
          {translations.typing}
        </div>
        <div className={styles.dots}>
          <span className={styles.dot}></span>
          <span className={styles.dot}></span>
          <span className={styles.dot}></span>
        </div>
      </div>
    </div>
  )
}