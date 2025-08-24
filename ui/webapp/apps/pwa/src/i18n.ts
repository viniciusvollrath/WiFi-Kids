export type Locale = 'pt' | 'en'

export const t = (locale: Locale) => ({
  // Existing translations
  title: locale === 'pt' ? 'Wi‑Fi Kids' : 'Wi‑Fi Kids',
  subtitle: locale === 'pt'
    ? 'Peça uma sessão segura para acessar a internet.'
    : 'Request a safe internet session.',
  button: locale === 'pt' ? 'Acessar Internet' : 'Access Internet',
  installing: locale === 'pt' ? 'Instalando…' : 'Installing…',
  // Success messages by persona
  granted_tutor: locale === 'pt' ? 'Excelente trabalho! Acesso liberado!' : 'Excellent work! Access granted!',
  granted_maternal: locale === 'pt' ? 'Que orgulho! Você conseguiu! Acesso liberado!' : 'So proud! You did it! Access granted!',
  granted_general: locale === 'pt' ? 'Parabéns! Acesso liberado!' : 'Congratulations! Access granted!',
  
  // Failure messages by persona
  denied_tutor: locale === 'pt' ? 'Não foi dessa vez. Vamos revisar e tentar novamente!' : 'Not this time. Let\'s review and try again!',
  denied_maternal: locale === 'pt' ? 'Quase lá, querido! Que tal tentarmos mais uma vez?' : 'Almost there, sweetie! How about we try once more?',
  denied_general: locale === 'pt' ? 'Acesso negado. Tente novamente.' : 'Access denied. Try again.',
  question: locale === 'pt' ? 'Pergunta' : 'Question',
  answer_placeholder: locale === 'pt' ? 'Sua resposta…' : 'Your answer…',
  send: locale === 'pt' ? 'Enviar' : 'Send',

  // Educational greetings by persona
  greeting_tutor: locale === 'pt' 
    ? 'Olá! Sou seu tutor virtual. Para acessar a internet, você precisa responder algumas perguntas educativas. Vamos começar?' 
    : 'Hi! I\'m your virtual tutor. To access the internet, you need to answer some educational questions. Let\'s start?',
  
  greeting_maternal: locale === 'pt'
    ? 'Oi querido! Para usar a internet hoje, que tal mostrarmos o que você aprendeu? Tenho algumas perguntas interessantes!'
    : 'Hi sweetie! To use the internet today, how about showing what you\'ve learned? I have some interesting questions!',
  
  greeting_general: locale === 'pt'
    ? 'Olá! Para liberar o acesso à internet, você precisa completar um pequeno desafio educativo.'
    : 'Hello! To unlock internet access, you need to complete a small educational challenge.',
  
  typing: locale === 'pt' ? 'preparando pergunta...' : 'preparing question...',
  
  you: locale === 'pt' ? 'Você' : 'You',
  
  agent_tutor: locale === 'pt' ? 'Prof. AI' : 'Prof. AI',
  agent_maternal: locale === 'pt' ? 'Mamãe AI' : 'Mom AI',
  agent_general: locale === 'pt' ? 'Assistente' : 'Assistant',
  
  // Challenge instructions and prompts
  challenge_instructions: locale === 'pt'
    ? 'Responda às perguntas abaixo para ganhar acesso à internet:'
    : 'Answer the questions below to earn internet access:',
  
  challenge_ready: locale === 'pt'
    ? 'Pronto para o desafio? Clique em "Começar" quando estiver preparado!'
    : 'Ready for the challenge? Click "Start" when you\'re prepared!',
  
  challenge_start: locale === 'pt' ? 'Começar Desafio' : 'Start Challenge',
  
  // Progress indicators
  progress_questions: (current: number, total: number) => locale === 'pt'
    ? `Pergunta ${current} de ${total}`
    : `Question ${current} of ${total}`,
  
  progress_time_spent: (minutes: number) => locale === 'pt'
    ? `Tempo: ${minutes} min`
    : `Time: ${minutes} min`,
  
  attempts_remaining: (attempts: number) => locale === 'pt'
    ? `${attempts} tentativas restantes`
    : `${attempts} attempts remaining`,
  
  attempts_last_chance: locale === 'pt'
    ? 'Última tentativa! Pense bem antes de responder.'
    : 'Last chance! Think carefully before answering.',
  
  // Subject-specific encouragement
  subject_math: locale === 'pt' ? 'Matemática' : 'Math',
  subject_history: locale === 'pt' ? 'História' : 'History',
  subject_geography: locale === 'pt' ? 'Geografia' : 'Geography',
  subject_science: locale === 'pt' ? 'Ciências' : 'Science',
  subject_language: locale === 'pt' ? 'Português' : 'English',
  subject_general: locale === 'pt' ? 'Conhecimentos Gerais' : 'General Knowledge',
  
  // Study completion question  
  ask_done_study: locale === 'pt'
    ? 'Você já terminou suas tarefas de estudo?'
    : 'Have you finished your study tasks?',
  
  // Time-based messages using neutral format
  granted_for_x_min: (minutes: number) => locale === 'pt'
    ? `Liberado por ${minutes} min`
    : `Granted for ${minutes} min`,
  
  // Persona-specific feedback and encouragement
  feedback_tutor_correct: locale === 'pt'
    ? 'Correto! Você demonstrou conhecimento sólido neste tópico.'
    : 'Correct! You demonstrated solid knowledge on this topic.',
  
  feedback_tutor_incorrect: locale === 'pt'
    ? 'Não está correto. Vamos revisar este conceito juntos.'
    : 'That\'s not correct. Let\'s review this concept together.',
  
  feedback_tutor_partial: locale === 'pt'
    ? 'Você está no caminho certo! Sua resposta demonstra compreensão parcial.'
    : 'You\'re on the right track! Your answer shows partial understanding.',
  
  feedback_maternal_correct: locale === 'pt'
    ? 'Muito bem, meu amor! Você está aprendendo tanto!'
    : 'Very good, my love! You\'re learning so much!',
  
  feedback_maternal_incorrect: locale === 'pt'
    ? 'Não se preocupe, querido. Todo mundo erra às vezes. Vamos tentar de novo!'
    : 'Don\'t worry, dear. Everyone makes mistakes sometimes. Let\'s try again!',
  
  feedback_maternal_partial: locale === 'pt'
    ? 'Você está quase lá! Mamãe está orgulhosa do seu esforço!'
    : 'You\'re almost there! Mommy is proud of your effort!',
  
  // Try again functionality
  try_again_later: locale === 'pt'
    ? 'Que tal estudar um pouco mais e tentar novamente? O conhecimento é a chave!'
    : 'How about studying a bit more and trying again? Knowledge is the key!',
  
  try_again_button: locale === 'pt' ? 'Tentar Novamente' : 'Try Again',
  
  // Educational motivation
  keep_learning: locale === 'pt'
    ? 'Continue aprendendo! Cada pergunta é uma oportunidade de crescer.'
    : 'Keep learning! Every question is an opportunity to grow.',
  
  study_time: locale === 'pt'
    ? 'Talvez seja um bom momento para revisar seus estudos!'
    : 'Maybe it\'s a good time to review your studies!',
  
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
    ? 'Ops! Não consegui me conectar com o sistema. Usando modo de demonstração.'
    : 'Oops! I couldn\'t connect to the system. Using demo mode.',
  
  invalid_input: locale === 'pt'
    ? 'Por favor, digite uma resposta válida para a pergunta.'
    : 'Please type a valid answer to the question.',
  
  input_too_long: locale === 'pt'
    ? 'Sua resposta é muito longa. Tente ser mais conciso!'
    : 'Your answer is too long. Try to be more concise!',
  
  empty_answer: locale === 'pt'
    ? 'Não esqueça de responder à pergunta!'
    : 'Don\'t forget to answer the question!',
  
  invalid_multiple_choice: locale === 'pt'
    ? 'Por favor, escolha uma das opções (A, B, C ou D).'
    : 'Please choose one of the options (A, B, C or D).',
  
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
    ? 'Digite sua resposta...'
    : 'Type your answer...',
  
  answer_placeholder_multiple: locale === 'pt'
    ? 'Ex: A, B, C ou 1: A, 2: B, 3: C...'
    : 'Ex: A, B, C or 1: A, 2: B, 3: C...',
  
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

// Helper functions for persona-specific messages
export const getPersonaGreeting = (persona: 'tutor' | 'maternal' | 'general', locale: Locale): string => {
  const translations = t(locale)
  switch (persona) {
    case 'tutor':
      return translations.greeting_tutor
    case 'maternal':
      return translations.greeting_maternal
    case 'general':
      return translations.greeting_general
    default:
      return translations.greeting_general
  }
}

export const getPersonaAgent = (persona: 'tutor' | 'maternal' | 'general', locale: Locale): string => {
  const translations = t(locale)
  switch (persona) {
    case 'tutor':
      return translations.agent_tutor
    case 'maternal':
      return translations.agent_maternal
    case 'general':
      return translations.agent_general
    default:
      return translations.agent_general
  }
}

export const getPersonaGranted = (persona: 'tutor' | 'maternal' | 'general', locale: Locale): string => {
  const translations = t(locale)
  switch (persona) {
    case 'tutor':
      return translations.granted_tutor
    case 'maternal':
      return translations.granted_maternal
    case 'general':
      return translations.granted_general
    default:
      return translations.granted_general
  }
}

export const getPersonaDenied = (persona: 'tutor' | 'maternal' | 'general', locale: Locale): string => {
  const translations = t(locale)
  switch (persona) {
    case 'tutor':
      return translations.denied_tutor
    case 'maternal':
      return translations.denied_maternal
    case 'general':
      return translations.denied_general
    default:
      return translations.denied_general
  }
}

export const getPersonaFeedback = (
  persona: 'tutor' | 'maternal' | 'general', 
  result: 'correct' | 'incorrect' | 'partial',
  locale: Locale
): string => {
  const translations = t(locale)
  
  // Use direct property access instead of dynamic keys for better type safety
  if (persona === 'tutor') {
    switch (result) {
      case 'correct': return translations.feedback_tutor_correct
      case 'incorrect': return translations.feedback_tutor_incorrect
      case 'partial': return translations.feedback_tutor_partial
    }
  } else if (persona === 'maternal') {
    switch (result) {
      case 'correct': return translations.feedback_maternal_correct
      case 'incorrect': return translations.feedback_maternal_incorrect
      case 'partial': return translations.feedback_maternal_partial
    }
  }
  
  // Default to tutor feedback for general persona
  switch (result) {
    case 'correct': return translations.feedback_tutor_correct
    case 'incorrect': return translations.feedback_tutor_incorrect
    case 'partial': return translations.feedback_tutor_partial
    default: return translations.general_error
  }
}
