# Wi-Fi Kids 🚀
**AI-powered educational captive portal with conversational learning**

Wi-Fi Kids transforms your home router into an **educational gateway**: kids engage with an AI tutor through conversational quizzes before gaining internet access. The system uses **GPT-5** to generate contextual questions, provide detailed feedback, and maintain conversation history for a personalized learning experience.

> **Now Available**: PWA deployment ready for Cloudflare Pages with seamless backend integration

---

## ✨ Key Features

### 🎓 **Conversational AI Learning**
- **ChatGPT-style interactions** with detailed, encouraging feedback
- **Thread memory** - AI remembers previous questions and builds context
- **Adaptive difficulty** based on student performance
- **Multi-subject support**: Math, Science, History, Geography, Literature, Art
- **Persona-based tutoring**: Tutor, Maternal, or General teaching styles

### 🌐 **Multilingual Support**
- **Full localization**: Portuguese (PT-BR) and English (EN-US)
- **Language-locked sessions** - users choose language upfront, then it's locked for the session
- **AI responses respect locale** - questions and feedback in chosen language
- **Smart answer validation** - accepts variations, synonyms, and different formats

### 💻 **Modern PWA Interface**
- **Progressive Web App** - works offline, installable on mobile devices
- **Real-time conversation** with typing indicators
- **Accessible design** with proper contrast and keyboard navigation
- **Responsive layout** for all screen sizes
- **Dark/light mode support**

### 🔧 **Developer-Friendly Architecture**
- **FastAPI backend** with automatic OpenAPI documentation
- **LangChain integration** for advanced AI workflows
- **SQLAlchemy ORM** with automatic migrations
- **Comprehensive testing** (80%+ coverage requirement)
- **Type hints throughout** for better development experience

---

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────┐
│   PWA Frontend  │    │  FastAPI Backend │    │   OpenAI    │
│  (React + TS)   │◄──►│ (Python + LangC) │◄──►│   GPT-5     │
└─────────────────┘    └──────────────────┘    └─────────────┘
         │                        │
         │              ┌─────────▼─────────┐
         │              │    SQLite DB      │
         │              │ (Sessions, Logs)  │
         │              └───────────────────┘
         │
┌────────▼────────┐
│ Cloudflare Pages│
│   (Deployment)  │
└─────────────────┘
```

### Key Components:
- **Frontend**: React + TypeScript PWA deployable to Cloudflare Pages
- **Backend**: FastAPI + LangChain + SQLAlchemy for AI-powered education
- **Database**: SQLite for development, PostgreSQL-ready for production
- **AI Service**: OpenAI GPT-5 with conversation memory and context
- **Deployment**: GitHub Actions + Cloudflare Pages for seamless CI/CD

---

## 📂 Project Structure

```
WiFi-Kids/
├── 📱 Frontend (PWA)
│   └── ui/webapp/apps/pwa/
│       ├── src/
│       │   ├── components/          # React components
│       │   ├── services/            # API integration, state management
│       │   ├── utils/               # Error handling, validation
│       │   ├── i18n.ts              # Internationalization
│       │   └── types.ts             # TypeScript definitions
│       ├── public/                  # Static assets, PWA manifest
│       ├── package.json             # Dependencies
│       ├── wrangler.toml            # Cloudflare Pages config
│       └── _headers, _redirects     # Cloudflare deployment files
│
├── 🔧 Backend (API)
│   └── backend/
│       ├── api/
│       │   ├── core/                # Database, settings, middleware
│       │   ├── routes/              # API endpoints
│       │   ├── schemas/             # Pydantic models
│       │   ├── repositories/        # Data access layer
│       │   └── integrations/        # AI agents, validation
│       ├── tests/                   # Comprehensive test suite
│       ├── pyproject.toml           # Dependencies & configuration
│       ├── env.example              # Environment template
│       └── run_tests.py             # Test runner script
│
├── 🚀 Deployment & DevOps
│   ├── .github/workflows/           # GitHub Actions CI/CD
│   ├── scripts/                     # Deployment scripts
│   │   ├── deploy-local.sh          # Local development setup (Unix)
│   │   └── deploy-local.bat         # Local development setup (Windows)
│   └── docker/                      # Docker configurations
│
├── 📚 Documentation
│   ├── README.md                    # This file
│   ├── CLAUDE.md                    # Claude Code instructions
│   ├── CONTRIBUTING.md              # Contribution guidelines
│   └── SECURITY.md                  # Security considerations
│
└── 🔗 Configuration
    ├── .env.example                 # Environment variables template
    └── requirements/                # Optional: pip requirements files
