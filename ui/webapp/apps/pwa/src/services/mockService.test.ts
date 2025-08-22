/**
 * Comprehensive tests for mock service time window logic
 * Tests edge cases and boundary conditions for midnight-crossing windows
 */

import { describe, it, expect } from 'vitest'
import {
  inWindow,
  inAnyWindow,
  createDenyResponse,
  createAllowResponse,
  createAskMoreResponse,
  getCurrentMockContext,
  decideMock,
  isValidDecisionResponse,
  createTestMockContext
} from './mockService'
import { TimeWindow } from '../types'

describe('inWindow function', () => {
  // Helper function to create a date with specific time
  const createDate = (hour: number, minute: number = 0): Date => {
    const date = new Date()
    date.setHours(hour, minute, 0, 0)
    return date
  }

  describe('same-day windows', () => {
    it('should return true for time within same-day window', () => {
      const now = createDate(15, 30) // 15:30
      expect(inWindow(now, '14:00', '16:00', 'UTC')).toBe(true)
    })

    it('should return false for time before same-day window', () => {
      const now = createDate(13, 59) // 13:59
      expect(inWindow(now, '14:00', '16:00', 'UTC')).toBe(false)
    })

    it('should return false for time after same-day window', () => {
      const now = createDate(16, 0) // 16:00 (end is exclusive)
      expect(inWindow(now, '14:00', '16:00', 'UTC')).toBe(false)
    })

    it('should handle exact start time (inclusive)', () => {
      const now = createDate(14, 0) // 14:00
      expect(inWindow(now, '14:00', '16:00', 'UTC')).toBe(true)
    })

    it('should handle exact end time (exclusive)', () => {
      const now = createDate(16, 0) // 16:00
      expect(inWindow(now, '14:00', '16:00', 'UTC')).toBe(false)
    })
  })

  describe('cross-midnight windows', () => {
    it('should return true for time in evening part of cross-midnight window', () => {
      const now = createDate(22, 30) // 22:30
      expect(inWindow(now, '21:00', '07:00', 'UTC')).toBe(true)
    })

    it('should return true for time in morning part of cross-midnight window', () => {
      const now = createDate(6, 30) // 06:30
      expect(inWindow(now, '21:00', '07:00', 'UTC')).toBe(true)
    })

    it('should return false for time outside cross-midnight window', () => {
      const now = createDate(15, 30) // 15:30
      expect(inWindow(now, '21:00', '07:00', 'UTC')).toBe(false)
    })

    it('should handle exact start time for cross-midnight window', () => {
      const now = createDate(21, 0) // 21:00
      expect(inWindow(now, '21:00', '07:00', 'UTC')).toBe(true)
    })

    it('should handle exact end time for cross-midnight window (exclusive)', () => {
      const now = createDate(7, 0) // 07:00
      expect(inWindow(now, '21:00', '07:00', 'UTC')).toBe(false)
    })
  })

  describe('boundary conditions', () => {
    it('should handle 20:59 (before 21:00-07:00 window)', () => {
      const now = createDate(20, 59)
      expect(inWindow(now, '21:00', '07:00', 'UTC')).toBe(false)
    })

    it('should handle 21:00 (start of 21:00-07:00 window)', () => {
      const now = createDate(21, 0)
      expect(inWindow(now, '21:00', '07:00', 'UTC')).toBe(true)
    })

    it('should handle 06:59 (within 21:00-07:00 window)', () => {
      const now = createDate(6, 59)
      expect(inWindow(now, '21:00', '07:00', 'UTC')).toBe(true)
    })

    it('should handle 07:00 (end of 21:00-07:00 window)', () => {
      const now = createDate(7, 0)
      expect(inWindow(now, '21:00', '07:00', 'UTC')).toBe(false)
    })

    it('should handle midnight (00:00) in cross-midnight window', () => {
      const now = createDate(0, 0)
      expect(inWindow(now, '21:00', '07:00', 'UTC')).toBe(true)
    })

    it('should handle 23:59 in cross-midnight window', () => {
      const now = createDate(23, 59)
      expect(inWindow(now, '21:00', '07:00', 'UTC')).toBe(true)
    })
  })

  describe('specific test windows', () => {
    it('should handle 20:00-23:59 window correctly', () => {
      expect(inWindow(createDate(19, 59), '20:00', '23:59', 'UTC')).toBe(false)
      expect(inWindow(createDate(20, 0), '20:00', '23:59', 'UTC')).toBe(true)
      expect(inWindow(createDate(22, 30), '20:00', '23:59', 'UTC')).toBe(true)
      expect(inWindow(createDate(23, 59), '20:00', '23:59', 'UTC')).toBe(false) // End is exclusive
    })

    it('should handle 00:00-07:00 window correctly', () => {
      expect(inWindow(createDate(23, 59), '00:00', '07:00', 'UTC')).toBe(false)
      expect(inWindow(createDate(0, 0), '00:00', '07:00', 'UTC')).toBe(true)
      expect(inWindow(createDate(3, 30), '00:00', '07:00', 'UTC')).toBe(true)
      expect(inWindow(createDate(6, 59), '00:00', '07:00', 'UTC')).toBe(true)
      expect(inWindow(createDate(7, 0), '00:00', '07:00', 'UTC')).toBe(false)
    })
  })

  describe('input validation', () => {
    it('should throw error for invalid time format', () => {
      const now = createDate(15, 30)
      expect(() => inWindow(now, 'invalid', '16:00', 'UTC')).toThrow('Invalid time format')
      expect(() => inWindow(now, '15:00', 'invalid', 'UTC')).toThrow('Invalid time format')
    })

    it('should throw error for invalid hour', () => {
      const now = createDate(15, 30)
      expect(() => inWindow(now, '25:00', '16:00', 'UTC')).toThrow('Invalid hour')
      expect(() => inWindow(now, '15:00', '25:00', 'UTC')).toThrow('Invalid hour')
      expect(() => inWindow(now, '-1:00', '16:00', 'UTC')).toThrow('Invalid hour')
    })

    it('should throw error for invalid minute', () => {
      const now = createDate(15, 30)
      expect(() => inWindow(now, '15:60', '16:00', 'UTC')).toThrow('Invalid minute')
      expect(() => inWindow(now, '15:00', '16:60', 'UTC')).toThrow('Invalid minute')
      expect(() => inWindow(now, '15:-1', '16:00', 'UTC')).toThrow('Invalid minute')
    })
  })
})

