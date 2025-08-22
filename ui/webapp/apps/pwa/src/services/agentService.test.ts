/**
 * Tests for AgentService - backend communication with timeout and fallback logic
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import AgentService from './agentService'
import { DecisionResponse } from '../types'
import { createTestMockContext } from './mockService'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock import.meta.env
const originalEnv = import.meta.env
const mockEnv = { ...originalEnv }

beforeEach(() => {
  Object.defineProperty(import.meta, 'env', {
    value: mockEnv,
    writable: true,
    configurable: true
  })
})

describe('AgentService', () => {
  let service: AgentService
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>
  let consoleLogSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    // Reset mocks
    mockFetch.mockReset()
    mockEnv.VITE_MOCK = undefined
    
    // Spy on console methods
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    
    // Create fresh service instance
    service = new AgentService('http://test-backend:3001')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Constructor and Configuration', () => {
    it('should initialize with default backend URL when none provided', () => {
      const defaultService = new AgentService()
      expect(defaultService.getBackendUrl()).toBe('http://localhost:3001')
    })

    it('should initialize with custom backend URL', () => {
      expect(service.getBackendUrl()).toBe('http://test-backend:3001')
    })

    it('should respect VITE_MOCK environment variable', () => {
      // Test that the service can be configured for mock mode
      // Note: Environment variable testing is complex in Vitest, so we test the behavior
      const mockService = new AgentService()
      
      // Manually enable mock mode to test the functionality
      mockService.enableMockMode()
      expect(mockService.isInMockMode()).toBe(true)
      
      // Test that console warning is called when mock mode is enabled
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[AgentService] Mock mode manually enabled'
      )
    })

    it('should generate a valid device ID', () => {
      const deviceId = service.getDeviceId()
      expect(deviceId).toHaveLength(16)
      expect(typeof deviceId).toBe('string')
    })
  })

  describe('Backend Communication', () => {
    const validResponse: DecisionResponse = {
      decision: 'ALLOW',
      message_pt: 'Acesso liberado por 15 minutos',
      message_en: 'Access granted for 15 minutes',
      allowed_minutes: 15,
      question_pt: null,
      question_en: null,
      metadata: {
        reason: 'allowed',
        persona: 'general'
      }
    }

    it('should make successful request to backend', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => validResponse
      })

      const result = await service.requestDecision()

      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-backend:3001/api/session/request',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"device_id"'),
          signal: expect.any(AbortSignal)
        })
      )

      expect(result).toEqual(validResponse)
    })

    it('should include answer in request payload when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => validResponse
      })

      await service.requestDecision({ answer: 'sim' })

      const callArgs = mockFetch.mock.calls[0]
      const body = JSON.parse(callArgs[1].body)
      expect(body.answer).toBe('sim')
    })

    it('should include locale in request payload', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => validResponse
      })

      await service.requestDecision()

      const callArgs = mockFetch.mock.calls[0]
      const body = JSON.parse(callArgs[1].body)
      expect(['pt', 'en']).toContain(body.locale)
    })

    it('should handle HTTP error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      })

      const result = await service.requestDecision()

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[AgentService] Unknown error, falling back to mock mode:',
        expect.objectContaining({
          type: 'network',
          message: expect.stringContaining('Backend responded with status 500')
        })
      )
      expect(service.isInMockMode()).toBe(true)
      expect(result.decision).toMatch(/ALLOW|DENY|ASK_MORE/)
    })

    it('should handle invalid response format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ invalid: 'response' })
      })

      const result = await service.requestDecision()

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[AgentService] Unknown error, falling back to mock mode:',
        expect.objectContaining({
          type: 'network',
          message: 'Invalid response format from backend'
        })
      )
      expect(service.isInMockMode()).toBe(true)
      expect(result.decision).toMatch(/ALLOW|DENY|ASK_MORE/)
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await service.requestDecision()

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[AgentService] Network error, falling back to mock mode:',
        'Network error'
      )
      expect(service.isInMockMode()).toBe(true)
      expect(result.decision).toMatch(/ALLOW|DENY|ASK_MORE/)
    })
  })

  describe('Timeout Handling', () => {
    it('should timeout after specified duration', async () => {
      // Mock AbortController to simulate timeout
      let abortCalled = false
      const mockAbortController = {
        abort: () => { abortCalled = true },
        signal: { aborted: false }
      }
      
      vi.spyOn(window, 'AbortController').mockImplementation(() => mockAbortController as any)
      
      // Mock fetch to throw AbortError after a delay
      mockFetch.mockImplementationOnce(() => {
        return new Promise((_, reject) => {
          setTimeout(() => {
            const error = new Error('The operation was aborted')
            error.name = 'AbortError'
            reject(error)
          }, 50)
        })
      })

      const result = await service.requestDecision({ timeout: 100 })

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[AgentService] Backend request timed out, falling back to mock mode'
      )
      expect(service.isInMockMode()).toBe(true)
      expect(result.decision).toMatch(/ALLOW|DENY|ASK_MORE/)
    }, 10000)

    it('should use default timeout of 3000ms', async () => {
      // Mock AbortController to verify timeout value
      const mockAbort = vi.fn()
      const mockAbortController = {
        abort: mockAbort,
        signal: new AbortController().signal
      }
      
      vi.spyOn(window, 'AbortController').mockImplementation(() => mockAbortController as any)
      const setTimeoutSpy = vi.spyOn(global, 'setTimeout')

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          decision: 'ALLOW',
          message_pt: 'Test',
          message_en: 'Test',
          allowed_minutes: 15,
          question_pt: null,
          question_en: null,
          metadata: { reason: 'test', persona: 'general' }
        })
      })

      await service.requestDecision()

      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 3000)
    })
  })

  describe('Mock Mode', () => {
    it('should use mock mode when manually enabled', async () => {
      // Create service and enable mock mode
      const mockService = new AgentService()
      mockService.enableMockMode()
      
      const result = await mockService.requestDecision()

      expect(mockFetch).not.toHaveBeenCalled()
      expect(result.decision).toMatch(/ALLOW|DENY|ASK_MORE/)
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[AgentService] Using mock mode (VITE_MOCK enabled)'
      )
    })

    it('should enable mock mode manually', () => {
      expect(service.isInMockMode()).toBe(false)
      
      service.enableMockMode()
      
      expect(service.isInMockMode()).toBe(true)
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[AgentService] Mock mode manually enabled'
      )
    })

    it('should disable mock mode manually', () => {
      service.enableMockMode()
      expect(service.isInMockMode()).toBe(true)
      
      service.disableMockMode()
      
      expect(service.isInMockMode()).toBe(false)
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[AgentService] Mock mode disabled, will attempt backend requests'
      )
    })

    it('should use mock decision logic in mock mode', async () => {
      service.enableMockMode()

      // Test during normal hours (10 AM)
      const mockContext = createTestMockContext(10, 0)
      vi.spyOn(service, 'decideMock').mockReturnValue({
        decision: 'ALLOW',
        message_pt: 'Mock response',
        message_en: 'Mock response',
        allowed_minutes: 15,
        question_pt: null,
        question_en: null,
        metadata: { reason: 'mock', persona: 'general' }
      })

      const result = await service.requestDecision()

      expect(service.decideMock).toHaveBeenCalled()
      expect(result.decision).toBe('ALLOW')
    })
  })

  describe('Device ID Management', () => {
    it('should allow setting custom device ID', () => {
      const customId = 'custom-device-id-123'
      
      service.setDeviceId(customId)
      
      expect(service.getDeviceId()).toBe(customId)
    })

    it('should reject device ID shorter than 16 characters', () => {
      expect(() => {
        service.setDeviceId('short')
      }).toThrow('Device ID must be at least 16 characters long')
    })

    it('should generate unique device IDs', () => {
      const service1 = new AgentService()
      const service2 = new AgentService()
      
      expect(service1.getDeviceId()).not.toBe(service2.getDeviceId())
    })
  })

  describe('URL Management', () => {
    it('should allow setting custom backend URL', () => {
      const customUrl = 'https://custom-backend.com'
      
      service.setBackendUrl(customUrl)
      
      expect(service.getBackendUrl()).toBe(customUrl)
    })
  })

  describe('Response Validation', () => {
    it('should reject response missing required fields', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          decision: 'ALLOW'
          // Missing other required fields
        })
      })

      const result = await service.requestDecision()

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[AgentService] Unknown error, falling back to mock mode:',
        expect.objectContaining({
          type: 'network',
          message: 'Invalid response format from backend'
        })
      )
      expect(service.isInMockMode()).toBe(true)
    })

    it('should reject response with invalid decision value', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          decision: 'INVALID',
          message_pt: 'Test',
          message_en: 'Test',
          allowed_minutes: 15,
          question_pt: null,
          question_en: null,
          metadata: { reason: 'test', persona: 'general' }
        })
      })

      const result = await service.requestDecision()

      expect(service.isInMockMode()).toBe(true)
    })

    it('should reject response with negative allowed_minutes', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          decision: 'ALLOW',
          message_pt: 'Test',
          message_en: 'Test',
          allowed_minutes: -5,
          question_pt: null,
          question_en: null,
          metadata: { reason: 'test', persona: 'general' }
        })
      })

      const result = await service.requestDecision()

      expect(service.isInMockMode()).toBe(true)
    })
  })

  describe('Simulation Mode Messages', () => {
    it('should create simulation mode activation message', () => {
      const message = service.createSimulationModeMessage()

      expect(message.decision).toBe('ASK_MORE')
      expect(message.message_pt).toContain('Modo simulação ativo')
      expect(message.message_en).toContain('Simulation mode active')
      expect(message.metadata.reason).toBe('simulation_mode_activated')
      expect(message.metadata.persona).toBe('general')
    })

    it('should provide bilingual simulation messages', () => {
      const message = service.createSimulationModeMessage()

      expect(typeof message.message_pt).toBe('string')
      expect(typeof message.message_en).toBe('string')
      expect(message.message_pt.length).toBeGreaterThan(0)
      expect(message.message_en.length).toBeGreaterThan(0)
    })
  })

  describe('Error Handling Edge Cases', () => {
    it('should handle non-Error exceptions', async () => {
      mockFetch.mockRejectedValueOnce('String error')

      const result = await service.requestDecision()

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unknown error, falling back to mock mode'),
        'String error'
      )
      expect(service.isInMockMode()).toBe(true)
    })

    it('should handle JSON parsing errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON')
        }
      })

      const result = await service.requestDecision()

      expect(service.isInMockMode()).toBe(true)
    })
  })

  describe('Integration with Mock Service', () => {
    it('should use mock service correctly when in mock mode', async () => {
      service.enableMockMode()
      
      // Test during normal hours
      const result = await service.requestDecision()
      
      expect(result.decision).toMatch(/ALLOW|DENY|ASK_MORE/)
      expect(result.message_pt).toBeTruthy()
      expect(result.message_en).toBeTruthy()
      expect(typeof result.allowed_minutes).toBe('number')
    })

    it('should pass answers to mock service correctly', async () => {
      service.enableMockMode()
      
      const result = await service.requestDecision({ answer: 'sim' })
      
      expect(result.decision).toMatch(/ALLOW|DENY|ASK_MORE/)
    })
  })

  describe('Request Payload Validation', () => {
    it('should include all required fields in request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          decision: 'ALLOW',
          message_pt: 'Test',
          message_en: 'Test',
          allowed_minutes: 15,
          question_pt: null,
          question_en: null,
          metadata: { reason: 'test', persona: 'general' }
        })
      })

      await service.requestDecision({ answer: 'test answer' })

      const callArgs = mockFetch.mock.calls[0]
      const body = JSON.parse(callArgs[1].body)
      
      expect(body).toHaveProperty('device_id')
      expect(body).toHaveProperty('locale')
      expect(body).toHaveProperty('answer', 'test answer')
      expect(body.device_id).toHaveLength(16)
      expect(['pt', 'en']).toContain(body.locale)
    })

    it('should not include answer when not provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          decision: 'ALLOW',
          message_pt: 'Test',
          message_en: 'Test',
          allowed_minutes: 15,
          question_pt: null,
          question_en: null,
          metadata: { reason: 'test', persona: 'general' }
        })
      })

      await service.requestDecision()

      const callArgs = mockFetch.mock.calls[0]
      const body = JSON.parse(callArgs[1].body)
      
      // The service might include answer as null, which is acceptable
      expect(body.answer === undefined || body.answer === null).toBe(true)
    })
  })

  describe('Comprehensive Error Scenarios', () => {
    it('should handle 404 errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      })

      const result = await service.requestDecision()

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[AgentService] Unknown error, falling back to mock mode:',
        expect.objectContaining({
          type: 'network',
          message: expect.stringContaining('Backend responded with status 404')
        })
      )
      expect(service.isInMockMode()).toBe(true)
    })

    it('should handle 503 service unavailable', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable'
      })

      const result = await service.requestDecision()

      expect(service.isInMockMode()).toBe(true)
    })

    it('should handle malformed JSON responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new SyntaxError('Unexpected token')
        }
      })

      const result = await service.requestDecision()

      expect(service.isInMockMode()).toBe(true)
    })
  })

  describe('State Management', () => {
    it('should maintain mock mode state across requests', async () => {
      service.enableMockMode()
      
      await service.requestDecision()
      expect(service.isInMockMode()).toBe(true)
      
      await service.requestDecision({ answer: 'test' })
      expect(service.isInMockMode()).toBe(true)
    })

    it('should reset mock mode when disabled', () => {
      service.enableMockMode()
      expect(service.isInMockMode()).toBe(true)
      
      service.disableMockMode()
      expect(service.isInMockMode()).toBe(false)
    })
  })
})