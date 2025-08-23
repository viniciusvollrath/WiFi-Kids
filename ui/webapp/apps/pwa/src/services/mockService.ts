/**
 * Mock decision service for offline functionality
 * Implements time-based decision logic with support for windows crossing midnight
 */

import { MockContext, DecisionResponse, TimeWindow } from '../types'

/**
 * Checks if the current time falls within a specified time window
 * Supports windows that cross midnight (e.g., 21:00-07:00)
 * 
 * @param now - Current date/time
 * @param start - Start time in "HH:MM" format
 * @param end - End time in "HH:MM" format
 * @param timezone - Timezone string (currently unused, for future extension)
 * @returns true if current time is within the window
 */
export function inWindow(now: Date, start: string, end: string, timezone: string): boolean {
  const [startHour, startMin] = start.split(':').map(Number)
  const [endHour, endMin] = end.split(':').map(Number)
  
  // Validate time format
  if (isNaN(startHour) || isNaN(startMin) || isNaN(endHour) || isNaN(endMin)) {
    throw new Error(`Invalid time format. Expected "HH:MM", got start: "${start}", end: "${end}"`)
  }
  
  // Validate time ranges
  if (startHour < 0 || startHour > 23 || endHour < 0 || endHour > 23) {
    throw new Error(`Invalid hour. Hours must be 0-23, got start: ${startHour}, end: ${endHour}`)
  }
  
  if (startMin < 0 || startMin > 59 || endMin < 0 || endMin > 59) {
    throw new Error(`Invalid minute. Minutes must be 0-59, got start: ${startMin}, end: ${endMin}`)
  }
  
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const startMinutes = startHour * 60 + startMin
  const endMinutes = endHour * 60 + endMin
  
  if (startMinutes <= endMinutes) {
    // Same day window (e.g., 14:00-16:00)
    return currentMinutes >= startMinutes && currentMinutes < endMinutes
  } else {
    // Cross-midnight window (e.g., 21:00-07:00)
    return currentMinutes >= startMinutes || currentMinutes < endMinutes
  }
}

/**
 * Checks if current time is within any of the provided time windows
 * 
 * @param now - Current date/time
 * @param windows - Array of time windows to check
 * @param timezone - Timezone string
 * @returns true if current time is within any window
 */
export function inAnyWindow(now: Date, windows: TimeWindow[], timezone: string): boolean {
  return windows.some(window => inWindow(now, window.start, window.end, timezone))
}

/**
 * Creates a DENY response with appropriate bilingual messages
 * 
 * @param reason - Reason for denial
 * @param persona - Response persona style
 * @returns DecisionResponse with DENY decision
 */
export function createDenyResponse(
  reason: string, 
  persona: 'tutor' | 'maternal' | 'general' = 'general'
): DecisionResponse {
  const messages = {
    bedtime: {
      pt: 'É hora de dormir! Tente novamente amanhã de manhã.',
      en: 'It\'s bedtime! Try again tomorrow morning.'
    },
    study_time: {
      pt: 'Agora é hora de estudar. Tente novamente mais tarde.',
      en: 'It\'s study time now. Try again later.'
    },
    generic: {
      pt: 'Acesso não permitido no momento. Tente novamente mais tarde.',
      en: 'Access not allowed right now. Try again later.'
    }
  }
  
  const message = messages[reason as keyof typeof messages] || messages.generic
  
  return {
    decision: 'DENY',
    message_pt: message.pt,
    message_en: message.en,
    allowed_minutes: 0,
    question_pt: null,
    question_en: null,
    metadata: {
      reason,
      persona
    }
  }
}

/**
 * Creates an ALLOW response with specified time allocation
 * 
 * @param minutes - Minutes of access to grant
 * @param persona - Response persona style
 * @returns DecisionResponse with ALLOW decision
 */
export function createAllowResponse(
  minutes: number, 
  persona: 'tutor' | 'maternal' | 'general' = 'general'
): DecisionResponse {
  return {
    decision: 'ALLOW',
    message_pt: `Acesso liberado por ${minutes} minutos. Divirta-se!`,
    message_en: `Access granted for ${minutes} minutes. Have fun!`,
    allowed_minutes: minutes,
    question_pt: null,
    question_en: null,
    metadata: {
      reason: 'allowed',
      persona
    }
  }
}

