# Frontend & Backend Connection Setup Guide

## Architecture Overview

```
Frontend (Next.js on localhost:3000)
    ↓
Next.js Rewrites (next.config.ts)
    ↓
Backend API (FastAPI on localhost:8000)
```

The frontend uses **Next.js rewrites** to proxy API requests to the backend. This means:
- Frontend makes requests to `/api/...` (relative URL)
- Next.js rewrites these to `http://localhost:8000/api/...`
- Backend receives and processes the request

## Step 1: Ensure Backend is Running

### Windows:
```powershell
# Navigate to backend folder
cd backend

# Run the backend server
.\run_backend.bat
```

The backend should start on `http://localhost:8000`

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

### Test Backend:
Open browser and visit: `http://localhost:8000/`
You should see: `{"message": "Backend is running", "status": "ok"}`

## Step 2: Ensure Frontend is Running

### Windows:
```powershell
# Navigate to frontend folder
cd frontend

# Install dependencies (first time only)
npm install

# Run the frontend dev server
npm run dev
```

The frontend should start on `http://localhost:3000`

## Step 3: Configuration Files Created

### Backend (.env):
```
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=a_very_secret_key
```

### Frontend (.env.local):
```
NEXT_PUBLIC_API_URL=/api
```

### Frontend (next.config.ts) - Rewrites API:
```typescript
async rewrites() {
  return [
    {
      source: '/api/:path*',
      destination: 'http://localhost:8000/api/:path*',
    },
  ]
}
```

## Step 4: API Connection Flow

### Services Updated:
- `frontend/src/services/auth_service.ts` - Now uses `/api` (relative)
- `frontend/src/services/task_service.ts` - Now uses `/api` (relative)

### Backend CORS:
Configured to allow requests from:
- `http://localhost:3000` (frontend)
- `http://localhost:3001` (if needed)

## Step 5: Troubleshooting

### "No Response from Server" Error:
1. ✅ Check if backend is running: `http://localhost:8000/`
2. ✅ Check if frontend is running: `http://localhost:3000/`
3. ✅ Check browser console for errors
4. ✅ Check backend console for error messages
5. ✅ Verify `.env` file has correct `DATABASE_URL`

### "CORS Error":
- Backend already allows all origins from localhost:3000
- No additional CORS configuration needed

### "Cannot connect to database":
- Verify `DATABASE_URL` in `.env` is correct
- Test PostgreSQL connection manually

## Running Both Servers

### Option 1: Two Terminal Windows
- Terminal 1: `backend\run_backend.bat` (or `cd backend && python -m uvicorn src.main:app --reload`)
- Terminal 2: `frontend\npm run dev`

### Option 2: VS Code Tasks
Both can be run through VS Code terminal if configured

## Files Modified for Connection

1. **frontend/src/services/auth_service.ts**
   - Changed API_URL from `http://localhost:8000/api` to `/api`
   - Added proper error handling

2. **frontend/src/services/task_service.ts**
   - Changed API_URL from `http://localhost:8000/api` to `/api`

3. **frontend/.env.local** (Created)
   - Added `NEXT_PUBLIC_API_URL=/api`

4. **backend/src/main.py**
   - Added logging middleware
   - Uncommented database initialization
   - Added logging for debugging

## Expected Behavior

### Signup Flow:
1. User fills signup form
2. Frontend sends POST to `/api/signup`
3. Next.js rewrites to `http://localhost:8000/api/signup`
4. Backend processes, creates user in database
5. Returns user data
6. Frontend redirects to login

### Login Flow:
1. User fills login form
2. Frontend sends POST to `/api/login`
3. Backend validates credentials
4. Returns JWT token
5. Frontend stores token in localStorage
6. Redirects to tasks page

## Database Schema

The database tables are created automatically on startup:
- `users` table (id, username, email, hashed_password)
- `tasks` table (id, title, is_completed, owner_id)

No manual migration needed!

---

**Everything is now configured correctly for frontend-backend communication.**
