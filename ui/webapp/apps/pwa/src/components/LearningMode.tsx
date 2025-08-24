import React from 'react'
import styles from './LearningMode.module.css'

export interface LearningModeProps {
  active: boolean
  locale: 'pt' | 'en'
}

export const LearningMode: React.FC<LearningModeProps> = ({
  active,
  locale
}) => {
  if (!active) return null

  const text = {
    pt: '🧠 Modo Aprendizado Contínuo',
    en: '🧠 Continuous Learning Mode'
  }

  const subtitle = {
    pt: 'Continue explorando novos tópicos!',
    en: 'Keep exploring new topics!'
  }

  return (
    <div className={styles.learningMode}>
      <div className={styles.indicator}>
        <span className={styles.text}>{text[locale]}</span>
        <span className={styles.subtitle}>{subtitle[locale]}</span>
      </div>
      <div className={styles.pulse}></div>
    </div>
  )
}