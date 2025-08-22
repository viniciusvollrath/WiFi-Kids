import { describe, it, expect } from 'vitest'
import { 
  sanitizeInput, 
  validateChatInput, 
  processUserInput, 
  escapeHtml, 
  isSafeForDisplay 
} from './inputValidation'

describe('sanitizeInput', () => {
  it('should trim whitespace', () => {
    expect(sanitizeInput('  hello world  ')).toBe('hello world')
    expect(sanitizeInput('\n\t  test  \n\t')).toBe('test')
  })

  it('should remove control characters', () => {
    expect(sanitizeInput('hello\x00world')).toBe('helloworld')
    expect(sanitizeInput('test\x1Fstring')).toBe('teststring')
    expect(sanitizeInput('data\x7Ftest')).toBe('datatest')
  })

  it('should preserve emojis and Unicode characters', () => {
    expect(sanitizeInput('Hello 😊 world')).toBe('Hello 😊 world')
    expect(sanitizeInput('Olá 🇧🇷 mundo')).toBe('Olá 🇧🇷 mundo')
    expect(sanitizeInput('Test 🎉🎊✨')).toBe('Test 🎉🎊✨')
  })

  it('should remove HTML tags', () => {
    expect(sanitizeInput('<script>alert("xss")</script>')).toBe('alert("xss")')
    expect(sanitizeInput('Hello <b>world</b>')).toBe('Hello world')
    expect(sanitizeInput('<img src="x" onerror="alert(1)">')).toBe('')
  })

  it('should remove javascript: URLs', () => {
    expect(sanitizeInput('javascript:alert(1)')).toBe('alert(1)')
    expect(sanitizeInput('JAVASCRIPT:void(0)')).toBe('void(0)')
  })

  it('should remove event handlers', () => {
    expect(sanitizeInput('onclick=alert(1)')).toBe('')
    expect(sanitizeInput('onload=malicious()')).toBe('')
    expect(sanitizeInput('ONMOUSEOVER=bad()')).toBe('')
    expect(sanitizeInput('text onclick="alert(1)" more')).toBe('text  more')
  })

  it('should handle non-string input', () => {
    expect(sanitizeInput(null as any)).toBe('')
    expect(sanitizeInput(undefined as any)).toBe('')
    expect(sanitizeInput(123 as any)).toBe('')
  })

  it('should remove null bytes', () => {
    expect(sanitizeInput('hello\0world')).toBe('helloworld')
  })
})

describe('validateChatInput', () => {
  it('should validate normal messages', () => {
    const result = validateChatInput('Hello world')
    expect(result.isValid).toBe(true)
    expect(result.sanitized).toBe('Hello world')
    expect(result.error).toBeUndefined()
  })

  it('should reject empty messages', () => {
    const result = validateChatInput('')
    expect(result.isValid).toBe(false)
    expect(result.error).toContain('valid message')
  })

  it('should reject whitespace-only messages', () => {
    const result = validateChatInput('   \n\t   ')
    expect(result.isValid).toBe(false)
    expect(result.error).toContain('valid message')
  })

  it('should reject messages that become empty after sanitization', () => {
    const result = validateChatInput('<script></script>')
    expect(result.isValid).toBe(false)
    expect(result.error).toContain('valid message')
  })

  it('should reject messages over 200 characters', () => {
    const longMessage = 'a'.repeat(201)
    const result = validateChatInput(longMessage)
    expect(result.isValid).toBe(false)
    expect(result.sanitized).toBe('a'.repeat(200))
    expect(result.error).toContain('too long')
  })

  it('should accept messages exactly 200 characters', () => {
    const message = 'a'.repeat(200)
    const result = validateChatInput(message)
    expect(result.isValid).toBe(true)
    expect(result.sanitized).toBe(message)
  })

  it('should reject suspicious patterns', () => {
    const maliciousInputs = [
      'data:text/html,<script>alert(1)</script>',
      'vbscript:msgbox(1)',
      'javascript:alert(1)',
      'eval(malicious_code)',
      'expression(alert(1))'
    ]

    maliciousInputs.forEach(input => {
      const result = validateChatInput(input)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Forbidden content')
    })
  })

  it('should reject HTML content appropriately', () => {
    // Test inputs that should be caught by suspicious patterns
    const suspiciousInputs = [
      '<script>alert(1)</script>',
      '<iframe src="evil.com"></iframe>',
      '<object data="malicious"></object>',
      '<embed src="bad.swf">'
    ]

    suspiciousInputs.forEach(input => {
      const result = validateChatInput(input)
      expect(result.isValid).toBe(false)
      // Check if it's caught by suspicious patterns or becomes empty after sanitization
      expect(result.error).toMatch(/Forbidden content|valid message/)
    })
  })

  it('should provide Portuguese error messages', () => {
    const result = validateChatInput('', 'pt')
    expect(result.error).toContain('mensagem válida')
  })

  it('should provide English error messages', () => {
    const result = validateChatInput('', 'en')
    expect(result.error).toContain('valid message')
  })

  it('should handle emojis correctly', () => {
    const result = validateChatInput('Sim! 😊 Terminei meus estudos 📚✅')
    expect(result.isValid).toBe(true)
    expect(result.sanitized).toBe('Sim! 😊 Terminei meus estudos 📚✅')
  })
})

