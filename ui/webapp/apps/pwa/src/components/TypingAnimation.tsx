import React, { useState, useEffect } from 'react'
import styles from './TypingAnimation.module.css'

interface TypingAnimationProps {
  text: string
  speed?: number  // Characters per second
  onComplete?: () => void
  className?: string
}

export const TypingAnimation: React.FC<TypingAnimationProps> = ({
  text,
  speed = 50, // Default 50 characters per second
  onComplete,
  className = ''
}) => {
  const [displayedText, setDisplayedText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    if (currentIndex < text.length) {
      const delay = 1000 / speed // Convert speed to milliseconds per character
      const timer = setTimeout(() => {
        setDisplayedText(text.substring(0, currentIndex + 1))
        setCurrentIndex(currentIndex + 1)
      }, delay)

      return () => clearTimeout(timer)
    } else if (!isComplete) {
      setIsComplete(true)
      if (onComplete) {
        onComplete()
      }
    }
  }, [currentIndex, text, speed, onComplete, isComplete])

  // Reset when text changes
  useEffect(() => {
    setDisplayedText('')
    setCurrentIndex(0)
    setIsComplete(false)
  }, [text])

  return (
    <div className={`${styles.typingContainer} ${className}`}>
      <span className={styles.typingText}>
        {displayedText}
        {!isComplete && <span className={styles.cursor}>|</span>}
      </span>
    </div>
  )
}

export default TypingAnimation