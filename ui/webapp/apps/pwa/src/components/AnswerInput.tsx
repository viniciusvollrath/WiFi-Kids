import React, { useState, useEffect } from 'react'
import { QuestionList, Question } from './QuestionList'
import { ChatInput } from './ChatInput'
import styles from './AnswerInput.module.css'

export interface AnswerInputProps {
  mode: 'chat' | 'questions'
  questions?: Question[]
  onSend: (message: string) => void
  onAnswersSubmit: (answers: Record<string, string>) => void
  disabled?: boolean
  locale: 'pt' | 'en'
  loading?: boolean
}

export const AnswerInput: React.FC<AnswerInputProps> = ({
  mode,
  questions = [],
  onSend,
  onAnswersSubmit,
  disabled = false,
  locale,
  loading = false
}) => {
  const [currentAnswers, setCurrentAnswers] = useState<Record<string, string>>({})
  const [showSubmitButton, setShowSubmitButton] = useState(false)

  // Check if all questions are answered
  useEffect(() => {
    if (mode === 'questions' && questions.length > 0) {
      const allAnswered = questions.every(q => 
        currentAnswers[q.id] && currentAnswers[q.id].trim().length > 0
      )
      setShowSubmitButton(allAnswered)
    } else {
      setShowSubmitButton(false)
    }
  }, [mode, questions, currentAnswers])

  // Handle answers change from QuestionList
  const handleAnswersChange = (answers: Record<string, string>) => {
    setCurrentAnswers(answers)
  }

  // Handle submit button click
  const handleSubmitAnswers = () => {
    if (!disabled && showSubmitButton) {
      // Validate all answers are present
      const validAnswers: Record<string, string> = {}
      let hasErrors = false

      questions.forEach(question => {
        const answer = currentAnswers[question.id]
        
        if (!answer || answer.trim().length === 0) {
          hasErrors = true
          return
        }

        // Additional validation based on question type
        if (question.type === 'short' && question.answer_len && answer.length > question.answer_len) {
          hasErrors = true
          return
        }

        validAnswers[question.id] = answer.trim()
      })

      if (!hasErrors) {
        onAnswersSubmit(validAnswers)
      }
    }
  }

  // Format answers for submission to match API format
  const formatAnswersForSubmission = (answers: Record<string, string>) => {
    return questions.map(question => ({
      id: question.id,
      value: answers[question.id] || ''
    }))
  }

  // Handle answer submission via text (when questions are displayed as text but answers come via chat)
  const handleTextAnswerSubmission = (message: string) => {
    if (mode === 'questions' && questions.length > 0) {
      // Parse text answers (e.g., "A, B, C" or "1: A, 2: B")
      const parsedAnswers = parseTextAnswers(message, questions)
      
      // Convert to the format expected by the API
      const formattedMessage = formatParsedAnswersAsMessage(parsedAnswers)
      onSend(formattedMessage)
    } else {
      // Regular chat message
      onSend(message)
    }
  }

  // Parse text-based answers
  const parseTextAnswers = (text: string, questions: Question[]): Record<string, string> => {
    const answers: Record<string, string> = {}
    
    if (questions.length === 1) {
      // Single question - entire text is the answer
      answers[questions[0].id] = text.trim()
      return answers
    }

    // Multiple questions - try different parsing strategies
    if (text.includes(',')) {
      // Format like "A, B, C" or "1: A, 2: B"
      const parts = text.split(',').map(p => p.trim())
      parts.forEach((part, index) => {
        if (index < questions.length) {
          const cleanAnswer = part.replace(/^\d+[:.]\s*/, '').trim()
          answers[questions[index].id] = cleanAnswer
        }
      })
    } else if (text.match(/^\d+[:.]/)) {
      // Single answer with question number like "1: A" or "2. B"
      const match = text.match(/^(\d+)[:.]\s*(.+)/)
      if (match) {
        const questionIndex = parseInt(match[1]) - 1
        if (questionIndex >= 0 && questionIndex < questions.length) {
          answers[questions[questionIndex].id] = match[2].trim()
        }
      }
    } else {
      // Single answer for first question
      answers[questions[0].id] = text.trim()
    }

    return answers
  }

  // Format parsed answers back to a message for the API
  const formatParsedAnswersAsMessage = (answers: Record<string, string>): string => {
    return JSON.stringify(
      questions.map(q => ({
        id: q.id,
        value: answers[q.id] || ''
      }))
    )
  }

  if (mode === 'questions' && questions.length > 0) {
    return (
      <div className={styles.answerInputContainer}>
        {/* Question-based Interface */}
        <div className={styles.questionsSection}>
          <QuestionList
            questions={questions}
            onAnswersChange={handleAnswersChange}
            locale={locale}
            disabled={disabled || loading}
            initialAnswers={currentAnswers}
          />
        </div>

        {/* Submit Button */}
        {showSubmitButton && (
          <div className={styles.submitSection}>
            <button
              className={styles.submitButton}
              onClick={handleSubmitAnswers}
              disabled={disabled || loading}
              type="button"
            >
              {loading && <span className={styles.spinner} />}
              {locale === 'pt' ? 'Enviar Respostas' : 'Submit Answers'}
            </button>
          </div>
        )}

        {/* Alternative: Text Input for Answers */}
        <div className={styles.alternativeInput}>
          <details className={styles.alternativeDetails}>
            <summary className={styles.alternativeSummary}>
              {locale === 'pt' 
                ? 'Ou digite suas respostas como texto' 
                : 'Or type your answers as text'
              }
            </summary>
            <div className={styles.alternativeContent}>
              <p className={styles.alternativeHint}>
                {locale === 'pt' 
                  ? 'Ex: "A, B, C" ou "1: A, 2: B, 3: C"'
                  : 'E.g.: "A, B, C" or "1: A, 2: B, 3: C"'
                }
              </p>
              <ChatInput
                onSend={handleTextAnswerSubmission}
                disabled={disabled}
                locale={locale}
                placeholder={locale === 'pt' ? 'Digite suas respostas...' : 'Type your answers...'}
              />
            </div>
          </details>
        </div>
      </div>
    )
  }

  // Chat mode - regular text input
  return (
    <div className={styles.chatInputContainer}>
      <ChatInput
        onSend={onSend}
        disabled={disabled}
        locale={locale}
      />
    </div>
  )
}

export default AnswerInput