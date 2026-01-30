# API Key Rotation Setup Guide

## 🔄 Automatic API Key Rotation for Gemini Free Tier

This guide explains how to set up automatic API key rotation to maximize your usage of Gemini's free tier (20 requests/day per key).

---

## 📋 Overview

**Problem:** Gemini free tier only allows 20 requests per day per API key.

**Solution:** Configure multiple API keys that automatically rotate when quota limits are reached.

**Benefits:**
- ✅ Automatic failover when quota is exhausted
- ✅ No manual intervention required
- ✅ Multiply your daily quota (2 keys = 40 requests/day, 3 keys = 60 requests/day)
- ✅ Secure key management (keys never exposed in logs)
- ✅ Daily automatic reset

---

## 🔑 Step 1: Generate Multiple API Keys

### Create Backup Keys

1. **Go to Google AI Studio:**
   https://aistudio.google.com/app/apikey

2. **Create your first key:**
   - Click "Create API Key"
   - Copy the key (starts with `AIzaSy...`)
   - Save it securely

3. **Create backup keys:**
   - Click "Create API Key" again
   - Repeat 1-2 more times
   - You should have 2-3 keys total

**Recommended:** Create at least 2 keys for automatic rotation.

---

## ⚙️ Step 2: Configure Environment Variables

### Option A: Multiple Keys (Recommended)

Open `backend/.env` and add:

```env
# Multiple keys with automatic rotation (comma-separated)
GEMINI_API_KEYS=AIzaSyAbc123...,AIzaSyDef456...,AIzaSyGhi789...
```

**Important:**
- Separate keys with commas (no spaces)
- No quotes around the keys
- No spaces before or after commas

**Example with 3 keys:**
```env
GEMINI_API_KEYS=AIzaSyCaUvRUU6CCtvMVPkmST2oK2RLuhOIIAAU,AIzaSyB_Zk23s5BYaKHjVw-ybsp9W9LA7asjDnM,AIzaSyBSAOREv_t4BOQmxrnba9JKf062LK2rMe8
```

### Option B: Single Key (Basic)

If you only have one key:

```env
# Single key (no rotation)
GEMINI_API_KEY=AIzaSyAbc123...
```

**Note:** The system will still work but won't have automatic rotation.

---

## 🚀 Step 3: Restart Backend Server

After updating `.env`, restart your backend:

```bash
# Stop the current backend (Ctrl+C)

# Restart
cd backend
python start_server.py
```

**Look for this in the logs:**
```
INFO: API key rotation service initialized with 3 key(s)
INFO: Gemini client initialized successfully with rotation service
```

---

## ✅ Step 4: Verify Setup

### Test the Chatbot

1. Open your app: http://localhost:3000/chat
2. Send a message: "Hello"
3. You should get a response from the AI

### Check Rotation Status

Send a request to the status endpoint:

```bash
curl http://localhost:8001/api/admin/key-rotation-status
```

**Expected response:**
```json
{
  "total_keys": 3,
  "current_index": 0,
  "exhausted_keys": 0,
  "available_keys": 3,
  "current_key_masked": "AIza...AAU",
  "last_rotation": null
}
```

---

## 🔄 How Automatic Rotation Works

### Normal Operation

1. **Request comes in** → Uses Key #1
2. **Key #1 hits quota (20 requests)** → Automatically switches to Key #2
3. **Key #2 hits quota** → Automatically switches to Key #3
4. **All keys exhausted** → Shows user-friendly error message

### Daily Reset

- Gemini quotas reset every 24 hours
- After 24 hours, all keys become available again
- System automatically resets exhausted keys

### User Experience

**When quota is reached:**
```
⚠️ I've reached the API quota limit. Switching to backup key...
Please try your request again in a moment.
```

**When all keys exhausted:**
```
⚠️ All API keys have reached their daily quota limits.
The free tier allows 20 requests per day per key.
Please try again tomorrow, or contact your administrator to add more API keys.
```

---

## 📊 Monitoring Key Usage

### Check Current Status

```bash
# Via API
curl http://localhost:8001/api/admin/key-rotation-status

# Via logs
tail -f backend/logs/app.log | grep "rotation"
```

### What to Monitor

