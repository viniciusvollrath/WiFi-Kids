import React from 'react'
import { AgentMessageProps } from '../types'
import styles from './AgentMessage.module.css'

export const AgentMessage: React.FC<AgentMessageProps> = ({ message, locale }) => {
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString(locale === 'pt' ? 'pt-BR' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div 
      className={styles.agentMessage}
    >
      <div className={styles.avatar}>
        🤖
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
              {message.metadata.persona}
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