import React from 'react'
import { Challenge, ChallengeProgress as ChallengeProgressType } from '../types'
import styles from './ChallengeProgress.module.css'

export interface ChallengeProgressProps {
  challenge: Challenge | null
  progress: ChallengeProgressType | null
  locale: 'pt' | 'en'
}

export const ChallengeProgress: React.FC<ChallengeProgressProps> = ({
  challenge,
  progress,
  locale
}) => {
  if (!challenge || !progress) {
    return null
  }

  const progressPercentage = Math.round((progress.completedQuestions / progress.totalQuestions) * 100)
  const timeSpentMinutes = Math.floor(progress.timeSpent / (1000 * 60))
  const timeSpentSeconds = Math.floor((progress.timeSpent % (1000 * 60)) / 1000)

  const getStatusText = () => {
    switch (challenge.status) {
      case 'active':
        return locale === 'pt' ? 'Em andamento' : 'In progress'
      case 'answering':
        return locale === 'pt' ? 'Respondendo...' : 'Answering...'
      case 'validating':
        return locale === 'pt' ? 'Validando respostas' : 'Validating answers'
      case 'completed':
        return locale === 'pt' ? 'Concluído' : 'Completed'
      case 'failed':
        return locale === 'pt' ? 'Falhou' : 'Failed'
      default:
        return ''
    }
  }

  const getStatusClass = () => {
    switch (challenge.status) {
      case 'active':
      case 'answering':
        return styles.statusActive
      case 'validating':
        return styles.statusValidating
      case 'completed':
        return styles.statusCompleted
      case 'failed':
        return styles.statusFailed
      default:
        return ''
    }
  }

  const getDifficultyEmoji = () => {
    switch (challenge.metadata?.difficulty) {
      case 'easy': return '🟢'
      case 'medium': return '🟡'
      case 'hard': return '🔴'
      default: return '⚪'
    }
  }

  return (
    <div className={styles.progressContainer}>
      {/* Challenge Header */}
      <div className={styles.header}>
        <div className={styles.challengeInfo}>
          <span className={styles.difficulty}>
            {getDifficultyEmoji()} {challenge.metadata?.difficulty || 'medium'}
          </span>
          <span className={styles.subject}>
            {challenge.metadata?.subject || 'General'}
          </span>
        </div>
        <div className={`${styles.status} ${getStatusClass()}`}>
          {getStatusText()}
        </div>
      </div>

      {/* Progress Bar */}
      <div className={styles.progressSection}>
        <div className={styles.progressInfo}>
          <span className={styles.progressText}>
            {locale === 'pt' ? 'Progresso' : 'Progress'}: {progress.completedQuestions}/{progress.totalQuestions}
          </span>
          <span className={styles.progressPercentage}>
            {progressPercentage}%
          </span>
        </div>
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill}
            style={{ width: `${progressPercentage}%` }}
            role="progressbar"
            aria-valuenow={progressPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${progressPercentage}% ${locale === 'pt' ? 'concluído' : 'complete'}`}
          />
        </div>
      </div>

      {/* Stats */}
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>
            {locale === 'pt' ? 'Tempo' : 'Time'}:
          </span>
          <span className={styles.statValue}>
            {timeSpentMinutes}:{timeSpentSeconds.toString().padStart(2, '0')}
          </span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>
            {locale === 'pt' ? 'Tentativa' : 'Attempt'}:
          </span>
          <span className={styles.statValue}>
            {challenge.currentAttempt}/{challenge.maxAttempts}
          </span>
        </div>
        {progress.score !== undefined && (
          <div className={styles.stat}>
            <span className={styles.statLabel}>
              {locale === 'pt' ? 'Pontuação' : 'Score'}:
            </span>
            <span className={styles.statValue}>
              {Math.round(progress.score)}%
            </span>
          </div>
        )}
      </div>
    </div>
  )
}