export type Locale = 'pt' | 'en'

export const t = (locale: Locale) => ({
  // Existing translations
  title: locale === 'pt' ? 'Wi‑Fi Kids' : 'Wi‑Fi Kids',
  subtitle: locale === 'pt'
    ? 'Peça uma sessão segura para acessar a internet.'
    : 'Request a safe internet session.',
  button: locale === 'pt' ? 'Acessar Internet' : 'Access Internet',
  installing: locale === 'pt' ? 'Instalando…' : 'Installing…',
  granted: locale === 'pt' ? 'Acesso liberado!' : 'Access granted!',
  denied: locale === 'pt' ? 'Acesso negado.' : 'Access denied.',
  question: locale === 'pt' ? 'Pergunta' : 'Question',
  answer_placeholder: locale === 'pt' ? 'Sua resposta…' : 'Your answer…',
  send: locale === 'pt' ? 'Enviar' : 'Send',

  // New chat interface translations
  greeting: locale === 'pt' 
    ? 'Olá! Sou seu assistente para internet. Como posso ajudar você hoje?' 
    : 'Hi! I\'m your internet assistant. How can I help you today?',
  
  typing: locale === 'pt' ? 'digitando...' : 'typing...',
  
  you: locale === 'pt' ? 'Você' : 'You',
  
  agent: locale === 'pt' ? 'Assistente' : 'Assistant',
  
  // Study completion question
  ask_done_study: locale === 'pt'
    ? 'Você já terminou suas tarefas de estudo?'
    : 'Have you finished your study tasks?',
  
  // Time-based messages using neutral format
  granted_for_x_min: (minutes: number) => locale === 'pt'
    ? `Liberado por ${minutes} min`
    : `Granted for ${minutes} min`,
  
  // Try again functionality
  try_again_later: locale === 'pt'
    ? 'Que tal tentar novamente mais tarde? Talvez seja um bom momento para outras atividades!'
    : 'How about trying again later? Maybe it\'s a good time for other activities!',
  
  try_again_button: locale === 'pt' ? 'Tentar Novamente' : 'Try Again',
  
  // Generic denial reason
  denied_reason_generic: locale === 'pt'
    ? 'Agora não é um bom momento para usar a internet.'
    : 'Now is not a good time to use the internet.',
  
  // Mock mode indicator
  simulated_badge: locale === 'pt' ? 'Simulação' : 'Simulation',
  
  simulation_mode_active: locale === 'pt'
    ? 'Modo simulação ativo para demonstração'
    : 'Simulation mode active for demonstration',
  
  // Error messages
  network_error: locale === 'pt'
    ? 'Ops! Não consegui me conectar. Vou usar o modo simulação.'
    : 'Oops! I couldn\'t connect. I\'ll use simulation mode.',
  
  invalid_input: locale === 'pt'
    ? 'Por favor, digite uma mensagem válida.'
    : 'Please type a valid message.',
  
  input_too_long: locale === 'pt'
    ? 'Sua mensagem é muito longa. Tente ser mais breve!'
    : 'Your message is too long. Try to be more brief!',
  
  forbidden_content: locale === 'pt'
    ? 'Conteúdo não permitido detectado.'
    : 'Forbidden content detected.',
  
  general_error: locale === 'pt'
    ? 'Algo deu errado. Tente novamente.'
    : 'Something went wrong. Please try again.',
  
  browser_not_supported: locale === 'pt'
    ? 'Seu navegador não suporta todos os recursos. Algumas funcionalidades podem não funcionar.'
    : 'Your browser doesn\'t support all features. Some functionality may not work.',
  
  // Error boundary messages
  error_boundary_title: locale === 'pt'
    ? 'Ops! Algo deu errado'
    : 'Oops! Something went wrong',
  
  error_boundary_message: locale === 'pt'
    ? 'Não se preocupe, você pode tentar novamente ou recarregar a página.'
    : 'Don\'t worry, you can try again or reload the page.',
  
  reload_page: locale === 'pt'
    ? 'Recarregar Página'
    : 'Reload Page',
  
  // Network and connection errors
  connection_failed: locale === 'pt'
    ? 'Falha na conexão. Verificando modo simulação...'
    : 'Connection failed. Checking simulation mode...',
  
  timeout_error: locale === 'pt'
    ? 'A solicitação demorou muito. Usando modo simulação.'
    : 'Request took too long. Using simulation mode.',
  
  // Chat input placeholder
  chat_placeholder: locale === 'pt'
    ? 'Digite sua mensagem...'
    : 'Type your message...',
  
  // Accessibility labels
  language_toggle_label: locale === 'pt'
    ? 'Alternar idioma'
    : 'Toggle language',
  
  portuguese_label: 'Português',
  english_label: 'English',
  
  chat_input_label: locale === 'pt'
    ? 'Campo de mensagem do chat'
    : 'Chat message input',
  
  send_message_button: locale === 'pt'
    ? 'Enviar mensagem'
    : 'Send message'
})

// Helper function for time formatting with proper pluralization
export const formatTime = (minutes: number, locale: Locale): string => {
  // Use neutral format to avoid PT/EN pluralization complexity
  return locale === 'pt' ? `${minutes} min` : `${minutes} min`
}

// Helper function for number formatting if needed in the future
export const formatNumber = (num: number, locale: Locale): string => {
  return new Intl.NumberFormat(locale === 'pt' ? 'pt-BR' : 'en-US').format(num)
}
