import React, { useEffect, useRef, useState, useMemo } from 'react'
import { ChatMessage } from '../types'
import { AgentMessage } from './AgentMessage'
import { UserMessage } from './UserMessage'
import { TypingIndicator } from './TypingIndicator'
import styles from './MessageList.module.css'

interface MessageListProps {
  messages: ChatMessage[]
  loading: boolean
  locale: 'pt' | 'en'
}

const ITEM_HEIGHT = 80 // Approximate height per message
const CONTAINER_HEIGHT = 320 // Minimum chat height
const VIRTUALIZATION_THRESHOLD = 50 // Start virtualizing after 50 messages

export const MessageList: React.FC<MessageListProps> = ({ messages, loading, locale }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(CONTAINER_HEIGHT)
  const shouldVirtualize = messages.length > VIRTUALIZATION_THRESHOLD

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (containerRef.current) {
      const scrollToBottom = () => {
        requestAnimationFrame(() => {
          if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight
          }
        })
      }
      scrollToBottom()
    }
  }, [messages.length, loading])

  // Update container height on resize
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setContainerHeight(rect.height)
      }
    }

    updateHeight()
    window.addEventListener('resize', updateHeight)
    return () => window.removeEventListener('resize', updateHeight)
  }, [])

  // Handle scroll events for virtualization
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }

  // Calculate visible range for virtualization
  const visibleRange = useMemo(() => {
    if (!shouldVirtualize) {
      return { start: 0, end: messages.length }
    }

    const start = Math.floor(scrollTop / ITEM_HEIGHT)
    const visibleCount = Math.ceil(containerHeight / ITEM_HEIGHT)
    const end = Math.min(start + visibleCount + 5, messages.length) // Add buffer

    return { start: Math.max(0, start - 5), end } // Add buffer before
  }, [scrollTop, containerHeight, messages.length, shouldVirtualize])

  // Get visible messages
  const visibleMessages = useMemo(() => {
    if (!shouldVirtualize) {
      return messages
    }
    return messages.slice(visibleRange.start, visibleRange.end)
  }, [messages, visibleRange, shouldVirtualize])

  // Calculate total height and offset for virtualization
  const totalHeight = shouldVirtualize ? messages.length * ITEM_HEIGHT : 'auto'
  const offsetY = shouldVirtualize ? visibleRange.start * ITEM_HEIGHT : 0

  const renderMessage = (message: ChatMessage, index: number) => {
    const key = `${message.id}-${index}`
    
    if (message.from === 'agent') {
      return <AgentMessage key={key} message={message} locale={locale} />
    } else {
      return <UserMessage key={key} message={message} locale={locale} />
    }
  }

  return (
    <div 
      ref={containerRef}
      className={styles.messageList}
      onScroll={handleScroll}
      role="log"
      aria-live="polite"
      aria-label="Chat messages"
    >
      {shouldVirtualize && (
        <div style={{ height: totalHeight, position: 'relative' }}>
          <div 
            style={{ 
              transform: `translateY(${offsetY}px)`,
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0
            }}
          >
            {visibleMessages.map((message, index) => 
              renderMessage(message, visibleRange.start + index)
            )}
            {loading && (
              <TypingIndicator visible={true} locale={locale} />
            )}
          </div>
        </div>
      )}
      
      {!shouldVirtualize && (
        <>
          {messages.map((message, index) => renderMessage(message, index))}
          {loading && (
            <TypingIndicator visible={true} locale={locale} />
          )}
        </>
      )}
    </div>
  )
}