```

---

## 🚀 Quick Start

### Prerequisites

Choose your operating system:

<details>
<summary><strong>🪟 Windows</strong></summary>

1. **Python 3.11+**: Download from [python.org](https://python.org)
2. **Node.js 20+**: Download from [nodejs.org](https://nodejs.org) 
3. **Git**: Download from [git-scm.com](https://git-scm.com)
4. **OpenAI API Key**: Get from [platform.openai.com](https://platform.openai.com)

```cmd
# Verify installations
python --version     # Should be 3.11+
node --version       # Should be 20+
git --version        # Should be 2.x+
```

</details>

<details>
<summary><strong>🐧 Linux (Ubuntu/Debian)</strong></summary>

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python 3.11+
sudo apt install python3.11 python3.11-venv python3-pip -y

# Install Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Git
sudo apt install git -y

# Verify installations
python3.11 --version
node --version
git --version
```

</details>

<details>
<summary><strong>🍎 macOS</strong></summary>

```bash
# Install Homebrew if not installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install required tools
brew install python@3.11 node git

# Verify installations
python3.11 --version
node --version
git --version
```

</details>

### Step-by-Step Setup

#### 1️⃣ **Clone the Repository**

```bash
git clone https://github.com/viniciusvollrath/WiFi-Kids.git
cd WiFi-Kids
```

#### 2️⃣ **Backend Setup**

<details>
<summary><strong>🪟 Windows</strong></summary>

```cmd
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
.venv\Scripts\activate

# Upgrade pip and install dependencies
python -m pip install --upgrade pip
pip install -e .

# Copy environment template
copy env.example .env

# Edit .env file with your OpenAI API key
# OPENAI_API_KEY=your_actual_api_key_here
```

</details>

<details>
<summary><strong>🐧 Linux / 🍎 macOS</strong></summary>

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python3.11 -m venv .venv

# Activate virtual environment
source .venv/bin/activate

# Upgrade pip and install dependencies
pip install --upgrade pip
pip install -e .

# Copy environment template
cp env.example .env

# Edit .env file with your OpenAI API key
# nano .env  # or use your preferred editor
# Set: OPENAI_API_KEY=your_actual_api_key_here
```

</details>

#### 3️⃣ **Configure Environment**

Edit the `.env` file in the `backend/` directory:

```env
# OpenAI Configuration (REQUIRED)
OPENAI_API_KEY=sk-your-actual-openai-api-key-here
OPENAI_MODEL=GPT-5
OPENAI_TEMPERATURE=0.3
OPENAI_MAX_TOKENS=1000

# Database (SQLite for development)
DATABASE_URL=sqlite:///./dev.db

# Session Configuration
SESSION_TTL_SEC=1800  # 30 minutes internet access
CHALLENGE_REQUIRED=true
CHALLENGE_ATTEMPTS=3

# Agent Configuration
AGENT_TYPE=langchain
AGENT_DEFAULT_PERSONA=tutor  # tutor | maternal | general
ROUTER_ENABLED=true

# CORS (add your domain for production)
CORS_ORIGINS=http://localhost:5174,https://your-domain.com

# Timezone and Access Windows
DEFAULT_TIMEZONE=America/Sao_Paulo
ACCESS_WINDOWS=07:00-21:00
```

#### 4️⃣ **Database Setup**

```bash
# Make sure you're in backend/ directory with activated virtual environment
cd backend
source .venv/bin/activate  # Linux/macOS
# OR
.venv\Scripts\activate     # Windows

# Run database migrations
alembic upgrade head

