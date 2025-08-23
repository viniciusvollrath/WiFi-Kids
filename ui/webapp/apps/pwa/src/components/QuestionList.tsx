import React, { useState, useEffect } from 'react'
import { QuestionCard, Question } from './QuestionCard'
import styles from './QuestionList.module.css'

export interface QuestionListProps {
  questions: Question[]
  onAnswersChange: (answers: Record<string, string>) => void
  locale: 'pt' | 'en'
  disabled?: boolean
  initialAnswers?: Record<string, string>
}

export const QuestionList: React.FC<QuestionListProps> = ({
  questions,
  onAnswersChange,
  locale,
  disabled = false,
  initialAnswers = {}
}) => {
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers)

  // Update parent when answers change
  useEffect(() => {
    onAnswersChange(answers)
  }, [answers, onAnswersChange])

  // Update local state when initial answers change
  useEffect(() => {
    setAnswers(initialAnswers)
  }, [initialAnswers])

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }))
  }

  const getAnsweredCount = () => {
    return Object.keys(answers).filter(id => answers[id]?.trim()).length
  }

  const getTotalQuestions = () => {
    return questions.length
  }

  const isAllAnswered = () => {
    return questions.every(q => answers[q.id]?.trim())
  }

  if (!questions || questions.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>📝</div>
        <div className={styles.emptyText}>
          {locale === 'pt' 
            ? 'Nenhuma pergunta disponível' 
            : 'No questions available'
          }
        </div>
      </div>
    )
  }

  return (
    <div className={styles.questionList} role="group" aria-labelledby="questions-heading">
      {/* Progress Header */}
      <div className={styles.progressHeader} id="questions-heading">
        <h2 className={styles.questionsTitle}>
          {locale === 'pt' ? 'Perguntas Educacionais' : 'Educational Questions'}
        </h2>
        <div className={styles.progressIndicator}>
          <div className={styles.progressText}>
            {getAnsweredCount()} / {getTotalQuestions()} {' '}
            {locale === 'pt' ? 'respondidas' : 'answered'}
          </div>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill}
              style={{ 
                width: `${(getAnsweredCount() / getTotalQuestions()) * 100}%` 
              }}
              role="progressbar"
              aria-valuenow={getAnsweredCount()}
              aria-valuemin={0}
              aria-valuemax={getTotalQuestions()}
              aria-label={`${getAnsweredCount()} de ${getTotalQuestions()} perguntas respondidas`}
            />
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className={styles.questions}>
        {questions.map((question, index) => (
          <QuestionCard
            key={question.id}
            question={question}
            questionNumber={index + 1}
            selectedAnswer={answers[question.id]}
            onAnswerChange={handleAnswerChange}
            locale={locale}
            disabled={disabled}
          />
        ))}
      </div>

      {/* Completion Status */}
      <div className={styles.completionStatus}>
        {isAllAnswered() ? (
          <div className={styles.allAnswered}>
            <span className={styles.completionIcon}>✅</span>
            <span className={styles.completionText}>
              {locale === 'pt' 
                ? 'Todas as perguntas foram respondidas!' 
                : 'All questions have been answered!'
              }
            </span>
          </div>
        ) : (
          <div className={styles.pendingAnswers}>
            <span className={styles.completionIcon}>⏳</span>
            <span className={styles.completionText}>
              {locale === 'pt' 
                ? `Ainda faltam ${getTotalQuestions() - getAnsweredCount()} pergunta(s)`
                : `${getTotalQuestions() - getAnsweredCount()} question(s) remaining`
              }
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export default QuestionList