describe('inAnyWindow function', () => {
  const createDate = (hour: number, minute: number = 0): Date => {
    const date = new Date()
    date.setHours(hour, minute, 0, 0)
    return date
  }

  it('should return true if time is within any window', () => {
    const windows: TimeWindow[] = [
      { start: '09:00', end: '12:00' },
      { start: '14:00', end: '17:00' },
      { start: '21:00', end: '07:00' }
    ]
    
    expect(inAnyWindow(createDate(10, 30), windows, 'UTC')).toBe(true) // First window
    expect(inAnyWindow(createDate(15, 30), windows, 'UTC')).toBe(true) // Second window
    expect(inAnyWindow(createDate(22, 30), windows, 'UTC')).toBe(true) // Third window (cross-midnight)
    expect(inAnyWindow(createDate(6, 30), windows, 'UTC')).toBe(true)  // Third window (morning part)
  })

  it('should return false if time is not within any window', () => {
    const windows: TimeWindow[] = [
      { start: '09:00', end: '12:00' },
      { start: '14:00', end: '17:00' }
    ]
    
    expect(inAnyWindow(createDate(13, 30), windows, 'UTC')).toBe(false) // Between windows
    expect(inAnyWindow(createDate(8, 30), windows, 'UTC')).toBe(false)  // Before first window
    expect(inAnyWindow(createDate(18, 30), windows, 'UTC')).toBe(false) // After last window
  })

  it('should return false for empty windows array', () => {
    expect(inAnyWindow(createDate(15, 30), [], 'UTC')).toBe(false)
  })
})