# Verify database was created
ls -la *.db  # Should show dev.db
```

#### 5️⃣ **Frontend Setup**

```bash
# Navigate to frontend directory
cd ui/webapp/apps/pwa

# Install dependencies
npm install

# Verify installation
npm run test:run
```

#### 6️⃣ **Test the Setup**

<details>
<summary><strong>🧪 Run Backend Tests</strong></summary>

```bash
cd backend

# Activate virtual environment if not already active
source .venv/bin/activate  # Linux/macOS
# OR
.venv\Scripts\activate     # Windows

# Run comprehensive tests
python run_tests.py --coverage --lint --type-check

# Expected output:
# ✅ All tests should pass
# ✅ Coverage should be 80%+
# ✅ Linting should pass
# ✅ Type checking should pass
```

</details>

<details>
<summary><strong>🧪 Run Frontend Tests</strong></summary>

```bash
cd ui/webapp/apps/pwa

# Run tests
npm run test:run

# Expected output:
# ✅ All component tests should pass
# ✅ Integration tests should pass
```

</details>

#### 7️⃣ **Start Development Servers**

**Terminal 1 (Backend):**
```bash
cd backend
source .venv/bin/activate  # Linux/macOS or .venv\Scripts\activate (Windows)
uvicorn api.main:app --host 0.0.0.0 --port 8002 --reload
```

**Terminal 2 (Frontend):**
```bash
cd ui/webapp/apps/pwa
npm run dev
```

#### 8️⃣ **Access the Application**

- **Frontend**: http://localhost:5174
- **Backend API**: http://localhost:8002
- **API Documentation**: http://localhost:8002/docs
- **OpenAPI Spec**: http://localhost:8002/openapi.json

---

## 🔧 Development Guide

### 🧪 **Testing**

The project has comprehensive testing with strict requirements:

```bash
# Backend testing
cd backend
python run_tests.py --coverage --lint --type-check

# Frontend testing
cd ui/webapp/apps/pwa
npm run test:run

# Run specific test categories
python run_tests.py --category unit        # Unit tests only
python run_tests.py --category integration # API tests
python run_tests.py --category e2e         # End-to-end tests
python run_tests.py --category analytics   # Analytics tests
```

### 🏗️ **Building for Production**

```bash
# Build frontend
cd ui/webapp/apps/pwa
npm run build