/**
 * Creates an ASK_MORE response with a follow-up question
 * 
 * @param questionType - Type of question to ask
 * @param persona - Response persona style
 * @returns DecisionResponse with ASK_MORE decision
 */
export function createAskMoreResponse(
  questionType: string,
  persona: 'tutor' | 'maternal' | 'general' = 'tutor'
): DecisionResponse {
  // For MVP demo, let's create more engaging educational questions
  const educationalQuestions = [
    {
      message_pt: 'Olá! Antes de acessar a internet, vamos testar seus conhecimentos! 📚',
      message_en: 'Hello! Before accessing the internet, let\'s test your knowledge! 📚',
      question_pt: 'Qual é a capital do Brasil?',
      question_en: 'What is the capital of Brazil?',
      subject: 'geography'
    },
    {
      message_pt: 'Hora de um desafio de matemática! 🧮',
      message_en: 'Time for a math challenge! 🧮',
      question_pt: 'Quanto é 15 + 27?',
      question_en: 'What is 15 + 27?',
      subject: 'math'
    },
    {
      message_pt: 'Vamos testar sua história! 🏛️',
      message_en: 'Let\'s test your history! 🏛️',
      question_pt: 'Em que ano o Brasil foi descoberto?',
      question_en: 'In what year was Brazil discovered?',
      subject: 'history'
    },
    {
      message_pt: 'Pergunta de ciências! 🔬',
      message_en: 'Science question! 🔬',
      question_pt: 'Quantos planetas existem em nosso sistema solar?',
      question_en: 'How many planets are in our solar system?',
      subject: 'science'
    }
  ]
  
  // Pick a random question for demo variety
  const randomQuestion = educationalQuestions[Math.floor(Math.random() * educationalQuestions.length)]
  
  const questions = {
    study_completion: randomQuestion,
    generic: randomQuestion
  }
  
  const question = questions[questionType as keyof typeof questions] || questions.generic
  
  return {
    decision: 'ASK_MORE',
    message_pt: question.message_pt,
    message_en: question.message_en,
    allowed_minutes: 0,
    question_pt: question.question_pt,
    question_en: question.question_en,
    questions: [
      {
        id: 'q1',
        prompt: question.question_pt,
        type: 'short',
        difficulty: 'easy',
        subject: question.subject || 'general'
      }
    ],
    metadata: {
      reason: questionType,
      persona
    }
  }
}

/**
 * Gets the current mock context with default time windows
 * 
 * @param now - Current date (optional, defaults to new Date())
 * @returns MockContext with default configuration
 */
export function getCurrentMockContext(now: Date = new Date()): MockContext {
  return {
    now,
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    block_windows: [
      // { start: '21:00', end: '07:00' } // Bedtime: 9 PM to 7 AM - DISABLED FOR MVP
    ],
    study_windows: [
      { start: '00:00', end: '23:59' } // Always study time for MVP demo
    ]
  }
}
/**
 *
 Main mock decision function that implements time-based logic
 * Simulates backend decision-making based on current time and user answers
 * 
 * @param context - Mock context with time windows and current time
 * @param answer - Optional user answer to previous question
 * @returns DecisionResponse based on time windows and logic
 */
