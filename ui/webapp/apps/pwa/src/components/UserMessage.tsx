import React from 'react'
import { UserMessageProps } from '../types'
import styles from './UserMessage.module.css'

export const UserMessage: React.FC<UserMessageProps> = ({ message, locale }) => {
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString(locale === 'pt' ? 'pt-BR' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className={styles.userMessage}>
      <div className={styles.content}>
        <div className={styles.messageText}>
          {message.content[locale]}
        </div>
        <div className={styles.metadata}>
          <span className={styles.timestamp}>
            {formatTimestamp(message.timestamp)}
          </span>
        </div>
      </div>
      <div className={styles.avatar}>
        🙂
      </div>
    </div>
  )
}