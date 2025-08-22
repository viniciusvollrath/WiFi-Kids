/**
 * In-memory message store for chat functionality
 * Implements bilingual message storage without localStorage persistence
 */

import { ChatMessage, BilingualContent, MessageStore } from '../types'

/**
 * Generates a unique message ID using timestamp and random component
 */
function generateMessageId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `msg_${timestamp}_${random}`
}

/**
 * Creates an in-memory message store implementation
 */
export function createMessageStore(): MessageStore {
  let messages: ChatMessage[] = []

  return {
    get messages() {
      return [...messages] // Return a copy to prevent external mutation
    },

    add(
      from: 'agent' | 'user',
      content: BilingualContent,
      metadata?: ChatMessage['metadata']
    ): void {
      const message: ChatMessage = {
        id: generateMessageId(),
        from,
        content: {
          pt: content.pt.trim(),
          en: content.en.trim()
        },
        timestamp: Date.now(),
        metadata
      }

      messages.push(message)
    },

    clear(): void {
      messages = []
    },

    getById(id: string): ChatMessage | undefined {
      return messages.find(message => message.id === id)
    }
  }
}

/**
 * Global message store instance
 * This provides a singleton pattern for the application
 */
export const messageStore = createMessageStore()