describe('processUserInput', () => {
  it('should be an alias for validateChatInput', () => {
    const input = 'test message'
    const result1 = processUserInput(input, 'en')
    const result2 = validateChatInput(input, 'en')
    
    expect(result1).toEqual(result2)
  })
})

describe('escapeHtml', () => {
  it('should escape HTML characters', () => {
    expect(escapeHtml('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;&#x2F;script&gt;')
    expect(escapeHtml('Hello & goodbye')).toBe('Hello &amp; goodbye')
    expect(escapeHtml('"quoted text"')).toBe('&quot;quoted text&quot;')
  })

  it('should preserve normal text', () => {
    expect(escapeHtml('Hello world')).toBe('Hello world')
    expect(escapeHtml('Normal text 123')).toBe('Normal text 123')
  })

  it('should handle emojis', () => {
    expect(escapeHtml('Hello 😊 world')).toBe('Hello 😊 world')
  })
})

describe('isSafeForDisplay', () => {
  it('should return true for safe text', () => {
    expect(isSafeForDisplay('Hello world')).toBe(true)
    expect(isSafeForDisplay('Normal message 123')).toBe(true)
    expect(isSafeForDisplay('Emojis are safe 😊')).toBe(true)
  })

  it('should return false for dangerous content', () => {
    expect(isSafeForDisplay('<script>alert(1)</script>')).toBe(false)
    expect(isSafeForDisplay('javascript:alert(1)')).toBe(false)
    expect(isSafeForDisplay('data:text/html,<h1>test</h1>')).toBe(false)
    expect(isSafeForDisplay('onclick=alert(1)')).toBe(false)
  })
})

describe('Edge cases and malicious input tests', () => {
  it('should handle various XSS attempts', () => {
    const xssAttempts = [
      'javascript:/*--></title></style></textarea></script></xmp><svg/onload=alert(1)>',
      'data:text/html,<script>alert(1)</script>',
      'vbscript:msgbox("xss")',
      'eval(atob("YWxlcnQoMSk="))',
      'expression(alert(1))'
    ]

    xssAttempts.forEach(attempt => {
      const result = validateChatInput(attempt)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Forbidden content')
    })
  })

  it('should sanitize HTML content safely', () => {
    const htmlAttempts = [
      '<img src=x onerror=alert(1)>',
      '<svg onload=alert(1)>',
      '<iframe src="evil.com"></iframe>',
      '"><script>alert(1)</script>',
      "';alert(1);//",
      '<script>document.cookie</script>',
      '<object data="malicious"></object>',
      '<embed src="bad.swf">',
      '<img src="x" onerror="malicious()">'
    ]

    htmlAttempts.forEach(attempt => {
      const result = validateChatInput(attempt)
      // These should either be rejected (if they become empty) or sanitized safely
      if (result.isValid) {
        expect(isSafeForDisplay(result.sanitized)).toBe(true)
      } else {
        // Should be rejected with appropriate error message
        expect(result.error).toBeDefined()
      }
    })
  })

  it('should handle Unicode and international characters safely', () => {
    const internationalInputs = [
      'Olá, como está? 🇧🇷',
      'こんにちは世界',
      'Здравствуй мир',
      'مرحبا بالعالم',
      '你好世界',
      'Γεια σας κόσμε'
    ]

    internationalInputs.forEach(input => {
      const result = validateChatInput(input)
      expect(result.isValid).toBe(true)
      expect(result.sanitized).toBe(input)
    })
  })

  it('should handle mixed content safely', () => {
    const mixedInputs = [
      'Normal text <script>alert(1)</script> more text',
      'Hello javascript:alert(1) world',
      'Test <img src=x onerror=alert(1)> content'
    ]

    mixedInputs.forEach(input => {
      const result = validateChatInput(input)
      // Should either be rejected or have dangerous parts removed
      if (result.isValid) {
        expect(isSafeForDisplay(result.sanitized)).toBe(true)
      }
    })
  })

  it('should handle boundary conditions', () => {
    // Test exactly at limits
    expect(validateChatInput('a'.repeat(200)).isValid).toBe(true)
    expect(validateChatInput('a'.repeat(201)).isValid).toBe(false)
    
    // Test with control characters at boundaries
    expect(validateChatInput('\x00' + 'a'.repeat(199)).sanitized).toBe('a'.repeat(199))
    expect(validateChatInput('a'.repeat(199) + '\x1F').sanitized).toBe('a'.repeat(199))
  })
})