export function decideMock(context: MockContext, answer?: string): DecisionResponse {
  const { now, tz, block_windows, study_windows } = context
  
  // Check if current time is within blocking windows (e.g., bedtime)
  if (inAnyWindow(now, block_windows, tz)) {
    return createDenyResponse('bedtime', 'maternal')
  }
  
  // Check if current time is within study windows
  if (inAnyWindow(now, study_windows, tz)) {
    // If we have an answer, process it
    if (answer !== undefined) {
      const normalizedAnswer = answer.toLowerCase().trim()
      
      // Check for correct answers to educational questions
      const correctAnswers = [
        // Geography - Capital of Brazil
        'brasília', 'brasilia', 'brasília, df', 'brasilia, df',
        
        // Math - 15 + 27 = 42, 5 + 5 = 10, 2 + 3 = 5
        '42', 'quarenta e dois',
        '10', 'dez',
        '5', 'cinco',
        
        // History - Brazil discovered in 1500
        '1500', 'mil e quinhentos',
        
        // Science - 8 planets in solar system  
        '8', 'oito', 'oito planetas', '8 planetas',
        
        // Generic positive responses
        'sim', 'yes', 'já', 'ja', 'terminei', 'finished', 'done'
      ]
      
      const incorrectButTrying = [
        // Common wrong answers that show they're trying
        'são paulo', 'rio de janeiro', 'salvador', // wrong capitals
        '40', '41', '43', '44', // close math answers for 15+27
        '8', '9', '11', '12', // close math answers for 5+5
        '1498', '1499', '1501', '1502', // close history dates
        '9', '7', 'nove', 'sete', 'nove planetas', // close science
      ]
      
      // Check if answer is correct
      if (correctAnswers.some(correct => normalizedAnswer.includes(correct))) {
        // Give educational praise based on the correct answer
        let praiseMessage = ''
        if (normalizedAnswer.includes('brasilia')) {
          praiseMessage = '🎉 Perfeito! Brasília é mesmo a capital do Brasil desde 1960! Você conhece bem geografia! Aqui está seu acesso à internet por 30 minutos. Use com sabedoria! 🌐'
        } else if (normalizedAnswer.includes('42')) {
          praiseMessage = '🎉 Exato! 15 + 27 = 42! Você é muito bom em matemática! Aqui está seu acesso à internet por 30 minutos. Aproveite! 🧮'
        } else if (normalizedAnswer.includes('10')) {
          praiseMessage = '🎉 Correto! 5 + 5 = 10! Matemática básica dominada! Aqui está seu acesso à internet por 30 minutos. Divirta-se! ✨'
        } else if (normalizedAnswer.includes('5')) {
          praiseMessage = '🎉 Isso mesmo! 2 + 3 = 5! Você conseguiu! Aqui está seu acesso à internet por 30 minutos. Parabéns! 🎊'
        } else if (normalizedAnswer.includes('1500')) {
          praiseMessage = '🎉 Correto! O Brasil foi descoberto em 1500! Você sabe história! Aqui está seu acesso à internet por 30 minutos. Use para aprender mais! 📚'
        } else if (normalizedAnswer.includes('8')) {
          praiseMessage = '🎉 Perfeito! Existem 8 planetas no nosso sistema solar! Você conhece bem ciências! Aqui está seu acesso à internet por 30 minutos. Explore o universo! 🚀'
        } else {
          praiseMessage = '🎉 Muito bem! Você demonstrou conhecimento! Aqui está seu acesso à internet por 30 minutos. Continue aprendendo! 💪'
        }
        
        return {
          decision: 'ALLOW',
          message_pt: praiseMessage,
          message_en: '🎉 Excellent! You got it right! Here\'s your internet access for 30 minutes!',
          allowed_minutes: 30,
          question_pt: null,
          question_en: null,
          metadata: {
            reason: 'correct_answer',
            persona: 'tutor'
          }
        }
      }
      
      // Check if answer shows they're trying but got it wrong
      if (incorrectButTrying.some(attempt => normalizedAnswer.includes(attempt))) {
        // Give educational feedback based on the wrong answer
        let feedbackMessage = ''
        if (normalizedAnswer.includes('1498') || normalizedAnswer.includes('1499') || normalizedAnswer.includes('1501') || normalizedAnswer.includes('1502')) {
          feedbackMessage = '🤔 Muito perto! Você conhece história! Foi em 1500 que Pedro Álvares Cabral chegou ao Brasil. Vou dar uma pergunta mais fácil!'
        } else if (normalizedAnswer.includes('são paulo') || normalizedAnswer.includes('rio')) {
          feedbackMessage = '🤔 Essa é uma cidade importante, mas a capital é Brasília! Vou dar uma pergunta mais fácil.'
        } else if (normalizedAnswer.includes('40') || normalizedAnswer.includes('41') || normalizedAnswer.includes('43')) {
          feedbackMessage = '🤔 Quase! Para 15 + 27, tente contar: 15 + 20 = 35, depois 35 + 7 = 42. Vou dar outra chance!'
        } else if (normalizedAnswer.includes('8') || normalizedAnswer.includes('9') || normalizedAnswer.includes('11') || normalizedAnswer.includes('12')) {
          feedbackMessage = '🤔 Quase! Para 5 + 5, conte nos dedos: 5 + 1 + 1 + 1 + 1 + 1 = 10. Vou dar outra chance!'
        } else {
          feedbackMessage = '🤔 Quase lá! Você está no caminho certo. Vou dar uma pergunta mais fácil.'
        }
        
        return {
          decision: 'ASK_MORE',
          message_pt: feedbackMessage,
          message_en: '🤔 Close! Let me give you an easier question.',
          allowed_minutes: 0,
          question_pt: 'Quanto é 2 + 3?',
          question_en: 'What is 2 + 3?',
          questions: [
            {
              id: 'q2',
              prompt: 'Quanto é 2 + 3?',
              type: 'short',
              difficulty: 'easy',
              subject: 'math'
            }
          ],
          metadata: {
            reason: 'partial_credit',
            persona: 'tutor'
          }
        }
      }
      
      // For clearly wrong or unclear answers - be more encouraging
      return {
        decision: 'DENY', 
        message_pt: '❌ Ops! Essa não era a resposta que eu esperava. Não se preocupe, aprender é um processo! 📚 Que tal estudar um pouco mais e voltar para tentar? Eu acredito em você! 💪',
        message_en: '❌ Oops! That wasn\'t the answer I expected. Don\'t worry, learning is a process! 📚 How about studying a bit more and coming back to try? I believe in you! 💪',
        allowed_minutes: 0,
        question_pt: null,
        question_en: null,
        metadata: {
          reason: 'incorrect_answer',
          persona: 'tutor'
        }
      }
    } else {
      // First time asking during study hours
      return createAskMoreResponse('study_completion', 'tutor')
    }
  }
  
  // Default case: outside blocking and study windows, allow access
  return createAllowResponse(15, 'general')
}

