# Debugging the 500 Error - Complete Guide

## What Was Fixed

### 1. ✅ Environment Variable Issue
**File:** `backend/.env`
- **Problem:** Extra space after `DATABASE_URL=` was being included in the URL
- **Fixed:** Removed the space - `DATABASE_URL=postgresql://...` (no space after =)

### 2. ✅ Better Error Logging
**File:** `backend/src/database.py`
- Added environment variable validation
- Added connection logging
- Added `pool_pre_ping=True` to test connection before use

**File:** `backend/src/api/auth.py`
- Added logging for signup/login attempts
- Full stack traces for debugging

**File:** `backend/src/main.py`
- Added general exception handler for all errors
- Better error logging with stack traces

---

## How to Find the Root Cause

### Step 1: Restart Backend
```bash
cd backend
run_backend.bat
```

### Step 2: Check Backend Console Output
Look for messages like:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
INFO:     Database tables created/verified
```

### Step 3: Try Signup Again
Watch the backend console - it will show:
```
INFO:     Request: POST http://localhost:8000/api/signup
INFO:     Signup attempt: testuser
INFO:     Creating user: testuser
INFO:     Response: 200
```

Or if there's an error:
```
ERROR:    Signup error: [detailed error message here]
```

---

## Common 500 Error Causes

### 🔴 Database Connection Failed
**Error message:** `"could not translate host name"`
**Solution:** 
- Check `DATABASE_URL` in `.env` is correct
- Verify PostgreSQL server is running
- Check internet connection (if using cloud DB like Neon)

### 🔴 Missing Dependencies
**Error message:** `"No module named 'sqlmodel'"`
**Solution:**
```bash
cd backend
pip install -r requirements.txt
```

### 🔴 Environment Variable Not Loaded
**Error message:** `"DATABASE_URL environment variable is not set"`
**Solution:**
- Check `.env` file exists in backend folder
- Restart backend server

### 🔴 Database Query Error
**Error message:** `"column 'xyz' does not exist"`
**Solution:**
- Backend tables not created properly
- Delete database tables and let them recreate:
  - Access Neon dashboard and clear tables
  - Or restart backend to auto-create

---

## Testing Signup Step by Step

### 1. Test Backend Health
```bash
# In browser:
http://localhost:8000/
```
Should return:
```json
{"message": "Backend is running", "status": "ok"}
```

### 2. Check Network Request
1. Open browser DevTools (F12)
2. Go to Network tab
3. Try signing up
4. Check the signup request:
   - Should go to: `/api/signup`
   - Method: POST
   - Status: 500 (with detailed error message in response)

### 3. Read Backend Console
The backend console now shows:
- Signup attempt
- Validation results
- Database operations
- Any errors with full stack trace

---

## Quick Fixes Checklist

- ✅ Fixed `.env` spacing issue
- ✅ Added database connection validation
- ✅ Added comprehensive error logging
- ✅ Added exception handlers for all errors
- ✅ Backend now shows detailed error messages

## Next Steps

1. **Restart backend** to apply changes
2. **Watch console** when you sign up
3. **Share the error message** from console if signup still fails
4. Look for patterns like:
   - Database connection errors
   - Missing environment variables
   - Validation errors
   - Data type issues

---

## Files Modified

1. `backend/.env` - Removed space in DATABASE_URL
2. `backend/src/database.py` - Added connection validation
3. `backend/src/api/auth.py` - Added detailed logging
4. `backend/src/main.py` - Added exception handlers

The 500 error message in the browser response now includes the actual error details!
