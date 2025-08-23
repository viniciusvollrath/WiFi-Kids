import React from 'react'
import { config } from '../services/config'
import { getPersonaAgent } from '../i18n'
import styles from './PersonaSelector.module.css'

export interface PersonaSelectorProps {
  currentPersona: 'tutor' | 'maternal' | 'general'
  onPersonaChange: (persona: 'tutor' | 'maternal' | 'general') => void
  locale: 'pt' | 'en'
  disabled?: boolean
}

export const PersonaSelector: React.FC<PersonaSelectorProps> = ({
  currentPersona,
  onPersonaChange,
  locale,
  disabled = false
}) => {
  const availablePersonas = config.getAvailablePersonas()

  const getPersonaDescription = (persona: 'tutor' | 'maternal' | 'general'): string => {
    const descriptions = {
      tutor: {
        pt: 'Estilo acadêmico e formal',
        en: 'Academic and formal style'
      },
      maternal: {
        pt: 'Estilo carinhoso e encorajador',
        en: 'Caring and encouraging style'
      },
      general: {
        pt: 'Estilo neutro e direto',
        en: 'Neutral and direct style'
      }
    }
    return descriptions[persona][locale]
  }

  const getPersonaEmoji = (persona: 'tutor' | 'maternal' | 'general'): string => {
    switch (persona) {
      case 'tutor': return '👨‍🏫'
      case 'maternal': return '👩‍❤️‍👨'
      case 'general': return '🤖'
    }
  }

  if (!config.shouldShowPersonaSelector() || availablePersonas.length <= 1) {
    return null
  }

  return (
    <div className={styles.personaSelector}>
      <h3 className={styles.title}>
        {locale === 'pt' ? 'Escolha o Assistente' : 'Choose Assistant'}
      </h3>
      <div className={styles.options}>
        {availablePersonas.map(persona => (
          <button
            key={persona}
            className={`${styles.option} ${currentPersona === persona ? styles.active : ''}`}
            onClick={() => onPersonaChange(persona)}
            disabled={disabled}
            aria-pressed={currentPersona === persona}
          >
            <div className={styles.emoji}>
              {getPersonaEmoji(persona)}
            </div>
            <div className={styles.info}>
              <div className={styles.name}>
                {getPersonaAgent(persona, locale)}
              </div>
              <div className={styles.description}>
                {getPersonaDescription(persona)}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}