# Documentação Wi-Fi Kids - WebApp e Integração API

## Visão Geral

O **Wi-Fi Kids** é um sistema de controle parental para roteadores que funciona através de um portal cativo. O projeto consiste em:

- **PWA (Progressive Web App)**: Interface bilíngue (PT/EN) onde crianças solicitam acesso à internet
- **Backend API**: Serviço Node.js que processa decisões usando LangChain/GPT-5 e integra com OpenNDS
- **Integração OpenWRT**: Funciona com roteadores OpenWRT + OpenNDS para controle de acesso

## Arquitetura do Sistema

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Criança       │    │   PWA React     │    │  Backend API    │
│   (Dispositivo) │───▶│   (Frontend)    │───▶│   (Node.js)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                                                       ▼
                                              ┌─────────────────┐
                                              │   LangChain     │
                                              │   (GPT-5)       │
                                              └─────────────────┘
                                                       │
                                                       ▼
                                              ┌─────────────────┐
                                              │   OpenNDS       │
                                              │   (Roteador)    │
                                              └─────────────────┘
```

## Tecnologias Utilizadas

### Frontend (PWA)
- **React 18** com TypeScript
- **Vite** como bundler
- **CSS Modules** para estilização
- **Service Worker** para funcionalidade offline
- **Vitest** para testes

### Backend (API)
- **Node.js** com Express
- **TypeScript** para tipagem
- **LangChain** para integração com GPT-5
- **Zod** para validação de dados
- **dotenv** para configuração

## Estrutura do Projeto

```
apps/
├── pwa/                    # Progressive Web App
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   ├── services/       # Serviços (API, estado)
│   │   ├── styles/         # Estilos CSS
│   │   ├── types/          # Definições TypeScript
│   │   ├── utils/          # Utilitários
│   │   ├── App.tsx         # Componente principal
│   │   ├── main.tsx        # Ponto de entrada
│   │   └── i18n.ts         # Internacionalização
│   ├── public/             # Arquivos estáticos
│   └── package.json
│
└── backend/                # API Backend
    ├── src/
    │   ├── index.ts        # Servidor Express
    │   ├── service.ts      # Lógica de negócio
    │   ├── langchain.ts    # Integração LangChain
    │   └── codex_prompt.txt # Prompt do sistema
    └── package.json
```

## Como Funciona o Fluxo

### 1. Acesso Inicial
1. Criança conecta no Wi-Fi
2. Roteador redireciona para o PWA (portal cativo)
3. PWA carrega interface bilíngue

### 2. Solicitação de Acesso
1. Criança clica em "Acessar Internet / Access Internet"
2. PWA envia requisição para `/api/session/request`
3. Backend consulta políticas e contexto atual
4. LangChain/GPT-5 toma decisão baseada nas regras

### 3. Tipos de Resposta
- **ALLOW**: Acesso liberado por X minutos
- **DENY**: Acesso negado com explicação
- **ASK_MORE**: Pergunta adicional (ex: "Terminou a lição?")

### 4. Execução da Decisão
- Se ALLOW: Backend chama OpenNDS para liberar acesso
- PWA mostra resultado para a criança

## Configuração e Instalação

### Pré-requisitos
- Node.js 18+
- pnpm (recomendado) ou npm
- Docker (opcional)

### Instalação Local

1. **Clone e instale dependências:**
```bash
git clone <repositorio>
cd wifi-kids
pnpm i -r
```

2. **Configure o backend:**
```bash
cp apps/backend/.env.example apps/backend/.env
# Edite .env com suas chaves da OpenAI
```

3. **Execute em desenvolvimento:**

Terminal 1 (Backend):
```bash
cd apps/backend
pnpm dev
```

Terminal 2 (PWA):
```bash
cd apps/pwa
pnpm dev
```

### Usando Docker
```bash
docker compose up --build
```

## Integração com API

### Endpoint Principal: `/api/session/request`

**Método:** POST  
**Content-Type:** application/json

**Payload:**
```json
{
  "device_id": "string (min 16 chars)",
  "locale": "pt" | "en",
  "answer": "string | null"
}
```

**Resposta:**
```json
{
  "decision": "ALLOW" | "DENY" | "ASK_MORE",
  "message_pt": "Mensagem em português",
  "message_en": "Message in English",
  "allowed_minutes": 30,
  "question_pt": "Pergunta em português?",
  "question_en": "Question in English?",
  "metadata": {
    "reason": "study_time_check",
    "persona": "tutor"
  }
}
```

### Endpoint Auxiliar: `/api/ip`

**Método:** GET  
**Retorna:** IP do cliente (texto simples)

## Configuração de Políticas

As políticas são configuradas via variáveis de ambiente no backend:

```env
# Persona do agente (tutor, maternal, general)
POLICY_PERSONA=tutor

