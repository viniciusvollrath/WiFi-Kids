import React from 'react'
import { ChatPanelProps } from '../types'
import { MessageList } from './MessageList'
import { ChatInput } from './ChatInput'
import { TryAgainButton } from './TryAgainButton'
import styles from './ChatPanel.module.css'

export const ChatPanel: React.FC<ChatPanelProps> = ({
  state,
  messages,
  loading,
  onSend,
  onRetry,
  locale
}) => {
  const isInputDisabled = loading || state === 'REQUESTING'
  const showTryAgain = state === 'DENY'
  const showInput = state !== 'DENY'

  return (
    <div className={styles.chatPanel}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          {locale === 'pt' ? 'Chat' : 'Chat'}
        </h2>
      </div>
      
      <MessageList 
        messages={messages}
        loading={loading}
        locale={locale}
      />
      
      {showInput && (
        <ChatInput
          onSend={onSend}
          disabled={isInputDisabled}
          locale={locale}
        />
      )}
      
      {showTryAgain && (
        <TryAgainButton
          onRetry={onRetry}
          locale={locale}
        />
      )}
    </div>
  )
}