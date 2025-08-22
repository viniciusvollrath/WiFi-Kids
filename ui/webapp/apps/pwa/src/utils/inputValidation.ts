/**
 * Input validation and sanitization utilities
 * Prevents XSS attacks and ensures safe user input processing
 */

export interface ValidationResult {
  isValid: boolean
  sanitized: string
  error?: string
}

/**
 * Sanitizes user input by removing potentially dangerous content
 * while preserving emojis and normal text
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return ''
  }

  // Trim whitespace
  let sanitized = input.trim()

  // Remove control characters (0x00-0x1F and 0x7F-0x9F) but preserve emojis
  // This regex removes ASCII control characters while keeping Unicode characters (including emojis)
  sanitized = sanitized.replace(/[\x00-\x1F\x7F-\x9F]/g, '')

  // Remove any HTML-like content to prevent XSS
  sanitized = sanitized.replace(/<[^>]*>/g, '')

  // Remove script-like content
  sanitized = sanitized.replace(/javascript:/gi, '')
  
  // Remove event handlers (more comprehensive pattern)
  sanitized = sanitized.replace(/on\w+\s*=\s*[^>\s]*/gi, '')

  // Remove null bytes and other dangerous characters
  sanitized = sanitized.replace(/\0/g, '')

  return sanitized
}

/**
 * Validates user input according to chat requirements
 */
export function validateChatInput(input: string, locale: 'pt' | 'en' = 'en'): ValidationResult {
  // First sanitize the input
  const sanitized = sanitizeInput(input)

  // Check if input is empty after sanitization
  if (sanitized.length === 0) {
    return {
      isValid: false,
      sanitized,
      error: locale === 'pt' 
        ? 'Por favor, digite uma mensagem válida.'
        : 'Please type a valid message.'
    }
  }

  // Check length limit (200 characters)
  if (sanitized.length > 200) {
    return {
      isValid: false,
      sanitized: sanitized.substring(0, 200),
      error: locale === 'pt'
        ? 'Sua mensagem é muito longa. Tente ser mais breve!'
        : 'Your message is too long. Try to be more brief!'
    }
  }

  // Check for suspicious patterns that might indicate malicious input
  // Only check the original input, not the sanitized version
  const suspiciousPatterns = [
    /data:/i,
    /vbscript:/i,
    /javascript:/i,
    /<script/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /eval\s*\(/i,
    /expression\s*\(/i
  ]

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(input)) {
      return {
        isValid: false,
        sanitized: '',
        error: locale === 'pt'
          ? 'Conteúdo não permitido detectado.'
          : 'Forbidden content detected.'
      }
    }
  }

  return {
    isValid: true,
    sanitized
  }
}

/**
 * Validates and sanitizes user input for display
 * This is the main function to use throughout the app
 */
export function processUserInput(input: string, locale: 'pt' | 'en' = 'en'): ValidationResult {
  return validateChatInput(input, locale)
}

/**
 * Escapes HTML characters to prevent XSS when displaying user content
 * Use this when you need to display user input in HTML context
 */
export function escapeHtml(text: string): string {
  const htmlEscapes: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  }
  
  return text.replace(/[&<>"'/]/g, (match) => htmlEscapes[match])
}

/**
 * Checks if a string contains only safe characters for display
 */
export function isSafeForDisplay(text: string): boolean {
  // Check for potentially dangerous patterns
  const dangerousPatterns = [
    /<[^>]*>/,  // HTML tags
    /javascript:/i,
    /data:/i,
    /vbscript:/i,
    /on\w+\s*=/i  // Event handlers
  ]

  return !dangerousPatterns.some(pattern => pattern.test(text))
}