# Máximo diário em minutos
POLICY_DAILY_MAX=120

# Quotas por período (manhã:tarde:noite)
POLICY_PERIOD_QUOTAS=morning:30,afternoon:45,night:30

# Janelas de bloqueio (formato HH:MM-HH:MM)
POLICY_BLOCK_WINDOWS=21:00-07:00

# Janelas de estudo (formato HH:MM-HH:MM)
POLICY_STUDY_WINDOWS=18:00-20:00

# Configuração OpenNDS
OPENNDS_GATEWAY=http://127.0.0.1:2050
OPENNDS_GRANT_PATH=/fas/gateway
```

## Componentes Principais do PWA

### 1. App.tsx
- Componente raiz da aplicação
- Gerencia estado global e máquina de estados
- Controla fluxo de interação

### 2. ChatPanel
- Interface de chat com o agente
- Exibe mensagens bilíngues
- Gerencia input do usuário

### 3. Serviços

#### agentService
- Comunicação com a API backend
- Modo simulação para desenvolvimento
- Tratamento de erros de rede

#### messageStore
- Armazenamento de mensagens do chat
- Suporte a conteúdo bilíngue
- Persistência durante a sessão

#### stateMachine
- Controla estados da aplicação (IDLE → REQUESTING → ALLOW/DENY/ASK_MORE)
- Valida transições de estado
- Configuração de UI por estado

## Internacionalização (i18n)

O sistema suporta português e inglês:

```typescript
// Estrutura de conteúdo bilíngue
interface BilingualContent {
  pt: string
  en: string
}

// Função de tradução
const i = t(locale) // 'pt' ou 'en'
```

Todas as mensagens do agente são bilíngues, permitindo que a criança escolha o idioma preferido.

## Integração com OpenNDS

### Fluxo FAS (Forwarding Authentication Service)

1. **Redirecionamento**: OpenNDS redireciona para PWA com parâmetros:
   - `tok`: Token de autenticação
   - `clientip`: IP do cliente
   - `gatewayname`: Nome do gateway

2. **Concessão de Acesso**: Quando decisão é ALLOW:
```typescript
const url = `${OPENNDS_GATEWAY}/fas/gateway?tok=${tok}&auth_target=%5Cx30`
await fetch(url) // Libera acesso
```

## Testes

### PWA
```bash
cd apps/pwa
pnpm test        # Executa testes
pnpm test:run    # Executa uma vez
```

### Estrutura de Testes
- Testes unitários para componentes
- Testes de integração para serviços
- Mocks para API backend

## Deploy e Produção

### Build do PWA
```bash
cd apps/pwa
pnpm build
```

### Build do Backend
```bash
cd apps/backend
pnpm build
pnpm start
```

### Variáveis de Ambiente Importantes
```env
# Backend
PORT=3001
OPENAI_API_KEY=sk-...
NODE_ENV=production

# PWA (build time)
VITE_BACKEND_URL=https://api.wifikids.com
```

## Segurança

### Medidas Implementadas
- Validação de entrada com Zod
- Rate limiting por device_id
- Tokens de sessão assinados
- Sanitização de conteúdo
- HTTPS obrigatório em produção

### Considerações
- Nunca expor URLs FAS para o cliente
- Armazenar mapeamento sessão → tempo_permitido no servidor
- Implementar rate limiting por IP e device_id

## Monitoramento e Logs

### Logs do Backend
- Decisões do agente
- Chamadas para OpenNDS
- Erros de integração

### Métricas Sugeridas
- Taxa de aprovação/negação
- Tempo de resposta da API
- Uso por período do dia
- Dispositivos únicos

## Troubleshooting

### Problemas Comuns

1. **PWA não carrega**
   - Verificar se backend está rodando
   - Conferir CORS settings
   - Validar service worker

2. **Decisões inconsistentes**
   - Verificar prompt do sistema
   - Conferir configuração de políticas
   - Validar timezone

3. **OpenNDS não libera acesso**
   - Verificar URL do gateway
   - Conferir token FAS
   - Validar conectividade

## Próximos Passos

### Melhorias Planejadas
- Interface administrativa para pais
- Relatórios de uso
- Integração com calendário escolar
- Suporte a múltiplos perfis de criança
- App mobile nativo

### Extensões Possíveis
- Integração com sistemas escolares
- Gamificação do processo
- Controles parentais avançados
- Analytics de comportamento

---

## Contato e Suporte

Para dúvidas sobre implementação ou integração, consulte:
- Documentação técnica nos comentários do código
- Testes unitários como exemplos de uso
- Issues no repositório do projeto