- **total_keys**: How many keys are configured
- **available_keys**: How many keys still have quota
- **exhausted_keys**: How many keys hit their limit
- **last_rotation**: When the last rotation occurred

---

## 🔒 Security Best Practices

### ✅ DO

- ✅ Store keys in `.env` file only
- ✅ Add `.env` to `.gitignore`
- ✅ Use different keys for development and production
- ✅ Rotate keys periodically (every 3-6 months)
- ✅ Monitor key usage via logs

### ❌ DON'T

- ❌ Commit keys to git
- ❌ Share keys in documentation
- ❌ Use the same key across multiple projects
- ❌ Expose keys in error messages
- ❌ Store keys in frontend code

---

## 🐛 Troubleshooting

### Issue: "No API keys available"

**Cause:** `GEMINI_API_KEYS` not set in `.env`

**Solution:**
1. Check `backend/.env` file exists
2. Verify `GEMINI_API_KEYS` is set
3. Restart backend server

### Issue: "All API keys exhausted"

**Cause:** All keys hit their daily quota (20 requests each)

**Solutions:**
1. **Wait 24 hours** for quota reset
2. **Add more keys** to `GEMINI_API_KEYS`
3. **Upgrade to paid tier** for unlimited requests

### Issue: Keys not rotating

**Cause:** Only one key configured

**Solution:**
- Use `GEMINI_API_KEYS` (plural) with multiple keys
- Separate keys with commas

### Issue: "Authentication failed"

**Cause:** Invalid or expired API key

**Solution:**
1. Verify keys are correct (no extra spaces)
2. Check keys haven't been revoked
3. Generate new keys if needed

---

## 📈 Capacity Planning

### Free Tier Limits

| Keys | Daily Requests | Monthly Requests |
|------|----------------|------------------|
| 1 key | 20 | ~600 |
| 2 keys | 40 | ~1,200 |
| 3 keys | 60 | ~1,800 |
| 5 keys | 100 | ~3,000 |

### Recommendations

**Development:**
- 1-2 keys sufficient for testing

**Small Team (2-5 users):**
- 2-3 keys recommended

**Medium Usage (5-10 users):**
- 3-5 keys recommended

**High Usage:**
- Consider upgrading to paid tier
- Unlimited requests
- Better rate limits

---

## 🔧 Advanced Configuration

### Custom Rotation Cooldown

Edit `backend/src/services/api_key_rotation.py`:

```python
# Default: 30 seconds
self.rotation_cooldown: timedelta = timedelta(seconds=30)

# Custom: 60 seconds
self.rotation_cooldown: timedelta = timedelta(seconds=60)
```

### Manual Key Reset

If you need to manually reset exhausted keys:

```python
from src.services.api_key_rotation import get_rotation_service

rotation_service = get_rotation_service()
rotation_service.reset_exhausted_keys()
```

---

## 📝 Example Configurations

### Development (1 key)

```env
GEMINI_API_KEY=AIzaSyAbc123...
```

### Production (3 keys)

```env
GEMINI_API_KEYS=AIzaSyAbc123...,AIzaSyDef456...,AIzaSyGhi789...
```

### High Availability (5 keys)

```env
GEMINI_API_KEYS=AIzaSyKey1...,AIzaSyKey2...,AIzaSyKey3...,AIzaSyKey4...,AIzaSyKey5...
```

---

## 🎯 Summary

1. ✅ Generate 2-3 API keys from Google AI Studio
2. ✅ Add to `.env` as `GEMINI_API_KEYS=key1,key2,key3`
3. ✅ Restart backend server
4. ✅ Verify in logs: "initialized with X key(s)"
5. ✅ Test chatbot functionality
6. ✅ Monitor via `/api/admin/key-rotation-status`

**Your chatbot will now automatically rotate keys when quota limits are reached!**

---

## 📞 Support

**Issues?**
- Check backend logs: `backend/logs/app.log`
- Verify `.env` configuration
- Test with single key first
- Check Google AI Studio for key status

**Need Help?**
- Review error messages in logs
- Check quota status in Google AI Studio
- Verify keys are not revoked or expired

---

**Last Updated:** January 30, 2026
**Version:** 1.0
