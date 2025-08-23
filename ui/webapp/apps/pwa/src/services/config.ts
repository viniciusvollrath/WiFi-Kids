/**
 * Configuration service for WiFi-Kids PWA
 * Manages environment variables and runtime settings
 */

export interface AppConfig {
  // API Configuration
  apiUrl: string
  apiTimeout: number
  mockMode: boolean
  
  // Persona Configuration
  defaultPersona: 'tutor' | 'maternal' | 'general'
  availablePersonas: Array<'tutor' | 'maternal' | 'general'>
  
  // Subject Configuration
  subjects: string[]
  
  // Challenge Configuration
  maxAttempts: number
  challengeTimeout: number
  
  // UI Configuration
  showPersonaSelector: boolean
  showDebugInfo: boolean
  defaultLocale: 'pt' | 'en'
  
  // Router Configuration
  routerId: string
  defaultAccessMinutes: number
}

class ConfigService {
  private config: AppConfig

  constructor() {
    this.config = this.loadConfig()
  }

  private loadConfig(): AppConfig {
    // Helper function to get environment variable with fallback
    const getEnvVar = (key: string, fallback: string): string => {
      return import.meta.env[key] || fallback
    }

    // Helper function to get boolean environment variable
    const getEnvBool = (key: string, fallback: boolean): boolean => {
      const value = import.meta.env[key]
      if (value === undefined) return fallback
      return value === 'true' || value === '1'
    }

    // Helper function to get number environment variable
    const getEnvNumber = (key: string, fallback: number): number => {
      const value = import.meta.env[key]
      if (value === undefined) return fallback
      const parsed = parseInt(value, 10)
      return isNaN(parsed) ? fallback : parsed
    }

    // Helper function to parse comma-separated values
    const parseList = (value: string): string[] => {
      return value.split(',').map(item => item.trim()).filter(Boolean)
    }

    const apiUrl = getEnvVar('VITE_API_URL', 'http://localhost:8000')
    const defaultPersona = getEnvVar('VITE_DEFAULT_PERSONA', 'tutor') as 'tutor' | 'maternal' | 'general'
    const subjects = parseList(getEnvVar('VITE_SUBJECTS', 'math,history,geography,science,language,general'))
    const defaultLocale = getEnvVar('VITE_DEFAULT_LOCALE', 'pt') as 'pt' | 'en'

    return {
      // API Configuration
      apiUrl,
      apiTimeout: getEnvNumber('VITE_API_TIMEOUT', 10000),
      mockMode: getEnvBool('VITE_MOCK', false),

      // Persona Configuration
      defaultPersona,
      availablePersonas: ['tutor', 'maternal', 'general'],

      // Subject Configuration
      subjects,

      // Challenge Configuration
      maxAttempts: getEnvNumber('VITE_MAX_ATTEMPTS', 3),
      challengeTimeout: getEnvNumber('VITE_CHALLENGE_TIMEOUT', 300000), // 5 minutes

      // UI Configuration
      showPersonaSelector: getEnvBool('VITE_SHOW_PERSONA_SELECTOR', false),
      showDebugInfo: getEnvBool('VITE_SHOW_DEBUG_INFO', false),
      defaultLocale,

      // Router Configuration
      routerId: getEnvVar('VITE_ROUTER_ID', 'pwa-router'),
      defaultAccessMinutes: getEnvNumber('VITE_DEFAULT_ACCESS_MINUTES', 30)
    }
  }

  // Public API to get configuration values
  get(): AppConfig {
    return { ...this.config } // Return a copy to prevent external mutations
  }

  // Get specific configuration values
  getApiUrl(): string {
    return this.config.apiUrl
  }

  getApiTimeout(): number {
    return this.config.apiTimeout
  }

  isMockMode(): boolean {
    return this.config.mockMode
  }

  getDefaultPersona(): 'tutor' | 'maternal' | 'general' {
    return this.config.defaultPersona
  }

  getAvailablePersonas(): Array<'tutor' | 'maternal' | 'general'> {
    return [...this.config.availablePersonas]
  }

  getSubjects(): string[] {
    return [...this.config.subjects]
  }

  getMaxAttempts(): number {
    return this.config.maxAttempts
  }

  getChallengeTimeout(): number {
    return this.config.challengeTimeout
  }

  shouldShowPersonaSelector(): boolean {
    return this.config.showPersonaSelector
  }

  shouldShowDebugInfo(): boolean {
    return this.config.showDebugInfo
  }

  getDefaultLocale(): 'pt' | 'en' {
    return this.config.defaultLocale
  }

  getRouterId(): string {
    return this.config.routerId
  }

  getDefaultAccessMinutes(): number {
    return this.config.defaultAccessMinutes
  }

  // Update configuration at runtime (useful for testing or dynamic updates)
  updateConfig(updates: Partial<AppConfig>): void {
    this.config = { ...this.config, ...updates }
  }

  // Validate persona
  isValidPersona(persona: string): persona is 'tutor' | 'maternal' | 'general' {
    return this.config.availablePersonas.includes(persona as any)
  }

  // Validate locale
  isValidLocale(locale: string): locale is 'pt' | 'en' {
    return locale === 'pt' || locale === 'en'
  }

  // Get localized subject names
  getLocalizedSubjects(locale: 'pt' | 'en'): Record<string, string> {
    const translations: Record<string, Record<string, string>> = {
      math: { pt: 'Matemática', en: 'Math' },
      history: { pt: 'História', en: 'History' },
      geography: { pt: 'Geografia', en: 'Geography' },
      science: { pt: 'Ciências', en: 'Science' },
      language: { pt: 'Português', en: 'English' },
      general: { pt: 'Conhecimentos Gerais', en: 'General Knowledge' }
    }

    const result: Record<string, string> = {}
    this.config.subjects.forEach(subject => {
      result[subject] = translations[subject]?.[locale] || subject
    })
    
    return result
  }

  // Development helpers
  isDevelopment(): boolean {
    return import.meta.env.MODE === 'development'
  }

  isProduction(): boolean {
    return import.meta.env.MODE === 'production'
  }

  getVersion(): string {
    // Use build-time injected version if available
    return (globalThis as any).__VERSION__ || import.meta.env.VITE_VERSION || '0.1.0'
  }

  getBuildTime(): string {
    // Use build-time injected timestamp if available
    return (globalThis as any).__BUILD_TIME__ || import.meta.env.VITE_BUILD_TIME || new Date().toISOString()
  }
}

// Export singleton instance
export const config = new ConfigService()

// Export the class for testing
export default ConfigService