describe('response generators', () => {
  describe('createDenyResponse', () => {
    it('should create bedtime deny response', () => {
      const response = createDenyResponse('bedtime', 'maternal')
      
      expect(response.decision).toBe('DENY')
      expect(response.message_pt).toBe('É hora de dormir! Tente novamente amanhã de manhã.')
      expect(response.message_en).toBe('It\'s bedtime! Try again tomorrow morning.')
      expect(response.allowed_minutes).toBe(0)
      expect(response.question_pt).toBeNull()
      expect(response.question_en).toBeNull()
      expect(response.metadata.reason).toBe('bedtime')
      expect(response.metadata.persona).toBe('maternal')
    })

    it('should create study time deny response', () => {
      const response = createDenyResponse('study_time', 'tutor')
      
      expect(response.decision).toBe('DENY')
      expect(response.message_pt).toBe('Agora é hora de estudar. Tente novamente mais tarde.')
      expect(response.message_en).toBe('It\'s study time now. Try again later.')
      expect(response.metadata.reason).toBe('study_time')
      expect(response.metadata.persona).toBe('tutor')
    })

    it('should create generic deny response for unknown reason', () => {
      const response = createDenyResponse('unknown_reason')
      
      expect(response.decision).toBe('DENY')
      expect(response.message_pt).toBe('Acesso não permitido no momento. Tente novamente mais tarde.')
      expect(response.message_en).toBe('Access not allowed right now. Try again later.')
      expect(response.metadata.reason).toBe('unknown_reason')
      expect(response.metadata.persona).toBe('general')
    })
  })

  describe('createAllowResponse', () => {
    it('should create allow response with specified minutes', () => {
      const response = createAllowResponse(15, 'general')
      
      expect(response.decision).toBe('ALLOW')
      expect(response.message_pt).toBe('Acesso liberado por 15 minutos. Divirta-se!')
      expect(response.message_en).toBe('Access granted for 15 minutes. Have fun!')
      expect(response.allowed_minutes).toBe(15)
      expect(response.question_pt).toBeNull()
      expect(response.question_en).toBeNull()
      expect(response.metadata.reason).toBe('allowed')
      expect(response.metadata.persona).toBe('general')
    })

    it('should handle different time allocations', () => {
      const response30 = createAllowResponse(30)
      const response60 = createAllowResponse(60)
      
      expect(response30.message_pt).toBe('Acesso liberado por 30 minutos. Divirta-se!')
      expect(response30.allowed_minutes).toBe(30)
      
      expect(response60.message_pt).toBe('Acesso liberado por 60 minutos. Divirta-se!')
      expect(response60.allowed_minutes).toBe(60)
    })
  })

  describe('createAskMoreResponse', () => {
    it('should create study completion question', () => {
      const response = createAskMoreResponse('study_completion', 'tutor')
      
      expect(response.decision).toBe('ASK_MORE')
      expect(response.message_pt).toBe('Primeiro, me conta: você já terminou suas tarefas de casa?')
      expect(response.message_en).toBe('First, tell me: have you finished your homework?')
      expect(response.question_pt).toBe('Você terminou a lição de casa?')
      expect(response.question_en).toBe('Did you finish your homework?')
      expect(response.allowed_minutes).toBe(0)
      expect(response.metadata.reason).toBe('study_completion')
      expect(response.metadata.persona).toBe('tutor')
    })

    it('should create generic question for unknown type', () => {
      const response = createAskMoreResponse('unknown_type')
      
      expect(response.decision).toBe('ASK_MORE')
      expect(response.message_pt).toBe('Preciso saber mais algumas coisas antes de liberar o acesso.')
      expect(response.message_en).toBe('I need to know a few more things before granting access.')
      expect(response.question_pt).toBe('Você pode me contar mais?')
      expect(response.question_en).toBe('Can you tell me more?')
      expect(response.metadata.reason).toBe('unknown_type')
      expect(response.metadata.persona).toBe('tutor')
    })
  })
})

describe('getCurrentMockContext', () => {
  it('should return context with default windows', () => {
    const now = new Date()
    const context = getCurrentMockContext(now)
    
    expect(context.now).toBe(now)
    expect(context.tz).toBe(Intl.DateTimeFormat().resolvedOptions().timeZone)
    expect(context.block_windows).toEqual([
      { start: '21:00', end: '07:00' }
    ])
    expect(context.study_windows).toEqual([
      { start: '14:00', end: '16:00' }
    ])
  })

  it('should use current date when no date provided', () => {
    const context = getCurrentMockContext()
    const now = new Date()
    
    // Allow for small time difference due to execution time
    expect(Math.abs(context.now.getTime() - now.getTime())).toBeLessThan(100)
  })
})

