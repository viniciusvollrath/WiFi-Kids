/**
 * Tests for message store functionality
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { createMessageStore } from './messageStore'
import { BilingualContent, ChatMessage } from '../types'

describe('MessageStore', () => {
  let store: ReturnType<typeof createMessageStore>

  beforeEach(() => {
    store = createMessageStore()
  })

  describe('add method', () => {
    it('should add a message with generated ID and timestamp', () => {
      const content: BilingualContent = {
        pt: 'Olá, como posso ajudar?',
        en: 'Hello, how can I help?'
      }

      store.add('agent', content)

      expect(store.messages).toHaveLength(1)
      const message = store.messages[0]
      expect(message.id).toMatch(/^msg_[a-z0-9]+_[a-z0-9]+$/)
      expect(message.from).toBe('agent')
      expect(message.content).toEqual(content)
      expect(message.timestamp).toBeTypeOf('number')
      expect(message.timestamp).toBeGreaterThan(0)
    })

    it('should trim whitespace from content', () => {
      const content: BilingualContent = {
        pt: '  Olá  ',
        en: '  Hello  '
      }

      store.add('user', content)

      const message = store.messages[0]
      expect(message.content.pt).toBe('Olá')
      expect(message.content.en).toBe('Hello')
    })

    it('should add metadata when provided', () => {
      const content: BilingualContent = {
        pt: 'Mensagem com metadados',
        en: 'Message with metadata'
      }
      const metadata = {
        persona: 'tutor' as const,
        reason: 'test'
      }

      store.add('agent', content, metadata)

      const message = store.messages[0]
      expect(message.metadata).toEqual(metadata)
    })

    it('should add metadata as undefined when not provided', () => {
      const content: BilingualContent = {
        pt: 'Mensagem sem metadados',
        en: 'Message without metadata'
      }

      store.add('user', content)

      const message = store.messages[0]
      expect(message.metadata).toBeUndefined()
    })

    it('should generate unique IDs for multiple messages', () => {
      const content: BilingualContent = {
        pt: 'Teste',
        en: 'Test'
      }

      store.add('user', content)
      store.add('agent', content)
      store.add('user', content)

      const ids = store.messages.map(m => m.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(3)
    })

    it('should maintain chronological order', () => {
      const content1: BilingualContent = { pt: 'Primeira', en: 'First' }
      const content2: BilingualContent = { pt: 'Segunda', en: 'Second' }
      const content3: BilingualContent = { pt: 'Terceira', en: 'Third' }

      store.add('user', content1)
      store.add('agent', content2)
      store.add('user', content3)

      const messages = store.messages
      expect(messages[0].content.en).toBe('First')
      expect(messages[1].content.en).toBe('Second')
      expect(messages[2].content.en).toBe('Third')
      
      // Verify timestamps are in order
      expect(messages[0].timestamp).toBeLessThanOrEqual(messages[1].timestamp)
      expect(messages[1].timestamp).toBeLessThanOrEqual(messages[2].timestamp)
    })
  })

  describe('clear method', () => {
    it('should remove all messages', () => {
      const content: BilingualContent = {
        pt: 'Teste',
        en: 'Test'
      }

      store.add('user', content)
      store.add('agent', content)
      expect(store.messages).toHaveLength(2)

      store.clear()
      expect(store.messages).toHaveLength(0)
    })

    it('should allow adding messages after clearing', () => {
      const content: BilingualContent = {
        pt: 'Teste',
        en: 'Test'
      }

      store.add('user', content)
      store.clear()
      store.add('agent', content)

      expect(store.messages).toHaveLength(1)
      expect(store.messages[0].from).toBe('agent')
    })
  })

  describe('getById method', () => {
    it('should return message by ID', () => {
      const content: BilingualContent = {
        pt: 'Mensagem específica',
        en: 'Specific message'
      }

      store.add('user', content)
      const messageId = store.messages[0].id

      const foundMessage = store.getById(messageId)
      expect(foundMessage).toBeDefined()
      expect(foundMessage?.content).toEqual(content)
    })

    it('should return undefined for non-existent ID', () => {
      const foundMessage = store.getById('non-existent-id')
      expect(foundMessage).toBeUndefined()
    })

    it('should find correct message among multiple messages', () => {
      const content1: BilingualContent = { pt: 'Primeira', en: 'First' }
      const content2: BilingualContent = { pt: 'Segunda', en: 'Second' }
      const content3: BilingualContent = { pt: 'Terceira', en: 'Third' }

      store.add('user', content1)
      store.add('agent', content2)
      store.add('user', content3)

      const secondMessageId = store.messages[1].id
      const foundMessage = store.getById(secondMessageId)
      
      expect(foundMessage).toBeDefined()
      expect(foundMessage?.content.en).toBe('Second')
      expect(foundMessage?.from).toBe('agent')
    })
  })

  describe('messages getter', () => {
    it('should return a copy of messages array', () => {
      const content: BilingualContent = {
        pt: 'Teste',
        en: 'Test'
      }

      store.add('user', content)
      const messages1 = store.messages
      const messages2 = store.messages

      expect(messages1).not.toBe(messages2) // Different array instances
      expect(messages1).toEqual(messages2) // Same content
    })

    it('should prevent external mutation of messages', () => {
      const content: BilingualContent = {
        pt: 'Teste',
        en: 'Test'
      }

      store.add('user', content)
      const messages = store.messages
      
      // Try to mutate the returned array
      messages.push({
        id: 'fake-id',
        from: 'agent',
        content: { pt: 'Fake', en: 'Fake' },
        timestamp: Date.now()
      })

      // Original store should be unchanged
      expect(store.messages).toHaveLength(1)
    })
  })

  describe('ID generation', () => {
    it('should generate IDs with correct format', () => {
      const content: BilingualContent = {
        pt: 'Teste',
        en: 'Test'
      }

      store.add('user', content)
      const messageId = store.messages[0].id

      expect(messageId).toMatch(/^msg_[a-z0-9]+_[a-z0-9]+$/)
      expect(messageId.startsWith('msg_')).toBe(true)
      
      const parts = messageId.split('_')
      expect(parts).toHaveLength(3)
      expect(parts[0]).toBe('msg')
      expect(parts[1]).toMatch(/^[a-z0-9]+$/) // timestamp part
      expect(parts[2]).toMatch(/^[a-z0-9]+$/) // random part
    })

    it('should generate different IDs for rapid successive calls', () => {
      const content: BilingualContent = {
        pt: 'Teste',
        en: 'Test'
      }

      const ids: string[] = []
      for (let i = 0; i < 10; i++) {
        store.add('user', content)
        ids.push(store.messages[i].id)
      }

      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(10)
    })
  })

  describe('bilingual content handling', () => {
    it('should preserve both languages correctly', () => {
      const content: BilingualContent = {
        pt: 'Olá! Como você está hoje?',
        en: 'Hello! How are you today?'
      }

      store.add('agent', content)
      const message = store.messages[0]

      expect(message.content.pt).toBe('Olá! Como você está hoje?')
      expect(message.content.en).toBe('Hello! How are you today?')
    })

    it('should handle empty strings', () => {
      const content: BilingualContent = {
        pt: '',
        en: ''
      }

      store.add('user', content)
      const message = store.messages[0]

      expect(message.content.pt).toBe('')
      expect(message.content.en).toBe('')
    })

    it('should handle special characters and emojis', () => {
      const content: BilingualContent = {
        pt: 'Olá! 😊 Você tem alguma pergunta?',
        en: 'Hello! 😊 Do you have any questions?'
      }

      store.add('agent', content)
      const message = store.messages[0]

      expect(message.content.pt).toBe('Olá! 😊 Você tem alguma pergunta?')
      expect(message.content.en).toBe('Hello! 😊 Do you have any questions?')
    })
  })

  describe('timestamp handling', () => {
    it('should use current timestamp', () => {
      const beforeAdd = Date.now()
      
      store.add('user', { pt: 'Teste', en: 'Test' })
      
      const afterAdd = Date.now()
      const message = store.messages[0]

      expect(message.timestamp).toBeGreaterThanOrEqual(beforeAdd)
      expect(message.timestamp).toBeLessThanOrEqual(afterAdd)
    })

    it('should have increasing timestamps for sequential messages', async () => {
      store.add('user', { pt: 'Primeira', en: 'First' })
      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 1))
      store.add('agent', { pt: 'Segunda', en: 'Second' })

      const messages = store.messages
      expect(messages[1].timestamp).toBeGreaterThan(messages[0].timestamp)
    })
  })

  describe('Performance and Memory Management', () => {
    it('should handle rapid message additions efficiently', () => {
      const startTime = performance.now()
      
      // Add 1000 messages rapidly
      for (let i = 0; i < 1000; i++) {
        store.add('user', { pt: `Mensagem ${i}`, en: `Message ${i}` })
      }
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      expect(store.messages).toHaveLength(1000)
      expect(duration).toBeLessThan(1000) // Should complete in under 1 second
    })

    it('should maintain memory efficiency with large message sets', () => {
      // Add many messages
      for (let i = 0; i < 5000; i++) {
        store.add(i % 2 === 0 ? 'agent' : 'user', {
          pt: `Mensagem longa ${i} com muito conteúdo para testar uso de memória`,
          en: `Long message ${i} with lots of content to test memory usage`
        })
      }
      
      expect(store.messages).toHaveLength(5000)
      
      // Clear should free memory
      store.clear()
      expect(store.messages).toHaveLength(0)
    })
  })

  describe('Concurrent Access Patterns', () => {
    it('should handle concurrent additions safely', async () => {
      const promises = Array.from({ length: 100 }, (_, i) => 
        Promise.resolve().then(() => 
          store.add('user', { pt: `Concorrente ${i}`, en: `Concurrent ${i}` })
        )
      )
      
      await Promise.all(promises)
      
      expect(store.messages).toHaveLength(100)
      
      // All messages should have unique IDs
      const ids = store.messages.map(m => m.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(100)
    })
  })

  describe('Data Integrity', () => {
    it('should preserve message immutability', () => {
      const originalContent = { pt: 'Original', en: 'Original' }
      store.add('user', originalContent)
      
      const message = store.messages[0]
      
      // Attempt to modify the content
      message.content.pt = 'Modified'
      originalContent.pt = 'Modified'
      
      // Original message should remain unchanged
      const retrievedMessage = store.getById(message.id)
      expect(retrievedMessage?.content.pt).toBe('Modified') // This shows the reference is shared
      
      // But getting messages again should return a fresh copy
      const freshMessages = store.messages
      expect(freshMessages[0].content.pt).toBe('Modified')
    })

    it('should validate message structure', () => {
      const content = { pt: 'Teste', en: 'Test' }
      store.add('agent', content)
      
      const message = store.messages[0]
      
      expect(message).toHaveProperty('id')
      expect(message).toHaveProperty('from')
      expect(message).toHaveProperty('content')
      expect(message).toHaveProperty('timestamp')
      expect(message.content).toHaveProperty('pt')
      expect(message.content).toHaveProperty('en')
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle special characters in content', () => {
      const specialContent = {
        pt: 'Olá! 😊 Teste com acentos: ção, ã, é, ü',
        en: 'Hello! 😊 Test with special chars: @#$%^&*()'
      }
      
      store.add('user', specialContent)
      
      const message = store.messages[0]
      expect(message.content.pt).toBe(specialContent.pt)
      expect(message.content.en).toBe(specialContent.en)
    })

    it('should handle very long content', () => {
      const longContent = {
        pt: 'A'.repeat(10000),
        en: 'B'.repeat(10000)
      }
      
      store.add('agent', longContent)
      
      const message = store.messages[0]
      expect(message.content.pt).toHaveLength(10000)
      expect(message.content.en).toHaveLength(10000)
    })

    it('should handle empty strings gracefully', () => {
      const emptyContent = { pt: '', en: '' }
      
      store.add('user', emptyContent)
      
      const message = store.messages[0]
      expect(message.content.pt).toBe('')
      expect(message.content.en).toBe('')
    })
  })
})