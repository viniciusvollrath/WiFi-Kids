import React from 'react'
import styles from './KeepLearningButton.module.css'

export interface KeepLearningButtonProps {
  onKeepLearning: () => void
  locale: 'pt' | 'en'
  disabled?: boolean
}

export const KeepLearningButton: React.FC<KeepLearningButtonProps> = ({
  onKeepLearning,
  locale,
  disabled = false
}) => {
  const buttonText = {
    pt: '🚀 Continuar Aprendendo',
    en: '🚀 Keep Learning'
  }

  const subtitle = {
    pt: 'Explorar mais tópicos interessantes',
    en: 'Explore more interesting topics'
  }

  return (
    <div className={styles.keepLearningContainer}>
      <button
        onClick={onKeepLearning}
        disabled={disabled}
        className={`${styles.keepLearningButton} ${disabled ? styles.disabled : ''}`}
      >
        <div className={styles.buttonContent}>
          <span className={styles.buttonText}>
            {buttonText[locale]}
          </span>
          <span className={styles.buttonSubtitle}>
            {subtitle[locale]}
          </span>
        </div>
      </button>
    </div>
  )
}