describe('decideMock function', () => {
  describe('blocking windows (bedtime)', () => {
    it('should deny access during bedtime hours (evening)', () => {
      const context = createTestMockContext(22, 30) // 22:30
      const response = decideMock(context)
      
      expect(response.decision).toBe('DENY')
      expect(response.message_pt).toBe('É hora de dormir! Tente novamente amanhã de manhã.')
      expect(response.message_en).toBe('It\'s bedtime! Try again tomorrow morning.')
      expect(response.allowed_minutes).toBe(0)
      expect(response.metadata.reason).toBe('bedtime')
      expect(response.metadata.persona).toBe('maternal')
    })

    it('should deny access during bedtime hours (early morning)', () => {
      const context = createTestMockContext(6, 0) // 06:00
      const response = decideMock(context)
      
      expect(response.decision).toBe('DENY')
      expect(response.metadata.reason).toBe('bedtime')
    })

    it('should allow access just after bedtime window ends', () => {
      const context = createTestMockContext(7, 0) // 07:00
      const response = decideMock(context)
      
      expect(response.decision).toBe('ALLOW')
      expect(response.allowed_minutes).toBe(15)
    })
  })

  describe('study windows', () => {
    it('should ask about homework during study hours (no answer)', () => {
      const context = createTestMockContext(15, 0) // 15:00 (within 14:00-16:00)
      const response = decideMock(context)
      
      expect(response.decision).toBe('ASK_MORE')
      expect(response.message_pt).toBe('Primeiro, me conta: você já terminou suas tarefas de casa?')
      expect(response.message_en).toBe('First, tell me: have you finished your homework?')
      expect(response.question_pt).toBe('Você terminou a lição de casa?')
      expect(response.question_en).toBe('Did you finish your homework?')
      expect(response.allowed_minutes).toBe(0)
      expect(response.metadata.reason).toBe('study_completion')
      expect(response.metadata.persona).toBe('tutor')
    })

    it('should allow access when homework is completed (Portuguese)', () => {
      const context = createTestMockContext(15, 0)
      const response = decideMock(context, 'sim')
      
      expect(response.decision).toBe('ALLOW')
      expect(response.allowed_minutes).toBe(15)
      expect(response.metadata.persona).toBe('tutor')
    })

    it('should allow access when homework is completed (English)', () => {
      const context = createTestMockContext(15, 0)
      const response = decideMock(context, 'yes')
      
      expect(response.decision).toBe('ALLOW')
      expect(response.allowed_minutes).toBe(15)
    })

    it('should allow access with various positive answers', () => {
      const context = createTestMockContext(15, 0)
      const positiveAnswers = ['sim', 'yes', 'y', 's', 'já terminei', 'finished', 'done']
      
      positiveAnswers.forEach(answer => {
        const response = decideMock(context, answer)
        expect(response.decision).toBe('ALLOW')
        expect(response.allowed_minutes).toBe(15)
      })
    })

    it('should deny access when homework is not completed (Portuguese)', () => {
      const context = createTestMockContext(15, 0)
      const response = decideMock(context, 'não')
      
      expect(response.decision).toBe('DENY')
      expect(response.message_pt).toBe('Agora é hora de estudar. Tente novamente mais tarde.')
      expect(response.message_en).toBe('It\'s study time now. Try again later.')
      expect(response.metadata.reason).toBe('study_time')
      expect(response.metadata.persona).toBe('tutor')
    })

    it('should deny access when homework is not completed (English)', () => {
      const context = createTestMockContext(15, 0)
      const response = decideMock(context, 'no')
      
      expect(response.decision).toBe('DENY')
      expect(response.metadata.reason).toBe('study_time')
    })

    it('should deny access with various negative answers', () => {
      const context = createTestMockContext(15, 0)
      const negativeAnswers = ['não', 'nao', 'no', 'n', 'ainda não', 'not yet', 'nope']
      
      negativeAnswers.forEach(answer => {
        const response = decideMock(context, answer)
        expect(response.decision).toBe('DENY')
        expect(response.metadata.reason).toBe('study_time')
      })
    })

    it('should ask for clarification with unclear answer', () => {
      const context = createTestMockContext(15, 0)
      const response = decideMock(context, 'maybe')
      
      expect(response.decision).toBe('ASK_MORE')
      expect(response.message_pt).toBe('Não entendi bem. Você pode responder com "sim" ou "não"?')
      expect(response.message_en).toBe('I didn\'t understand. Can you answer with "yes" or "no"?')
      expect(response.question_pt).toBe('Você terminou toda a lição de casa? (sim/não)')
      expect(response.question_en).toBe('Did you finish all your homework? (yes/no)')
      expect(response.metadata.reason).toBe('clarification_needed')
    })

    it('should handle empty or whitespace answers', () => {
      const context = createTestMockContext(15, 0)
      
      const response1 = decideMock(context, '')
      const response2 = decideMock(context, '   ')
      
      expect(response1.decision).toBe('ASK_MORE')
      expect(response2.decision).toBe('ASK_MORE')
      expect(response1.metadata.reason).toBe('clarification_needed')
      expect(response2.metadata.reason).toBe('clarification_needed')
    })
  })

  describe('normal hours (outside blocking and study windows)', () => {
    it('should allow access during normal hours', () => {
      const context = createTestMockContext(10, 0) // 10:00 (outside all windows)
      const response = decideMock(context)
      
      expect(response.decision).toBe('ALLOW')
      expect(response.message_pt).toBe('Acesso liberado por 15 minutos. Divirta-se!')
      expect(response.message_en).toBe('Access granted for 15 minutes. Have fun!')
      expect(response.allowed_minutes).toBe(15)
      expect(response.metadata.reason).toBe('allowed')
      expect(response.metadata.persona).toBe('general')
    })

    it('should allow access in the evening before bedtime', () => {
      const context = createTestMockContext(20, 30) // 20:30 (before 21:00)
      const response = decideMock(context)
      
      expect(response.decision).toBe('ALLOW')
      expect(response.allowed_minutes).toBe(15)
    })

    it('should allow access in the morning after bedtime', () => {
      const context = createTestMockContext(8, 0) // 08:00 (after 07:00)
      const response = decideMock(context)
      
      expect(response.decision).toBe('ALLOW')
      expect(response.allowed_minutes).toBe(15)
    })
  })

  describe('priority handling', () => {
    it('should prioritize blocking windows over study windows', () => {
      // Create context where blocking and study windows overlap
      const context = createTestMockContext(22, 0, {
        block_windows: [{ start: '21:00', end: '07:00' }],
        study_windows: [{ start: '20:00', end: '23:00' }] // Overlaps with blocking
      })
      
      const response = decideMock(context)
      
      // Should deny due to bedtime, not ask about homework
      expect(response.decision).toBe('DENY')
      expect(response.metadata.reason).toBe('bedtime')
    })
  })

  describe('edge cases', () => {
    it('should handle case-insensitive answers', () => {
      const context = createTestMockContext(15, 0)
      
      const response1 = decideMock(context, 'SIM')
      const response2 = decideMock(context, 'YES')
      const response3 = decideMock(context, 'NÃO')
      const response4 = decideMock(context, 'NO')
      
      expect(response1.decision).toBe('ALLOW')
      expect(response2.decision).toBe('ALLOW')
      expect(response3.decision).toBe('DENY')
      expect(response4.decision).toBe('DENY')
    })

    it('should handle answers with extra whitespace', () => {
      const context = createTestMockContext(15, 0)
      
      const response1 = decideMock(context, '  sim  ')
      const response2 = decideMock(context, '\t\nyes\t\n')
      
      expect(response1.decision).toBe('ALLOW')
      expect(response2.decision).toBe('ALLOW')
    })

    it('should handle partial matches in longer sentences', () => {
      const context = createTestMockContext(15, 0)
      
      const response1 = decideMock(context, 'sim, já terminei tudo')
      const response2 = decideMock(context, 'não, ainda não terminei')
      
      expect(response1.decision).toBe('ALLOW')
      expect(response2.decision).toBe('DENY')
    })
  })
})

