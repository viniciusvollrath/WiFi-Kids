import React from 'react'
import { AgentMessageProps } from '../types'
import { getPersonaAgent } from '../i18n'
import styles from './AgentMessage.module.css'

export const AgentMessage: React.FC<AgentMessageProps> = ({ message, locale }) => {
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString(locale === 'pt' ? 'pt-BR' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getPersonaStyles = () => {
    const persona = message.metadata?.persona || 'general'
    switch (persona) {
      case 'tutor':
        return styles.personaTutor
      case 'maternal':
        return styles.personaMaternal
      case 'general':
      default:
        return styles.personaGeneral
    }
  }

  const getMessageTypeStyles = () => {
    const reason = message.metadata?.reason
    if (reason === 'access_granted') return styles.success
    if (reason === 'access_denied') return styles.failure
    if (reason === 'partial_credit') return styles.partial
    return ''
  }

  const getPersonaEmoji = () => {
    const persona = message.metadata?.persona || 'general'
    switch (persona) {
      case 'tutor': return '👨‍🏫'
      case 'maternal': return '👩‍❤️‍👨'
      case 'general':
      default: return '🤖'
    }
  }

  return (
    <div 
      className={`${styles.agentMessage} ${getPersonaStyles()} ${getMessageTypeStyles()}`}
    >
      <div className={styles.avatar}>
        {getPersonaEmoji()}
      </div>
      <div className={styles.content}>
        <div className={styles.messageText}>
          {message.content[locale]}
        </div>
        <div className={styles.metadata}>
          <span className={styles.timestamp}>
            {formatTimestamp(message.timestamp)}
          </span>
          {message.metadata?.persona && (
            <span className={styles.persona}>
              {getPersonaAgent(message.metadata.persona, locale)}
            </span>
          )}
          {message.metadata?.reason && (
            <span className={styles.reason}>
              {message.metadata.reason}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}