# The built files will be in dist/
# Ready for deployment to Cloudflare Pages
```

### 📊 **Monitoring & Debugging**

- **Backend Logs**: Check console output with detailed AI interaction logs
- **Frontend Errors**: Browser DevTools console shows detailed error information
- **Database**: SQLite browser or CLI to inspect data
- **AI Responses**: Debug logs show conversation history and AI reasoning

---

## 🚀 Deployment

### Cloudflare Pages Deployment

The project is pre-configured for seamless Cloudflare Pages deployment:

1. **Fork/Clone** the repository to your GitHub account

2. **Set up Cloudflare Pages**:
   - Connect your GitHub repository
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: `ui/webapp/apps/pwa`

3. **Environment Variables** (in Cloudflare Pages dashboard):
   ```
   VITE_API_URL=https://your-backend-api.com
   VITE_MOCK=false
   VITE_DEBUG=false
   ```

4. **Deploy Backend** to your preferred platform:
   - Railway, Render, DigitalOcean, AWS, etc.
   - Use the `backend/` directory
   - Set environment variables from `env.example`

### GitHub Actions

The repository includes automated deployment via GitHub Actions:

- **Frontend**: Automatically deploys to Cloudflare Pages on push to `main`
- **Backend**: Tests run on every PR and push
- **Quality Gates**: Tests, linting, and type checking must pass

---

## 🎯 Usage Guide

### For Students

1. **Choose Language**: Select Portuguese or English at the start
2. **Access Internet**: Click "Access Internet" to begin the challenge
3. **Answer Questions**: Engage with the AI tutor in a conversational manner
4. **Get Feedback**: Receive detailed, encouraging feedback on answers
5. **Learn Continuously**: Use "Keep Learning" for additional educational content

### For Parents/Administrators

1. **Configure Sessions**: Adjust session duration in backend environment
2. **Set Personas**: Choose between Tutor, Maternal, or General teaching styles  
3. **Monitor Usage**: Check logs and analytics through the API endpoints
4. **Customize Subjects**: Configure available subjects in environment variables

---

## 🔒 Security Considerations

- **API Keys**: Never commit OpenAI API keys to version control
- **Environment Files**: Keep `.env` files private and secure
- **CORS Configuration**: Properly configure allowed origins for production
- **Input Validation**: All user inputs are validated and sanitized
- **Rate Limiting**: API endpoints have built-in rate limiting protection

---

## 📊 Monitoring & Analytics

The system includes comprehensive analytics:

- **Session Tracking**: Monitor student progress and time spent
- **Performance Metrics**: Track AI response times and success rates
- **Learning Analytics**: Analyze subject preferences and difficulty progression
- **Usage Patterns**: Understand peak usage times and session durations

Access analytics through the API at `/analytics/*` endpoints.

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add/update tests
5. Ensure all tests pass
6. Submit a pull request

### Code Quality Standards

- **80%+ test coverage** required
- **Type hints** for all Python functions
- **ESLint/Prettier** for TypeScript/React code
- **Conventional commits** for clear change history

---

## 📝 API Documentation

The backend provides automatic API documentation:

- **Interactive Docs**: http://localhost:8002/docs (Swagger UI)
- **ReDoc**: http://localhost:8002/redoc (Alternative documentation)
- **OpenAPI Spec**: http://localhost:8002/openapi.json (Machine-readable)

### Key Endpoints

- `POST /challenge/generate` - Generate new educational challenges
- `POST /challenge/answer` - Submit answers for validation
- `GET /analytics/*` - Access usage analytics and metrics
- `POST /session/*` - Session management endpoints

---

## 🐛 Troubleshooting

<details>
<summary><strong>Common Issues & Solutions</strong></summary>

**❌ "OPENAI_API_KEY is required"**
- Solution: Add your OpenAI API key to the `.env` file in backend/

**❌ "Connection refused" on frontend**
- Solution: Make sure backend is running on port 8002
- Check if `.env` file exists and is properly configured

**❌ "Database locked" error**
- Solution: Stop all running instances and delete `dev.db`, then run `alembic upgrade head`

**❌ Frontend build fails**
- Solution: Run `npm ci` to clean install dependencies
- Check Node.js version (should be 20+)

**❌ Tests failing**
- Solution: Ensure virtual environment is activated
- Run `pip install -e .` to reinstall dependencies
- Check Python version (should be 3.11+)

**❌ "Module not found" errors**
- Solution: Make sure you're in the correct directory and virtual environment is activated
- For backend: `cd backend && source .venv/bin/activate`
- For frontend: `cd ui/webapp/apps/pwa`

</details>

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🔗 Links & Resources

- **Repository**: [WiFi-Kids](https://github.com/viniciusvollrath/WiFi-Kids)
- **OpenAI API**: [platform.openai.com](https://platform.openai.com)
- **LangChain Documentation**: [langchain.com](https://langchain.com)
- **FastAPI Documentation**: [fastapi.tiangolo.com](https://fastapi.tiangolo.com)
- **React Documentation**: [reactjs.org](https://reactjs.org)
- **Cloudflare Pages**: [pages.cloudflare.com](https://pages.cloudflare.com)

---

## 👥 Team

- **Paulo Cesar** — Backend Architecture, Database Design, API Development
- **Lucas Nogueira** — LangChain Integration, AI Prompt Engineering  
- **Vinicius Vollrath** — Frontend Development, Infrastructure, DevOps

---

## 🎉 Acknowledgments

Special thanks to:
- **OpenAI** for providing the GPT-5 API
- **LangChain** for the excellent AI framework
- **FastAPI** for the high-performance Python web framework
- **React** for the powerful frontend library
- **Cloudflare** for reliable edge deployment

---

**📚 Wi-Fi Kids: Learn before you surf. 🌊**

*Transform screen time into learning time with AI-powered educational conversations.*