# Full Stack Todo Application

A modern full-stack todo application featuring Next.js frontend and FastAPI backend with PostgreSQL database.

## Features

- **Full Authentication**: User signup, login, and JWT-based authentication
- **Task Management**: Create, read, update, and delete tasks
- **Responsive Design**: Mobile-first responsive UI
- **Dark/Light Mode**: Toggle between dark and light themes with system preference detection
- **Modern UI**: Clean interface with Tailwind CSS and Shadcn UI components

## Tech Stack

### Frontend
- Next.js 16.1.1 (App Router)
- TypeScript
- Tailwind CSS
- Shadcn UI Components
- Lucide React Icons

### Backend
- FastAPI
- Python 3.14
- PostgreSQL (via psycopg2-binary)
- SQLModel (SQLAlchemy + Pydantic)
- JWT Authentication

## Dark/Light Mode

The application features a sophisticated dark/light mode implementation with:

- System preference detection
- Manual toggle option
- Persistent user preference via localStorage
- Smooth theme transitions
- Consistent styling across all components

## Installation

1. Clone the repository
2. Navigate to the project directory

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
```

### Frontend Setup

```bash
cd frontend
npm install
```

## Running the Application

### Backend

```bash
cd backend
python -m uvicorn src.main:app --reload
```

### Frontend

```bash
cd frontend
npm run dev
```

## API Endpoints

- `POST /api/signup` - User registration
- `POST /api/login` - User login
- `GET /api/tasks` - Get user tasks
- `POST /api/tasks` - Create a task
- `PUT /api/tasks/{id}` - Update a task
- `DELETE /api/tasks/{id}` - Delete a task

## Environment Variables

Create `.env` file in the backend directory:

```env
DATABASE_URL=postgresql://username:password@localhost/dbname
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

## License

MIT