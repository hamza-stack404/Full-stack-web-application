# OpenRouter API Integration Guide

**Date:** 2026-01-28
**Status:** ✅ Implemented with Full Security

---

## Overview

Your Todo application now supports **OpenRouter API**, which provides access to multiple AI models including Claude, GPT-4, Gemini, and more through a single API.

### Why OpenRouter?

- **Multiple Models:** Access Claude 3.5 Sonnet, GPT-4, Gemini, Llama, and 100+ other models
- **Cost Effective:** Pay only for what you use with competitive pricing
- **Flexibility:** Switch between models without changing code
- **Reliability:** Built-in fallbacks and load balancing

---

## Security Features

### ✅ API Key Protection

Your OpenRouter API key is protected by multiple security layers:

1. **Environment Variables:** Keys stored in `.env` file (never in code)
2. **Git Ignore:** `.env` files automatically excluded from version control
3. **Secure Setup Script:** Interactive script prevents accidental exposure
4. **Auto-Detection:** System automatically selects available AI service
5. **Validation:** Keys validated before use

### ✅ Security Checklist

- [x] API keys stored in environment variables only
- [x] `.env` files in `.gitignore`
- [x] No hardcoded keys in source code
- [x] Secure setup script with validation
- [x] Keys never logged or exposed in responses
- [x] HTTPS-only communication with OpenRouter

---

## Quick Start

### Step 1: Get Your OpenRouter API Key