describe('isValidDecisionResponse function', () => {
  it('should validate correct ALLOW response', () => {
    const response = createAllowResponse(15, 'general')
    expect(isValidDecisionResponse(response)).toBe(true)
  })

  it('should validate correct DENY response', () => {
    const response = createDenyResponse('bedtime', 'maternal')
    expect(isValidDecisionResponse(response)).toBe(true)
  })

  it('should validate correct ASK_MORE response', () => {
    const response = createAskMoreResponse('study_completion', 'tutor')
    expect(isValidDecisionResponse(response)).toBe(true)
  })

  it('should reject invalid decision values', () => {
    const response = { ...createAllowResponse(15), decision: 'INVALID' }
    expect(isValidDecisionResponse(response)).toBe(false)
  })

  it('should reject missing message fields', () => {
    const response1 = { ...createAllowResponse(15), message_pt: '' }
    const response2 = { ...createAllowResponse(15), message_en: null }
    
    expect(isValidDecisionResponse(response1)).toBe(false)
    expect(isValidDecisionResponse(response2)).toBe(false)
  })

  it('should reject negative allowed_minutes', () => {
    const response = { ...createAllowResponse(15), allowed_minutes: -1 }
    expect(isValidDecisionResponse(response)).toBe(false)
  })

  it('should reject invalid persona values', () => {
    const response = { ...createAllowResponse(15), metadata: { reason: 'test', persona: 'invalid' } }
    expect(isValidDecisionResponse(response)).toBe(false)
  })

  it('should reject null or undefined responses', () => {
    expect(isValidDecisionResponse(null)).toBe(false)
    expect(isValidDecisionResponse(undefined)).toBe(false)
    expect(isValidDecisionResponse({})).toBe(false)
  })
})

