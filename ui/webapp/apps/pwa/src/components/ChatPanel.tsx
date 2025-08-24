import React from 'react'
import { ChatPanelProps, Question } from '../types'
import { MessageList } from './MessageList'
import { AnswerInput } from './AnswerInput'
import { TryAgainButton } from './TryAgainButton'
import { KeepLearningButton } from './KeepLearningButton'
import { LearningMode } from './LearningMode'
import styles from './ChatPanel.module.css'

export const ChatPanel: React.FC<ChatPanelProps> = ({
  state,
  messages,
  loading,
  onSend,
  onRetry,
  onKeepLearning,
  locale,
  questions,
  onAnswersSubmit
}) => {
  const isInputDisabled = loading || state === 'REQUESTING'
  const showTryAgain = state === 'DENY'
  const showKeepLearning = state === 'ALLOW'
  const showLearningMode = state === 'CONTINUE'
  const showInput = state !== 'DENY' && state !== 'ALLOW'
  
  // Determine if we should show questions vs regular chat
  const hasQuestions = questions && questions.length > 0 && state === 'ASK_MORE'
  const inputMode = hasQuestions ? 'questions' : 'chat'

  return (
    <div className={styles.chatPanel}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          {locale === 'pt' ? 'Chat' : 'Chat'}
        </h2>
      </div>
      
      <LearningMode 
        active={showLearningMode}
        locale={locale}
      />
      
      <MessageList 
        messages={messages}
        loading={loading}
        locale={locale}
      />
      
      {showInput && (
        <AnswerInput
          mode={inputMode}
          questions={hasQuestions ? questions : undefined}
          onSend={onSend}
          onAnswersSubmit={onAnswersSubmit || (() => {})}
          disabled={isInputDisabled}
          locale={locale}
          loading={loading}
        />
      )}
      
      {showTryAgain && (
        <TryAgainButton
          onRetry={onRetry}
          locale={locale}
        />
      )}
      
      {showKeepLearning && onKeepLearning && (
        <KeepLearningButton
          onKeepLearning={onKeepLearning}
          locale={locale}
        />
      )}
    </div>
  )
}