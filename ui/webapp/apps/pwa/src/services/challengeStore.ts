/**
 * Challenge State Management Service
 * Manages the lifecycle of educational challenges, including progress tracking,
 * state transitions, and result storage.
 */

import { Challenge, ChallengeState, ChallengeProgress, ChallengeResult, Question } from '../types'
import { config } from './config'

type ChallengeStateChangeListener = (challenge: Challenge | null, progress: ChallengeProgress | null) => void

class ChallengeStore {
  private currentChallenge: Challenge | null = null
  private currentProgress: ChallengeProgress | null = null
  private results: ChallengeResult[] = []
  private listeners: ChallengeStateChangeListener[] = []

  // Create a new challenge from questions
  createChallenge(
    id: string,
    questions: Question[],
    maxAttempts: number = config.getMaxAttempts(),
    metadata?: Challenge['metadata']
  ): Challenge {
    const challenge: Challenge = {
      id,
      questions,
      startTime: Date.now(),
      maxAttempts,
      currentAttempt: 1,
      status: 'active',
      metadata: metadata || {
        difficulty: 'medium',
        subject: 'general',
        estimatedTime: questions.length * 60 // 1 minute per question
      }
    }

    this.setCurrentChallenge(challenge)
    return challenge
  }

  // Set the current active challenge
  setCurrentChallenge(challenge: Challenge | null): void {
    this.currentChallenge = challenge
    
    if (challenge) {
      this.currentProgress = {
        challengeId: challenge.id,
        answeredQuestions: {},
        totalQuestions: challenge.questions.length,
        completedQuestions: 0,
        timeSpent: 0
      }
    } else {
      this.currentProgress = null
    }

    this.notifyListeners()
  }

  // Get the current challenge
  getCurrentChallenge(): Challenge | null {
    return this.currentChallenge
  }

  // Get current progress
  getCurrentProgress(): ChallengeProgress | null {
    return this.currentProgress
  }

  // Update challenge state
  updateChallengeState(newState: ChallengeState): void {
    if (!this.currentChallenge) return

    this.currentChallenge.status = newState
    this.notifyListeners()
  }

  // Answer a question in the current challenge
  answerQuestion(questionId: string, answer: string): void {
    if (!this.currentChallenge || !this.currentProgress) return

    // Update progress
    const wasNewAnswer = !this.currentProgress.answeredQuestions[questionId]
    this.currentProgress.answeredQuestions[questionId] = answer
    
    if (wasNewAnswer) {
      this.currentProgress.completedQuestions += 1
    }

    // Update time spent
    this.currentProgress.timeSpent = Date.now() - this.currentChallenge.startTime

    // Check if all questions are answered
    if (this.currentProgress.completedQuestions === this.currentProgress.totalQuestions) {
      this.updateChallengeState('answering')
    }

    this.notifyListeners()
  }

  // Submit answers for validation
  submitAnswers(): Record<string, string> | null {
    if (!this.currentChallenge || !this.currentProgress) return null

    this.updateChallengeState('validating')
    return { ...this.currentProgress.answeredQuestions }
  }

  // Complete challenge with result
  completeChallenge(result: ChallengeResult): void {
    if (!this.currentChallenge) return

    // Store result
    this.results.push(result)

    // Update challenge state
    this.updateChallengeState(result.success ? 'completed' : 'failed')

    // If failed and has attempts left, allow retry
    if (!result.success && this.currentChallenge.currentAttempt < this.currentChallenge.maxAttempts) {
      this.currentChallenge.currentAttempt += 1
      // Reset progress for retry
      if (this.currentProgress) {
        this.currentProgress.answeredQuestions = {}
        this.currentProgress.completedQuestions = 0
      }
      this.updateChallengeState('active')
    }
  }

  // Retry current challenge
  retryChallenge(): boolean {
    if (!this.currentChallenge) return false
    
    if (this.currentChallenge.currentAttempt >= this.currentChallenge.maxAttempts) {
      return false
    }

    this.currentChallenge.currentAttempt += 1
    this.currentChallenge.startTime = Date.now()
    
    if (this.currentProgress) {
      this.currentProgress.answeredQuestions = {}
      this.currentProgress.completedQuestions = 0
      this.currentProgress.timeSpent = 0
    }

    this.updateChallengeState('active')
    return true
  }

  // Clear current challenge
  clearChallenge(): void {
    this.currentChallenge = null
    this.currentProgress = null
    this.notifyListeners()
  }

  // Get challenge results history
  getResults(): ChallengeResult[] {
    return [...this.results]
  }

  // Get challenge statistics
  getStats(): {
    totalChallenges: number
    completedChallenges: number
    averageScore: number
    totalTimeSpent: number
  } {
    const completed = this.results.filter(r => r.success)
    const totalScore = this.results.reduce((sum, r) => sum + r.score, 0)
    const totalTime = this.results.reduce((sum, r) => sum + r.timeSpent, 0)

    return {
      totalChallenges: this.results.length,
      completedChallenges: completed.length,
      averageScore: this.results.length > 0 ? totalScore / this.results.length : 0,
      totalTimeSpent: totalTime
    }
  }

  // Subscribe to state changes
  onStateChange(listener: ChallengeStateChangeListener): () => void {
    this.listeners.push(listener)
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  // Notify all listeners of state changes
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      listener(this.currentChallenge, this.currentProgress)
    })
  }

  // Check if challenge is in progress
  isActive(): boolean {
    return this.currentChallenge?.status === 'active' || this.currentChallenge?.status === 'answering'
  }

  // Check if challenge can be retried
  canRetry(): boolean {
    if (!this.currentChallenge) return false
    return this.currentChallenge.status === 'failed' && 
           this.currentChallenge.currentAttempt < this.currentChallenge.maxAttempts
  }

  // Get remaining attempts
  getRemainingAttempts(): number {
    if (!this.currentChallenge) return 0
    return Math.max(0, this.currentChallenge.maxAttempts - this.currentChallenge.currentAttempt)
  }

  // Calculate progress percentage
  getProgressPercentage(): number {
    if (!this.currentProgress) return 0
    return Math.round((this.currentProgress.completedQuestions / this.currentProgress.totalQuestions) * 100)
  }
}

// Create singleton instance
export const challengeStore = new ChallengeStore()