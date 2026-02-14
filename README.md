# Full Stack Todo Application

A modern, production-ready full-stack todo application with AI-powered chatbot assistance, featuring Next.js 16 frontend and FastAPI backend with PostgreSQL database.

[![CI/CD Pipeline](https://github.com/yourusername/todo-app/workflows/CI/CD%20Pipeline/badge.svg)](https://github.com/yourusername/todo-app/actions)
[![codecov](https://codecov.io/gh/yourusername/todo-app/branch/main/graph/badge.svg)](https://codecov.io/gh/yourusername/todo-app)

## ✨ Features

### Core Features
- **Full Authentication**: Secure user signup/login with JWT tokens and Argon2 password hashing
- **Task Management**: Complete CRUD operations with rich task properties
- **Task Organization**: Categories, tags (up to 10 per task), priorities (low/medium/high)
- **Recurring Tasks**: Daily, weekly, and monthly recurring task support
- **Subtasks**: Break down complex tasks into manageable subtasks
- **Multiple Views**: List, Kanban board, and Calendar views
- **Bulk Operations**: Efficiently manage multiple tasks at once
- **Dark/Light Mode**: System preference detection with manual toggle
- **Responsive Design**: Mobile-first, works seamlessly on all devices

### Advanced Features
- **AI Chatbot**: Natural language task management powered by Google Gemini
- **Conversation History**: Persistent chat conversations with context
- **Smart Task Creation**: Create tasks through natural language
- **Dashboard Customization**: Personalized dashboard with drag-and-drop widgets
- **Pomodoro Timer**: Built-in productivity timer
- **Keyboard Shortcuts**: Power-user friendly shortcuts

### Security & Performance
- **Rate Limiting**: Protection against API abuse (100 req/min default)
- **Security Headers**: HSTS, CSP, X-Frame-Options, XSS Protection
- **Input Validation**: Comprehensive Pydantic validation
- **SQL Injection Protection**: SQLModel ORM with parameterized queries
- **Health Monitoring**: Built-in health check endpoints
- **Error Tracking**: Structured logging with sanitized error messages

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 16.1.1 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn UI
- **Icons**: Lucide React
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Testing**: Vitest + React Testing Library

### Backend
- **Framework**: FastAPI
- **Language**: Python 3.11+
- **Database**: PostgreSQL 15+
- **ORM**: SQLModel (SQLAlchemy + Pydantic)
- **Authentication**: JWT with Argon2 password hashing
- **Migrations**: Alembic
- **AI Integration**: Google Gemini API
- **Testing**: Pytest + pytest-asyncio

### DevOps
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Code Quality**: Black, isort, Flake8, Prettier, ESLint
- **Pre-commit Hooks**: Automated code quality checks
- **Security Scanning**: Bandit, Trivy

## 📋 Prerequisites

- **Python**: 3.11 or higher
- **Node.js**: 20 or higher
- **PostgreSQL**: 15 or higher
- **Docker** (optional): For containerized development

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended)

```bash
# Clone the repository
git clone https://github.com/yourusername/todo-app.git
cd todo-app

# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Update backend/.env with your configuration
# At minimum, set BETTER_AUTH_SECRET and GEMINI_API_KEY

# Start all services
docker-compose up

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Option 2: Manual Setup

#### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment variables
cp .env.example .env
# Edit .env with your database URL and secrets

# Run database migrations
alembic upgrade head

# Start the backend server
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Copy and configure environment variables
cp .env.example .env.local
# Edit .env.local with your API URL

# Start the development server
npm run dev
```

## 🔧 Configuration

### Backend Environment Variables

Create `backend/.env` file:

```env
# Database Configuration (Required)
DATABASE_URL=postgresql://user:password@localhost:5432/tododb

# Authentication Secret (Required)
# Generate with: openssl rand -hex 32
BETTER_AUTH_SECRET=your-secret-key-here

# AI Chatbot (Optional)
GEMINI_API_KEY=your-gemini-api-key

# Frontend URL for CORS (Production)
FRONTEND_URL=https://your-frontend-url.com

# Rate Limiting (Optional)
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60

# Debug Mode (Optional, DO NOT use in production)
DEBUG=false
```

### Frontend Environment Variables

Create `frontend/.env.local` file:

```env
# API URL (leave empty for local development)
NEXT_PUBLIC_API_URL=

# For production:
# NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

## 📚 API Documentation

### Interactive API Docs

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key Endpoints

#### Authentication
- `POST /api/signup` - Register new user
- `POST /api/login` - Login and get JWT token

#### Tasks
- `GET /api/tasks` - Get all user tasks
- `POST /api/tasks` - Create new task
- `GET /api/tasks/{id}` - Get specific task
- `PUT /api/tasks/{id}` - Update task
- `DELETE /api/tasks/{id}` - Delete task
- `POST /api/tasks/bulk-delete` - Delete multiple tasks

#### AI Chatbot
- `GET /api/conversations` - Get user conversations
- `POST /api/conversations` - Create new conversation
- `GET /api/conversations/{id}` - Get conversation with messages
- `POST /api/conversations/{id}/messages` - Send message
- `DELETE /api/conversations/{id}` - Delete conversation

#### Health & Monitoring
- `GET /health` - Basic health check
- `GET /api/health` - Comprehensive health check with database status

For detailed API documentation, see [API.md](./docs/API.md)

## 🧪 Testing

### Backend Tests

```bash
cd backend

# Run all tests
pytest

# Run with coverage
pytest --cov=src --cov-report=html

# Run specific test file
pytest tests/test_auth.py -v

# Run specific test
pytest tests/test_auth.py::TestSignup::test_signup_success -v
```

### Frontend Tests

```bash
cd frontend

# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

## 🔒 Security

### Security Features
- **Password Hashing**: Argon2 (industry standard)
- **JWT Tokens**: Secure token-based authentication
- **Rate Limiting**: 100 requests per minute per IP
- **Security Headers**: HSTS, CSP, X-Frame-Options, X-Content-Type-Options
- **Input Validation**: Comprehensive Pydantic schemas
- **SQL Injection Protection**: Parameterized queries via SQLModel
- **CORS Configuration**: Strict origin validation

### Security Best Practices
1. Never commit `.env` files
2. Use strong, unique secrets for `BETTER_AUTH_SECRET`
3. Rotate API keys regularly
4. Keep dependencies updated
5. Review security scan results in CI/CD

## 🚢 Deployment

### Backend Deployment (Vercel/Railway/Render)

1. Set environment variables in your platform
2. Deploy from GitHub repository
3. Run database migrations: `alembic upgrade head`
4. Verify health endpoint: `https://your-api.com/health`

### Frontend Deployment (Vercel)

1. Connect GitHub repository
2. Set `NEXT_PUBLIC_API_URL` environment variable
3. Deploy automatically on push to main

### Docker Deployment

```bash
# Build images
docker-compose build

# Run in production mode
docker-compose -f docker-compose.prod.yml up -d
```

## 🛠 Development

### Code Quality

```bash
# Install pre-commit hooks
pip install pre-commit
pre-commit install

# Run pre-commit on all files
pre-commit run --all-files

# Format Python code
cd backend
black .
isort .

# Format TypeScript/JavaScript
cd frontend
npm run format
```

### Database Migrations

```bash
cd backend

# Create new migration
alembic revision --autogenerate -m "Description of changes"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1
```

## 📊 Project Structure

```
.
├── backend/
│   ├── src/
│   │   ├── api/          # API route handlers
│   │   ├── models/       # Database models
│   │   ├── services/     # Business logic
│   │   ├── schemas.py    # Pydantic schemas
│   │   ├── auth.py       # Authentication logic
│   │   ├── database.py   # Database connection
│   │   └── main.py       # FastAPI application
│   ├── tests/            # Backend tests
│   ├── alembic/          # Database migrations
│   └── requirements.txt  # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── app/          # Next.js pages (App Router)
│   │   ├── components/   # React components
│   │   ├── services/     # API clients
│   │   ├── hooks/        # Custom React hooks
│   │   └── providers/    # Context providers
│   └── package.json      # Node dependencies
├── .github/
│   └── workflows/        # CI/CD pipelines
├── docker-compose.yml    # Docker orchestration
└── README.md            # This file
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `pytest` (backend) and `npm test` (frontend)
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [Next.js](https://nextjs.org/) - React framework
- [Shadcn UI](https://ui.shadcn.com/) - Beautiful UI components
- [Google Gemini](https://ai.google.dev/) - AI capabilities

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/todo-app/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/todo-app/discussions)
- **Email**: support@yourdomain.com

## 🗺 Roadmap

- [ ] Mobile app (React Native)
- [ ] Task sharing and collaboration
- [ ] File attachments
- [ ] Email notifications
- [ ] Task templates
- [ ] Advanced analytics
- [ ] Integration with calendar apps
- [ ] Offline support (PWA)

## Phase IV: Local Kubernetes Deployment

### Prerequisites
- Docker Desktop 4.53+ (with Gordon enabled)
- Minikube installed
- Helm 3 installed
- kubectl installed
- kubectl-ai installed
- kagent installed

### Step 1: Enable Gordon
```bash
docker ai "What can you do?"
```

### Step 2: Build Docker Images
```bash
docker ai "Build a production image for my Next.js app in ./frontend and tag it todo-frontend:latest"
docker ai "Build a production image for my FastAPI app in ./backend and tag it todo-backend:latest"
```

### Step 3: Start Minikube
```bash
minikube start
minikube addons enable ingress
```

### Step 4: Load Images into Minikube
```bash
minikube image load todo-frontend:latest
minikube image load todo-backend:latest
```

### Step 5: Update Secrets in values.yaml
Generate base64 values for your secrets:
```bash
echo -n "your-neon-database-url" | base64
echo -n "your-openai-api-key" | base64
echo -n "your-better-auth-secret" | base64
```
Replace REPLACE_WITH_BASE64_* in todo-chart/values.yaml with generated values.

### Step 6: Deploy with Helm
```bash
helm install todo ./todo-chart
```

### Step 7: Verify Deployment
```bash
kubectl-ai "show me all pods in todo-app namespace"
kubectl-ai "show me all services in todo-app namespace"
kagent "analyze the health of todo-app namespace"
```

### Step 8: Access the App
```bash
minikube service todo-frontend -n todo-app --url
```

### Upgrade Deployment
```bash
helm upgrade todo ./todo-chart
```

### Uninstall Deployment
```bash
helm uninstall todo
```

### Troubleshooting
```bash
# Check pod logs
kubectl logs -n todo-app -l app=todo-frontend
kubectl logs -n todo-app -l app=todo-backend

# Describe pod (shows errors)
kubectl-ai "why are pods failing in todo-app namespace"

# Check events
kubectl get events -n todo-app
```

---

**Built with ❤️ using modern web technologies**
