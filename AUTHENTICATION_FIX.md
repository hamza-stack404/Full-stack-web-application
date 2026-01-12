# Authentication 401 Error - Fixes Applied

## Issues Identified

1. **OAuth2 tokenUrl Mismatch**: Backend was configured with `tokenUrl="token"` but the actual endpoint is `/api/login`
2. **CORS Configuration Issues**: Invalid wildcard patterns (`"https://*.vercel.app"` and `"*"`) that are incompatible with `allow_credentials=True`
3. **Missing Token Expiration**: Token wasn't being created with proper expiration time
4. **No 401 Error Handling**: Frontend didn't handle expired/invalid tokens properly

## Fixes Applied

### Backend Changes

#### 1. Fixed OAuth2 tokenUrl (`backend/src/auth.py:19`)
```python
# Before:
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# After:
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")
```

#### 2. Fixed CORS Configuration (`backend/src/main.py:16-36`)
- Removed invalid wildcard patterns (`"https://*.vercel.app"`, `"*"`)
- Added support for `FRONTEND_URL` environment variable
- Added `expose_headers=["*"]` for better header handling
- Kept `allow_credentials=True` with specific origins only

#### 3. Added Proper Token Expiration (`backend/src/api/auth.py:75-82`)
```python
from datetime import timedelta
from ..auth import ACCESS_TOKEN_EXPIRE_MINUTES
access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
access_token = create_access_token(
    data={"sub": user.email},
    expires_delta=access_token_expires
)
```

### Frontend Changes

#### 4. Added 401 Error Interceptor (`frontend/src/services/task_service.ts:88-106`)
- Automatically clears invalid tokens from localStorage
- Redirects to login page when 401 error occurs
- Prevents infinite redirect loops

#### 5. Added Debug Logging (`frontend/src/services/task_service.ts:59-65`)
- Logs when requests are made with/without tokens
- Helps identify authentication issues in console

## How to Test the Fixes

### Step 1: Restart Backend (if running locally)
```bash
cd backend
# Kill any running backend processes
# Then restart:
python -m uvicorn src.main:app --reload --port 8000
```

### Step 2: Restart Frontend
```bash
cd frontend
npm run dev
```

### Step 3: Clear Browser Data
1. Open browser DevTools (F12)
2. Go to Application/Storage tab
3. Clear localStorage (or just remove the 'token' key)
4. Refresh the page

### Step 4: Test Authentication Flow
1. **Signup**: Create a new account at `/signup`
2. **Login**: Login with your credentials at `/login`
   - Check console for "Token saved: [token]" message
3. **Access Tasks**: Navigate to `/tasks` or `/dashboard`
   - Check console for "Request with token: /api/tasks Token exists: true"
4. **Verify API Calls**:
   - Try adding a new task
   - Try fetching tasks
   - Check Network tab for 200 responses (not 401)

### Step 5: Check Console Logs
Look for these messages in the browser console:
- ✅ "Token saved: [token]" - after login
- ✅ "Request with token: /api/tasks Token exists: true" - when making API calls
- ❌ "No token found for request: /api/tasks" - indicates token not stored properly

## If Issues Persist

### Check 1: Verify Token is Stored
```javascript
// In browser console:
localStorage.getItem('token')
// Should return a JWT token string
```

### Check 2: Verify Backend is Accessible
```bash
# Test backend health endpoint:
curl https://hamza-todo-backend.vercel.app/api/health
```

### Check 3: Check CORS Headers
In Network tab, check the response headers for:
- `Access-Control-Allow-Origin`
- `Access-Control-Allow-Credentials`
- `Access-Control-Allow-Headers`

### Check 4: Verify Token Format
The Authorization header should be:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Production Deployment

### Backend (Vercel)
If deploying to Vercel, add environment variable:
```
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

### Frontend (Vercel)
Environment variable should already be set:
```
NEXT_PUBLIC_API_URL=https://hamza-todo-backend.vercel.app/api
```

## Common Issues

### Issue: Still getting 401 errors
**Solution**:
1. Clear localStorage and login again
2. Check if backend is running and accessible
3. Verify CORS configuration includes your frontend URL

### Issue: Token not being sent
**Solution**:
1. Check browser console for "No token found" warning
2. Verify login response includes `access_token`
3. Check localStorage after login

### Issue: CORS errors
**Solution**:
1. Verify frontend URL is in backend's allowed origins
2. Check that `allow_credentials=True` is set
3. Ensure no wildcard origins when using credentials

## Next Steps

1. Test the authentication flow locally
2. If working locally, deploy backend changes to Vercel
3. Test in production environment
4. Monitor console logs for any remaining issues
