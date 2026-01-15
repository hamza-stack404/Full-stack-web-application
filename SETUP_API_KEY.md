# Phase III AI Chatbot - Setup Guide

## Quick Start: Adding Your Gemini API Key

### Step 1: Get Your API Key
1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key" or use an existing key
4. Copy the API key (starts with `AIzaSy...`)

### Step 2: Update Environment Variables
1. Open `backend/.env` in a text editor
2. Find the line: `GEMINI_API_KEY=your-gemini-api-key-here`
3. Replace `your-gemini-api-key-here` with your actual API key
4. Save the file

Example:
```
GEMINI_API_KEY=AIzaSyB1mwUX2pXv83teK8GP_6U_Lpx2K3HScvc
```

### Step 3: Restart the Backend
```bash
# Stop the current backend (Ctrl+C)
# Then restart it
cd backend
uvicorn src.main:app --reload --port 8001
```

### Step 4: Verify It Works
1. Check the backend logs for: `"Gemini client initialized successfully"`
2. Open the chat interface at http://localhost:3000/chat
3. Send a test message like "Hello" or "List my tasks"
4. You should receive an AI response

## Security Notes

✅ **Your API key is secure:**
- The `.env` file is in `.gitignore` and will never be committed to git
- API keys are never logged or exposed in error messages
- The application validates the key on startup without exposing it

⚠️ **Important:**
- Never share your `.env` file
- Never commit `.env` files to version control
- If your key is compromised, revoke it immediately in Google AI Studio

## Troubleshooting

**"AI service is not properly configured"**
- Check that `GEMINI_API_KEY` is set in `backend/.env`
- Verify there are no extra spaces or quotes around the key
- Restart the backend server after updating `.env`

**"403 PERMISSION_DENIED - API key was reported as leaked"**
- Your API key has been compromised
- Revoke it in Google AI Studio
- Generate a new key and update `.env`

**"404 NOT_FOUND - model not found"**
- The model name in the code is correct (`models/gemini-2.5-flash`)
- This usually means the API key doesn't have access to the model
- Try using `models/gemini-1.5-flash` instead

For more details, see `backend/SECURITY.md`
