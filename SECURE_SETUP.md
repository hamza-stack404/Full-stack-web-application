# 🔒 Secure Setup Guide

This guide helps you set up your Todo application securely without exposing credentials.

## ⚠️ IMPORTANT: API Key Security

**NEVER hardcode API keys in your code!** Always use environment variables.

### 🚨 If You've Exposed API Keys

If you've accidentally committed API keys to git:

1. **Revoke the exposed keys immediately:**
   - Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Delete/revoke any exposed keys
   - Generate new keys

2. **Remove from git history:**
   ```bash
   # This removes sensitive data from git history
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch backend/.env" \
     --prune-empty --tag-name-filter cat -- --all
   ```

3. **Force push (⚠️ WARNING: This rewrites history):**
   ```bash
   git push origin --force --all
   ```

---

## 🚀 Quick Start: Secure Setup

### Option 1: Automated Setup (Recommended)

Run the secure setup script:

```bash
cd backend
python setup_env.py
```

This script will:
- ✅ Create `.env` file from template
- ✅ Generate a cryptographically secure `BETTER_AUTH_SECRET`
- ✅ Prompt you to add your Gemini API key securely
- ✅ Validate your configuration

### Option 2: Manual Setup

1. **Copy the template:**
   ```bash
   cd backend
   cp .env.example .env
   ```

2. **Generate a secure secret:**
   ```bash
   # On Linux/Mac:
   openssl rand -base64 48

   # On Windows (PowerShell):
   [Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
   ```

3. **Edit `backend/.env`:**
   ```bash
   # Use a text editor (NOT git-tracked files)
   notepad backend/.env  # Windows
   nano backend/.env     # Linux/Mac
   ```

4. **Add your credentials:**
   ```env
   DATABASE_URL=your-database-url-here
   BETTER_AUTH_SECRET=<paste-generated-secret-here>
   GEMINI_API_KEY=<your-api-key-here>
   ```

5. **Verify `.env` is in `.gitignore`:**
   ```bash
   git check-ignore backend/.env
   # Should output: backend/.env
   ```

---

## 🔑 Getting Your Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key (starts with `AIza...`)
5. Add it to `backend/.env` file

**Security Tips:**
- ✅ Store keys in `.env` files (never in code)
- ✅ Use different keys for development and production
- ✅ Rotate keys regularly
- ❌ Never commit `.env` files to git
- ❌ Never share keys in chat, email, or screenshots

---

## 🛡️ Security Checklist

Before running your application:

- [ ] `.env` file exists and contains your credentials
- [ ] `.env` is listed in `.gitignore`
- [ ] `BETTER_AUTH_SECRET` is a strong random value (not the default)
- [ ] `GEMINI_API_KEY` is your actual API key (if using AI features)
- [ ] No hardcoded credentials in `start_backend.bat` or other scripts
- [ ] No API keys in `.claude/settings.local.json`
- [ ] Run `git grep -i "AIza"` returns no results (no exposed keys)

---

## 🔍 Verify Your Setup

Check for exposed secrets:

```bash
# Check git-tracked files for API keys
git grep -i "AIza"

# Should return nothing. If it finds keys, they're exposed!
```

Check `.env` file is ignored:

```bash
git status

# .env should NOT appear in untracked files
# If it does, add it to .gitignore
```

---

## 🚨 Emergency: Key Exposure Response

If you discover exposed API keys:

### Immediate Actions (Do within 5 minutes):

1. **Revoke the key:**
   - [Google AI Studio](https://aistudio.google.com/app/apikey) → Delete key

2. **Generate new key:**
   - Create a new API key
   - Update `backend/.env` with new key

3. **Remove from git:**
   ```bash
   # If not yet pushed:
   git reset HEAD~1  # Undo last commit

   # If already pushed:
   # Contact your team immediately
   # Follow git history rewrite procedure above
   ```

### Follow-up Actions (Within 24 hours):

1. Review all commits for other exposed secrets
2. Update all deployment environments with new keys
3. Monitor API usage for suspicious activity
4. Document the incident for future prevention

---

## 📚 Additional Resources

- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [GitHub: Removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [Google Cloud: API Key Best Practices](https://cloud.google.com/docs/authentication/api-keys)

---

## 🆘 Need Help?

If you're unsure about any security aspect:

1. **Don't commit anything yet**
2. Review this guide carefully
3. Run the automated setup script: `python backend/setup_env.py`
4. Verify with the security checklist above

**Remember:** It's better to ask for help than to expose credentials!
