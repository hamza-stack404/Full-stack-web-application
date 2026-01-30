# Security Incident Response - API Key Exposure

## Incident Summary
**Date**: January 23, 2026
**Type**: API Key Exposure
**Severity**: HIGH
**Status**: REMEDIATION IN PROGRESS

## Exposed Keys

### Key 1 (Historical)
- **Key**: `AIzaSyB1mwUX2pXv83teK8GP_6U_Lpx2K3HScvc`
- **Exposure**: Committed to git history in SETUP_API_KEY.md
- **Date**: January 15, 2026
- **Removed**: January 20, 2026 (commit feb5f0a)
- **Status**: Already blocked by Google

### Key 2 (Current - Just Exposed)
- **Key**: `AIzaSyC_xnBLuNqatSy6bA1u_aA6qwhoNDxtk1I`
- **Exposure**: Accidentally read during security audit
- **Date**: January 23, 2026
- **Status**: MUST BE REVOKED IMMEDIATELY

## Immediate Actions Required

### ✅ Step 1: Revoke Compromised Keys
1. Go to https://aistudio.google.com/app/apikey
2. Find and revoke BOTH keys listed above
3. Confirm revocation

### ✅ Step 2: Generate New Key
1. Click "Create API Key" in Google AI Studio
2. Copy the new key (keep it secure)
3. Do NOT share it in any chat, commit, or public location

### ✅ Step 3: Update Environment Variables
1. Open `backend/.env.new` in a text editor
2. Replace `YOUR_NEW_KEY_HERE` with your new API key
3. Save the file
4. Rename `.env.new` to `.env`
5. Verify `.env` is in `.gitignore` (it is)

### ✅ Step 4: Restart Services
```bash
cd backend
# Stop current server (Ctrl+C)
uvicorn src.main:app --reload --port 8001
```

### ✅ Step 5: Verify Security
1. Check backend logs for "Gemini client initialized successfully"
2. Test chat functionality at http://localhost:3000/chat
3. Confirm no errors related to API key

## Git History Cleanup (Optional but Recommended)

The old key is in git history. To completely remove it:

```bash
# WARNING: This rewrites git history - coordinate with team first
cd "C:\Users\Noman Traders\Desktop\Todo web full Stack"

# Option 1: Use BFG Repo-Cleaner (recommended)
# Download from: https://rtyley.github.io/bfg-repo-cleaner/
java -jar bfg.jar --replace-text passwords.txt
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Option 2: Use git filter-branch (manual)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch SETUP_API_KEY.md" \
  --prune-empty --tag-name-filter cat -- --all

# After cleanup, force push (if working with remote)
git push origin --force --all
git push origin --force --tags
```

**Note**: Only do this if you're comfortable with git history rewriting. The key is already blocked, so this is optional.

## Prevention Measures Already in Place

✅ **Code Security**
- API key loaded from environment variables only
- No hardcoded keys in source code
- Frontend never accesses API key directly

✅ **Git Security**
- `.env` in `.gitignore`
- `.env.example` template without real keys
- Pre-commit hooks for code quality

✅ **Architecture Security**
- Proper client-server separation
- API key only used in backend
- Frontend calls backend API, not Gemini directly

## Lessons Learned

1. **Never read .env files in shared contexts** (like AI chats)
2. **Always use .env.example templates** for documentation
3. **Rotate keys immediately** after any exposure
4. **Monitor Google AI Studio** for usage anomalies

## Post-Incident Checklist

- [ ] Both old keys revoked in Google AI Studio
- [ ] New key generated
- [ ] `.env` updated with new key
- [ ] Backend restarted successfully
- [ ] Chat functionality tested and working
- [ ] No API key errors in logs
- [ ] This incident documented
- [ ] Team notified (if applicable)

## Contact

If you need help with any of these steps, refer to:
- `SETUP_API_KEY.md` - Setup instructions
- `backend/SECURITY.md` - Security best practices
- Google AI Studio Support - For API key issues

---

**Remember**: The most important step is revoking the exposed keys IMMEDIATELY. Everything else can wait.