describe('createTestMockContext function', () => {
  it('should create context with specified time', () => {
    const context = createTestMockContext(15, 30)
    
    expect(context.now.getHours()).toBe(15)
    expect(context.now.getMinutes()).toBe(30)
    expect(context.tz).toBe('UTC')
  })

  it('should use default windows when not specified', () => {
    const context = createTestMockContext(12, 0)
    
    expect(context.block_windows).toEqual([{ start: '21:00', end: '07:00' }])
    expect(context.study_windows).toEqual([{ start: '14:00', end: '16:00' }])
  })

  it('should use custom windows when provided', () => {
    const customWindows = {
      block_windows: [{ start: '22:00', end: '06:00' }],
      study_windows: [{ start: '13:00', end: '15:00' }]
    }
    
    const context = createTestMockContext(12, 0, customWindows)
    
    expect(context.block_windows).toEqual(customWindows.block_windows)
    expect(context.study_windows).toEqual(customWindows.study_windows)
  })

  it('should default minute to 0 when not specified', () => {
    const context = createTestMockContext(15)
    
    expect(context.now.getHours()).toBe(15)
    expect(context.now.getMinutes()).toBe(0)
  })
})

describe('integration tests', () => {
  it('should handle complete decision flow scenarios', () => {
    // Scenario 1: Normal hours - immediate allow
    const normalContext = createTestMockContext(10, 0)
    const normalResponse = decideMock(normalContext)
    expect(normalResponse.decision).toBe('ALLOW')
    expect(isValidDecisionResponse(normalResponse)).toBe(true)
    
    // Scenario 2: Study hours - ask then allow
    const studyContext = createTestMockContext(15, 0)
    const askResponse = decideMock(studyContext)
    expect(askResponse.decision).toBe('ASK_MORE')
    expect(isValidDecisionResponse(askResponse)).toBe(true)
    
    const allowResponse = decideMock(studyContext, 'sim')
    expect(allowResponse.decision).toBe('ALLOW')
    expect(isValidDecisionResponse(allowResponse)).toBe(true)
    
    // Scenario 3: Study hours - ask then deny
    const denyResponse = decideMock(studyContext, 'não')
    expect(denyResponse.decision).toBe('DENY')
    expect(isValidDecisionResponse(denyResponse)).toBe(true)
    
    // Scenario 4: Bedtime - immediate deny
    const bedtimeContext = createTestMockContext(22, 0)
    const bedtimeResponse = decideMock(bedtimeContext)
    expect(bedtimeResponse.decision).toBe('DENY')
    expect(isValidDecisionResponse(bedtimeResponse)).toBe(true)
  })

  it('should handle complex multi-step conversations', () => {
    const studyContext = createTestMockContext(15, 0)
    
    // Step 1: Initial request during study hours
    const step1 = decideMock(studyContext)
    expect(step1.decision).toBe('ASK_MORE')
    expect(step1.question_pt).toContain('lição de casa')
    
    // Step 2: Unclear answer - should ask for clarification
    const step2 = decideMock(studyContext, 'talvez')
    expect(step2.decision).toBe('ASK_MORE')
    expect(step2.metadata.reason).toBe('clarification_needed')
    
    // Step 3: Clear positive answer - should allow
    const step3 = decideMock(studyContext, 'sim')
    expect(step3.decision).toBe('ALLOW')
    expect(step3.allowed_minutes).toBe(15)
  })
})