1. Go to [OpenRouter Keys](https://openrouter.ai/keys)
2. Sign up or log in
3. Click "Create Key"
4. Copy your API key (starts with `sk-or-`)
5. **Keep it secret!** Never share or commit it

### Step 2: Configure Your Environment

**Option A: Automated Setup (Recommended)**

```bash
cd backend
python setup_env.py
```

Choose option 1 (OpenRouter) and paste your API key when prompted.

**Option B: Manual Setup**

1. Edit `backend/.env`:
   ```bash
   OPENROUTER_API_KEY=sk-or-v1-your-actual-key-here
   OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
   ```

2. Save the file

### Step 3: Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

This installs the `openai` library (OpenRouter uses OpenAI-compatible API).

### Step 4: Start the Backend

```bash
cd backend
python -m uvicorn src.main:app --host 0.0.0.0 --port 8001 --reload
```

You should see:
```
INFO:src.services.ai_service:Using OpenRouter AI service
INFO:src.services.agent_service_openrouter:OpenRouter client initialized successfully with model: anthropic/claude-3.5-sonnet
```

---

## Available Models

### Recommended Models

| Model | Provider | Best For | Cost |
|-------|----------|----------|------|
| `anthropic/claude-3.5-sonnet` | Anthropic | General tasks, coding | $$ |
| `openai/gpt-4-turbo` | OpenAI | Complex reasoning | $$$ |
| `google/gemini-pro` | Google | Fast responses | $ |
| `meta-llama/llama-3.1-70b-instruct` | Meta | Open source | $ |

### How to Change Models

Edit `backend/.env`:
```bash
OPENROUTER_MODEL=openai/gpt-4-turbo
```

Restart the backend to apply changes.

### Model Selection Tips

- **Claude 3.5 Sonnet:** Best balance of quality and cost (recommended)
- **GPT-4 Turbo:** Best for complex reasoning, higher cost
- **Gemini Pro:** Fast and affordable
- **Llama 3.1:** Open source, good for privacy-conscious users

See all models: https://openrouter.ai/models

---

## Configuration Reference

### Environment Variables

**Required:**
```bash
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=your-secure-secret
```

**AI Configuration (Choose ONE):**
```bash
# Option 1: OpenRouter (Recommended)
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet

# Option 2: Gemini (Legacy)
GEMINI_API_KEY=AIza...
```

**Optional:**
```bash
FRONTEND_URL=http://localhost:3000
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60
DEBUG=false
```

---

## Migration from Gemini

If you're currently using Gemini and want to switch to OpenRouter:

### Step 1: Get OpenRouter Key

Follow the Quick Start guide above.

### Step 2: Update Environment

Edit `backend/.env`:
```bash
# Comment out Gemini (optional - system will prefer OpenRouter)
# GEMINI_API_KEY=AIza...

# Add OpenRouter
OPENROUTER_API_KEY=sk-or-v1-your-key-here
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
```

### Step 3: Restart Backend

```bash
# Stop current backend (Ctrl+C)
# Start with new configuration
python -m uvicorn src.main:app --host 0.0.0.0 --port 8001 --reload
```

The system will automatically detect and use OpenRouter.

### Rollback to Gemini

If needed, you can rollback:
1. Remove or comment out `OPENROUTER_API_KEY`
2. Uncomment `GEMINI_API_KEY`
3. Restart backend

---

## How It Works

### Automatic Service Selection

The system automatically selects the AI service:

```python
# Priority order:
1. OpenRouter (if OPENROUTER_API_KEY is set)
2. Gemini (if GEMINI_API_KEY is set)
3. Disabled (if neither is set)
```

### Architecture

```
User Message
    ↓
Chat API (chat.py)
    ↓
AI Service Selector (ai_service.py)
    ↓
OpenRouter Agent (agent_service_openrouter.py)
    ↓
OpenRouter API (https://openrouter.ai/api/v1)
    ↓
Selected Model (Claude, GPT-4, etc.)
    ↓
Response with Tool Calls
    ↓
MCP Tools (task operations)
    ↓
Final Response to User
```

### Function Calling

OpenRouter supports OpenAI-compatible function calling:

```python
tools = [
    {
        "type": "function",
        "function": {
            "name": "add_task",
            "description": "Create a new task",
            "parameters": {...}
        }
    }
]
```

The AI can call these functions to manage tasks.

---

## Security Best Practices

### ✅ DO

- Store API keys in `.env` files
- Use different keys for development and production
- Rotate keys regularly (every 90 days)
- Monitor API usage on OpenRouter dashboard
- Set spending limits on OpenRouter
- Use environment-specific keys

### ❌ DON'T

- Commit `.env` files to git
- Share API keys in chat, email, or screenshots
- Hardcode keys in source code
- Use production keys in development
- Expose keys in client-side code
- Log API keys

### Key Rotation

To rotate your OpenRouter API key:

1. Generate new key on OpenRouter dashboard
2. Update `backend/.env` with new key
3. Restart backend
4. Delete old key from OpenRouter dashboard
5. Verify new key works

---

## Troubleshooting

### Error: "OpenRouter client not initialized"

**Cause:** API key not configured or invalid

**Solution:**
1. Check `backend/.env` has `OPENROUTER_API_KEY`
2. Verify key starts with `sk-or-`
3. Check key is not commented out
4. Restart backend

### Error: "Model not found"

**Cause:** Invalid model name in `OPENROUTER_MODEL`

**Solution:**
1. Check model name at https://openrouter.ai/models
2. Update `OPENROUTER_MODEL` in `.env`
3. Restart backend

### Error: "Insufficient credits"

**Cause:** OpenRouter account has no credits

**Solution:**
1. Go to https://openrouter.ai/credits
2. Add credits to your account
3. Try again

### AI Features Not Working

**Check:**
1. Backend logs show "Using OpenRouter AI service"
2. API key is set correctly in `.env`
3. `openai` library is installed: `pip show openai`
4. Backend restarted after configuration changes

---

## Cost Management

### Monitoring Usage

1. Go to https://openrouter.ai/activity
2. View usage by model and date
3. Set up spending alerts

### Cost Optimization Tips

- Use cheaper models for simple tasks (Gemini Pro, Llama)
- Use expensive models for complex tasks (GPT-4, Claude)
- Set `OPENROUTER_MODEL` based on your needs
- Monitor usage regularly
- Set spending limits

### Estimated Costs

Based on typical task management usage:

- **Light use** (10 messages/day): ~$1-2/month
- **Medium use** (50 messages/day): ~$5-10/month
- **Heavy use** (200 messages/day): ~$20-40/month

Actual costs depend on model choice and message length.

---

## API Reference

### OpenRouter Endpoints

**Base URL:** `https://openrouter.ai/api/v1`

**Authentication:**
```
Authorization: Bearer sk-or-v1-your-key-here
```

**Chat Completion:**
```
POST /chat/completions
```

See full API docs: https://openrouter.ai/docs

---

## Support

### OpenRouter Support

- Documentation: https://openrouter.ai/docs
- Discord: https://discord.gg/openrouter
- Email: help@openrouter.ai

### Application Support

- Check backend logs for errors
- Review this documentation
- Verify environment configuration
- Test with simple messages first

---

## Changelog

### 2026-01-28 - Initial OpenRouter Integration

**Added:**
- OpenRouter API support with multiple models
- Automatic service selection (OpenRouter/Gemini)
- Secure API key management
- Interactive setup script
- Comprehensive documentation

**Security:**
- All API keys protected in environment variables
- Keys excluded from git via .gitignore
- Validation and error handling
- No keys exposed in logs or responses

**Compatibility:**
- Backward compatible with Gemini
- Automatic fallback if OpenRouter not configured
- No breaking changes to existing functionality

---

## Next Steps

1. **Get your OpenRouter API key** from https://openrouter.ai/keys
2. **Run setup script:** `python backend/setup_env.py`
3. **Start backend** and test AI features
4. **Monitor usage** on OpenRouter dashboard
5. **Optimize costs** by choosing appropriate models

---

**Documentation Version:** 1.0
**Last Updated:** 2026-01-28
**Author:** Claude Sonnet 4.5
