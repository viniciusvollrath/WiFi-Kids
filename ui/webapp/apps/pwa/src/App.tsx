import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { t } from './i18n'
import { Locale, AppState, BilingualContent, Question, Challenge, ChallengeProgress as ChallengeProgressType } from './types'
import { LanguageToggle, ChatPanel, SimulationBadge } from './components'
import { ChallengeProgress } from './components/ChallengeProgress'
import { ErrorBoundary } from './components/ErrorBoundary'
import { checkBrowserSupport, logError, createAppError } from './utils/errorHandling'
import { agentService } from './services/agentService'
import { messageStore } from './services/messageStore'
import { chatStateMachine, getStateUIConfig } from './services/stateMachine'
import { challengeStore } from './services/challengeStore'

const inferLocale = (): Locale => {
  const lang = navigator.language.toLowerCase()
  return lang.startsWith('pt') ? 'pt' : 'en'
}

export default function App() {
  const [locale, setLocale] = useState<Locale>(inferLocale())
  const [appState, setAppState] = useState<AppState>('IDLE')
  const [messages, setMessages] = useState(messageStore.messages)
  const [ctaDisabledUntil, setCtaDisabledUntil] = useState<number>(0)
  const [browserSupported, setBrowserSupported] = useState(true)
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([])
  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null)
  const [challengeProgress, setChallengeProgress] = useState<ChallengeProgressType | null>(null)
  
  const i = useMemo(() => t(locale), [locale])
  const uiConfig = useMemo(() => getStateUIConfig(appState), [appState])
  
  // Check if CTA should be disabled (during REQUESTING or 2s after ALLOW)
  const isCtaDisabled = useMemo(() => {
    return !uiConfig.ctaEnabled || Date.now() < ctaDisabledUntil
  }, [uiConfig.ctaEnabled, ctaDisabledUntil])

  // Handle state machine changes
  useEffect(() => {
    const unsubscribe = chatStateMachine.onStateChange((newState) => {
      setAppState(newState)
      
      // Update messages when state changes
      setMessages([...messageStore.messages])
      
      // Handle ALLOW state - disable CTA for 2 seconds
      if (newState === 'ALLOW') {
        setCtaDisabledUntil(Date.now() + 2000)
      }
    })
    
    return unsubscribe
  }, [])

  // Handle challenge state changes
  useEffect(() => {
    const unsubscribe = challengeStore.onStateChange((challenge, progress) => {
      setCurrentChallenge(challenge)
      setChallengeProgress(progress)
    })
    
    return unsubscribe
  }, [])

  // Add initial greeting message when chat panel first opens
  const addGreetingMessage = useCallback(() => {
    const greetingContent: BilingualContent = {
      pt: i.greeting,
      en: t('en').greeting
    }
    
    messageStore.add('agent', greetingContent, {
      persona: 'general',
      reason: 'greeting'
    })
    setMessages([...messageStore.messages])
  }, [i.greeting])

  // Handle access request (CTA click)
  const handleAccessRequest = useCallback(async () => {
    if (!chatStateMachine.canTransitionTo('REQUESTING')) {
      return
    }

    // Transition to REQUESTING state
    chatStateMachine.transition('REQUESTING')
    
    // Add greeting message if this is the first interaction
    if (messageStore.messages.length === 0) {
      addGreetingMessage()
    }

    try {
      // Request decision from agent service
      const response = await agentService.requestDecision()
      
      // Store questions and create challenge if present
      const questions = response.questions || []
      setCurrentQuestions(questions)
      
      if (questions.length > 0) {
        // Create a new challenge
        const challengeId = `challenge_${Date.now()}`
        challengeStore.createChallenge(challengeId, questions, 3, {
          difficulty: 'medium',
          subject: 'general',
          estimatedTime: questions.length * 60
        })
      }
      
      // Add agent response message
      const responseContent: BilingualContent = {
        pt: response.message_pt,
        en: response.message_en
      }
      
      messageStore.add('agent', responseContent, {
        persona: response.metadata.persona,
        reason: response.metadata.reason
      })
      
      // Transition to appropriate state based on response
      if (response.decision === 'ASK_MORE') {
        chatStateMachine.transition('ASK_MORE')
      } else if (response.decision === 'ALLOW') {
        chatStateMachine.transition('ALLOW')
      } else {
        chatStateMachine.transition('DENY')
      }
      
    } catch (error) {
      console.error('Error requesting access:', error)
      
      // Add error message and transition to DENY
      const errorContent: BilingualContent = {
        pt: i.network_error,
        en: t('en').network_error
      }
      
      messageStore.add('agent', errorContent, {
        persona: 'general',
        reason: 'error'
      })
      
      chatStateMachine.transition('DENY')
    }
  }, [addGreetingMessage, i.network_error])

  // Handle message sending from chat input
  const handleSendMessage = useCallback(async (message: string) => {
    if (!message.trim() || message.length > 200) {
      return
    }

    // Add user message
    const userContent: BilingualContent = {
      pt: message,
      en: message // User messages are the same in both languages
    }
    
    messageStore.add('user', userContent)
    
    // Transition to REQUESTING state
    if (chatStateMachine.canTransitionTo('REQUESTING')) {
      chatStateMachine.transition('REQUESTING')
    }

    try {
      // Send message as answer to agent service
      const response = await agentService.requestDecision({ answer: message })
      
      // Store questions and update challenge if present
      const questions = response.questions || []
      setCurrentQuestions(questions)
      
      if (questions.length > 0) {
        // Create a new challenge if not already active
        if (!challengeStore.getCurrentChallenge()) {
          const challengeId = `challenge_${Date.now()}`
          challengeStore.createChallenge(challengeId, questions, 3, {
            difficulty: 'medium',
            subject: 'general',
            estimatedTime: questions.length * 60
          })
        }
      }
      
      // Add agent response
      const responseContent: BilingualContent = {
        pt: response.message_pt,
        en: response.message_en
      }
      
      messageStore.add('agent', responseContent, {
        persona: response.metadata.persona,
        reason: response.metadata.reason
      })
      
      // Transition to appropriate state
      if (response.decision === 'ASK_MORE') {
        chatStateMachine.transition('ASK_MORE')
      } else if (response.decision === 'ALLOW') {
        chatStateMachine.transition('ALLOW')
      } else {
        chatStateMachine.transition('DENY')
      }
      
    } catch (error) {
      console.error('Error sending message:', error)
      
      // Add error message and transition to DENY
      const errorContent: BilingualContent = {
        pt: i.network_error,
        en: t('en').network_error
      }
      
      messageStore.add('agent', errorContent, {
        persona: 'general',
        reason: 'error'
      })
      
      chatStateMachine.transition('DENY')
    }
  }, [i.network_error])

  // Handle retry (Try Again button)
  const handleRetry = useCallback(() => {
    // Clear messages and reset state machine
    messageStore.clear()
    chatStateMachine.reset()
    setMessages([])
    setCtaDisabledUntil(0)
    setCurrentQuestions([])
    challengeStore.clearChallenge()
  }, [])

  // Handle language change - update document lang and preserve chat
  const handleLanguageChange = useCallback((newLocale: Locale) => {
    setLocale(newLocale)
    document.documentElement.lang = newLocale
    
    // Update messages display (they already contain bilingual content)
    setMessages([...messageStore.messages])
  }, [])

  useEffect(() => {
    // Set initial document language
    document.documentElement.lang = locale
    
    // Check browser support
    const support = checkBrowserSupport()
    if (!support.supported) {
      setBrowserSupported(false)
      logError(createAppError(
        'browser_support',
        `Missing features: ${support.missing.join(', ')}`,
        undefined,
        { missingFeatures: support.missing }
      ))
    }
  }, [locale])

  // Handle errors from ErrorBoundary
  const handleError = useCallback((error: Error, errorInfo: any) => {
    logError(createAppError(
      'unknown',
      'React component error',
      error,
      { errorInfo, component: 'ChatPanel' }
    ))
  }, [])

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'grid',
      placeItems: 'center',
      padding: 'var(--spacing-lg)',
      background: 'var(--color-background-muted)'
    }}>
      {/* Simulation badge */}
      <SimulationBadge 
        visible={agentService.isInMockMode()} 
        locale={locale}
      />
      
      <div className="container">
        <div className="card">
          {/* Header with title and language toggle */}
          <div className="flex justify-between items-center" style={{ marginBottom: 'var(--spacing-lg)' }}>
            <h1 style={{ 
              margin: 0, 
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 600,
              color: 'var(--color-text)'
            }}>
              {i.title}
            </h1>
            <LanguageToggle locale={locale} onChange={handleLanguageChange} />
          </div>
          
          <p style={{ 
            color: 'var(--color-text-muted)',
            fontSize: 'var(--font-size-base)',
            marginBottom: 'var(--spacing-xl)',
            lineHeight: 1.6
          }}>
            {i.subtitle}
          </p>

          {/* Access Internet CTA */}
          <button
            onClick={handleAccessRequest}
            disabled={isCtaDisabled}
            className="interactive-element"
            style={{
              width: '100%',
              padding: 'var(--spacing-md) var(--spacing-lg)',
              borderRadius: 'var(--radius-lg)',
              border: 'none',
              background: isCtaDisabled ? 'var(--color-primary-disabled)' : 'var(--color-primary)',
              color: '#fff',
              fontSize: 'var(--font-size-lg)',
              fontWeight: 600,
              cursor: isCtaDisabled ? 'not-allowed' : 'pointer',
              transition: 'all var(--duration-normal) ease',
              minHeight: 'var(--touch-target-min)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {uiConfig.ctaText[locale]}
          </button>

          {/* Browser support warning */}
          {!browserSupported && (
            <div style={{
              marginTop: 'var(--spacing-lg)',
              padding: 'var(--spacing-md)',
              backgroundColor: '#fef3cd',
              border: '1px solid #fde047',
              borderRadius: 'var(--radius-md)',
              color: '#92400e'
            }}>
              {i.browser_not_supported}
            </div>
          )}

          {/* Chat Panel - shown conditionally after CTA click */}
          {uiConfig.showChatPanel && (
            <div style={{ marginTop: 'var(--spacing-lg)' }}>
              <ErrorBoundary 
                locale={locale} 
                onError={handleError}
                fallback={
                  <div style={{
                    padding: 'var(--spacing-lg)',
                    textAlign: 'center',
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: 'var(--radius-md)',
                    color: '#dc2626'
                  }}>
                    <p>{i.error_boundary_message}</p>
                    <button 
                      onClick={handleRetry}
                      style={{
                        marginTop: 'var(--spacing-md)',
                        padding: 'var(--spacing-sm) var(--spacing-md)',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer'
                      }}
                    >
                      {i.try_again_button}
                    </button>
                  </div>
                }
              >
                {/* Challenge Progress - shown when challenge is active */}
                {currentChallenge && challengeProgress && (
                  <ChallengeProgress 
                    challenge={currentChallenge}
                    progress={challengeProgress}
                    locale={locale}
                  />
                )}
                
                <ChatPanel
                  state={appState}
                  messages={messages}
                  loading={appState === 'REQUESTING'}
                  onSend={handleSendMessage}
                  onRetry={handleRetry}
                  locale={locale}
                  questions={currentQuestions}
                  onAnswersSubmit={(answers) => {
                    // Update challenge progress
                    Object.keys(answers).forEach(questionId => {
                      challengeStore.answerQuestion(questionId, answers[questionId])
                    })
                    
                    // Submit answers through challenge store
                    const submittedAnswers = challengeStore.submitAnswers()
                    
                    if (submittedAnswers) {
                      const formattedAnswers = JSON.stringify(
                        Object.keys(submittedAnswers).map(questionId => ({
                          id: questionId,
                          value: submittedAnswers[questionId]
                        }))
                      )
                      handleSendMessage(formattedAnswers)
                    }
                  }}
                />
              </ErrorBoundary>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