/**
 * Validates that a DecisionResponse matches the expected interface
 * Used for testing and ensuring mock responses are properly formatted
 * 
 * @param response - Response object to validate
 * @returns true if response is valid DecisionResponse
 */
export function isValidDecisionResponse(response: any): response is DecisionResponse {
  if (!response || typeof response !== 'object') {
    return false
  }
  
  // Check required decision field
  if (!['ALLOW', 'DENY', 'ASK_MORE'].includes(response.decision)) {
    return false
  }
  
  // Check required message fields
  if (typeof response.message_pt !== 'string' || response.message_pt.length === 0) {
    return false
  }
  
  if (typeof response.message_en !== 'string' || response.message_en.length === 0) {
    return false
  }
  
  // Check allowed_minutes field
  if (typeof response.allowed_minutes !== 'number' || response.allowed_minutes < 0) {
    return false
  }
  
  // Check question fields (can be null or string)
  if (response.question_pt !== null && typeof response.question_pt !== 'string') {
    return false
  }
  
  if (response.question_en !== null && typeof response.question_en !== 'string') {
    return false
  }
  
  // Check metadata
  if (!response.metadata || typeof response.metadata !== 'object') {
    return false
  }
  
  if (typeof response.metadata.reason !== 'string') {
    return false
  }
  
  if (!['tutor', 'maternal', 'general'].includes(response.metadata.persona)) {
    return false
  }
  
  return true
}

/**
 * Creates a mock context for testing with specific time
 * Useful for testing different time scenarios
 * 
 * @param hour - Hour (0-23)
 * @param minute - Minute (0-59)
 * @param customWindows - Optional custom time windows
 * @returns MockContext for testing
 */
export function createTestMockContext(
  hour: number, 
  minute: number = 0,
  customWindows?: {
    block_windows?: TimeWindow[]
    study_windows?: TimeWindow[]
  }
): MockContext {
  const now = new Date()
  now.setHours(hour, minute, 0, 0)
  
  return {
    now,
    tz: 'UTC',
    block_windows: customWindows?.block_windows || [
      { start: '21:00', end: '07:00' }
    ],
    study_windows: customWindows?.study_windows || [
      { start: '14:00', end: '16:00' }
    ]
  }
}