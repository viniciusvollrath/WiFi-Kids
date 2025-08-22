import React from 'react'
import { t } from '../i18n'
import styles from './TryAgainButton.module.css'

interface TryAgainButtonProps {
  onRetry: () => void
  locale: 'pt' | 'en'
}

export const TryAgainButton: React.FC<TryAgainButtonProps> = ({ onRetry, locale }) => {
  const translations = t(locale)

  return (
    <div className={styles.tryAgainContainer}>
      <button
        onClick={onRetry}
        className={styles.tryAgainButton}
        type="button"
      >
        {translations.try_again_button}
      </button>
    </div>
  )
}