import React, { useState } from 'react'
import styles from './QuestionCard.module.css'

export interface Question {
  id: string
  type: 'mc' | 'short' | 'true_false'
  prompt: string
  options?: string[]
  answer_len?: number
  subject: string
  difficulty: string
  explanation?: string
}

export interface QuestionCardProps {
  question: Question
  questionNumber: number
  selectedAnswer?: string
  onAnswerChange: (questionId: string, answer: string) => void
  locale: 'pt' | 'en'
  disabled?: boolean
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  questionNumber,
  selectedAnswer,
  onAnswerChange,
  locale,
  disabled = false
}) => {
  const [textAnswer, setTextAnswer] = useState(selectedAnswer || '')

  const handleOptionSelect = (option: string) => {
    if (!disabled) {
      onAnswerChange(question.id, option)
    }
  }

  const handleTextChange = (value: string) => {
    if (!disabled) {
      setTextAnswer(value)
      onAnswerChange(question.id, value)
    }
  }

  const renderMultipleChoice = () => {
    if (!question.options) return null

    return (
      <div className={styles.optionsContainer}>
        {question.options.map((option, index) => {
          const optionLetter = String.fromCharCode(65 + index) // A, B, C, D
          const isSelected = selectedAnswer === option

          return (
            <button
              key={index}
              className={`${styles.option} ${isSelected ? styles.selected : ''} ${disabled ? styles.disabled : ''}`}
              onClick={() => handleOptionSelect(option)}
              disabled={disabled}
              type="button"
              aria-pressed={isSelected}
              role="radio"
            >
              <span className={styles.optionLetter}>
                {optionLetter})
              </span>
              <span className={styles.optionText}>
                {option}
              </span>
              {isSelected && (
                <span className={styles.checkmark} aria-hidden="true">
                  ✓
                </span>
              )}
            </button>
          )
        })}
      </div>
    )
  }

  const renderShortAnswer = () => {
    const placeholder = locale === 'pt' 
      ? 'Digite sua resposta...' 
      : 'Type your answer...'

    return (
      <div className={styles.shortAnswerContainer}>
        <textarea
          className={styles.shortAnswerInput}
          value={textAnswer}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={question.answer_len || 500}
          rows={3}
          aria-label={`Resposta para a pergunta ${questionNumber}`}
        />
        {question.answer_len && (
          <div className={styles.characterCount}>
            {textAnswer.length} / {question.answer_len}
          </div>
        )}
      </div>
    )
  }

  const renderTrueFalse = () => {
    const trueText = locale === 'pt' ? 'Verdadeiro' : 'True'
    const falseText = locale === 'pt' ? 'Falso' : 'False'
    
    return (
      <div className={styles.trueFalseContainer}>
        <button
          className={`${styles.trueFalseOption} ${selectedAnswer === 'true' ? styles.selected : ''} ${disabled ? styles.disabled : ''}`}
          onClick={() => handleOptionSelect('true')}
          disabled={disabled}
          type="button"
          aria-pressed={selectedAnswer === 'true'}
        >
          <span className={styles.trueFalseIcon}>✓</span>
          <span>{trueText}</span>
        </button>
        
        <button
          className={`${styles.trueFalseOption} ${selectedAnswer === 'false' ? styles.selected : ''} ${disabled ? styles.disabled : ''}`}
          onClick={() => handleOptionSelect('false')}
          disabled={disabled}
          type="button"
          aria-pressed={selectedAnswer === 'false'}
        >
          <span className={styles.trueFalseIcon}>✗</span>
          <span>{falseText}</span>
        </button>
      </div>
    )
  }

  const getSubjectEmoji = (subject: string) => {
    const subjectEmojis: { [key: string]: string } = {
      math: '🔢',
      history: '📚',
      geography: '🌍',
      english: '🗣️',
      physics: '⚗️',
      science: '🔬',
      literature: '📖',
      art: '🎨'
    }
    return subjectEmojis[subject] || '📝'
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return styles.difficultyEasy
      case 'medium': return styles.difficultyMedium
      case 'hard': return styles.difficultyHard
      default: return styles.difficultyMedium
    }
  }

  const getDifficultyText = (difficulty: string) => {
    if (locale === 'pt') {
      switch (difficulty) {
        case 'easy': return 'Fácil'
        case 'medium': return 'Médio'
        case 'hard': return 'Difícil'
        default: return 'Médio'
      }
    } else {
      return difficulty.charAt(0).toUpperCase() + difficulty.slice(1)
    }
  }

  return (
    <div className={styles.questionCard} role="group" aria-labelledby={`question-${question.id}`}>
      {/* Question Header */}
      <div className={styles.questionHeader}>
        <div className={styles.questionNumber}>
          {locale === 'pt' ? 'Pergunta' : 'Question'} {questionNumber}
        </div>
        <div className={styles.questionMeta}>
          <span className={styles.subject}>
            {getSubjectEmoji(question.subject)} {question.subject}
          </span>
          <span className={`${styles.difficulty} ${getDifficultyColor(question.difficulty)}`}>
            {getDifficultyText(question.difficulty)}
          </span>
        </div>
      </div>

      {/* Question Prompt */}
      <div className={styles.questionPrompt} id={`question-${question.id}`}>
        {question.prompt}
      </div>

      {/* Answer Area */}
      <div className={styles.answerArea}>
        {question.type === 'mc' && renderMultipleChoice()}
        {question.type === 'short' && renderShortAnswer()}
        {question.type === 'true_false' && renderTrueFalse()}
      </div>

      {/* Explanation (if provided) */}
      {question.explanation && (
        <details className={styles.explanation}>
          <summary className={styles.explanationToggle}>
            {locale === 'pt' ? 'Explicação' : 'Explanation'}
          </summary>
          <div className={styles.explanationContent}>
            {question.explanation}
          </div>
        </details>
      )}
    </div>
  )
}