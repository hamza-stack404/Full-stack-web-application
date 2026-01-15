# Security Guidelines for Phase III AI Chatbot

## API Key Security

### Setting Up Your Gemini API Key

1. **Get Your API Key**
   - Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Create a new API key or use an existing one
   - **NEVER share this key or commit it to version control**

2. **Configure Environment Variables**
   - Copy the `.env.example` file to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Edit `.env` and replace `your-gemini-api-key-here` with your actual API key
   - The `.env` file is already in `.gitignore` and will not be committed

3. **Verify Security**
   - Check that `.env` is listed in `.gitignore`
   - Never commit `.env` files to git
   - Never log or print API keys in code
   - Never share `.env` files via email, chat, or other channels

### API Key Protection Measures

This application implements the following security measures:

1. **Environment Variable Storage**
   - API keys are stored in `.env` files, not in code
   - `.env` files are excluded from version control via `.gitignore`

2. **Validation on Startup**
   - The application checks if `GEMINI_API_KEY` is set on initialization
   - Logs errors (without exposing the key) if the key is missing or invalid
   - Gracefully handles missing API keys with user-friendly error messages

3. **Error Handling**
   - API errors are logged without exposing sensitive information
   - Users receive generic error messages, not raw API responses
   - Exception types are logged, but not full exception details that might contain keys

4. **No Key Exposure**
   - API keys are never logged in full
   - API keys are never included in error messages
   - API keys are never sent to the frontend

### What to Do If Your API Key Is Compromised

If you suspect your API key has been leaked or compromised:

1. **Immediately revoke the key** in [Google AI Studio](https://aistudio.google.com/app/apikey)
2. **Generate a new API key**
3. **Update your `.env` file** with the new key
4. **Restart the backend server** to load the new key
5. **Review your git history** to ensure the key was never committed:
   ```bash
   git log --all --full-history -- "*/.env" "**/.env" ".env"
   ```

### Best Practices

- **Use different API keys** for development, staging, and production
- **Rotate API keys** periodically (e.g., every 90 days)
- **Monitor API usage** in Google AI Studio for unexpected activity
- **Set up usage quotas** to limit potential abuse
- **Never commit** `.env` files, even to private repositories
- **Use secrets management** tools (like AWS Secrets Manager, Azure Key Vault) in production

### Checking Your Configuration

To verify your API key is properly configured:

1. Start the backend server
2. Check the logs for: `"Gemini client initialized successfully"`
3. If you see `"GEMINI_API_KEY environment variable is not set"`, check your `.env` file
4. Test the chat functionality to ensure the AI responds correctly

### Production Deployment

For production environments:

- **Do not use `.env` files** - use your platform's secrets management
- **Set environment variables** through your hosting platform (Vercel, Railway, etc.)
- **Enable API key restrictions** in Google Cloud Console
- **Set up monitoring** for API usage and errors
- **Use HTTPS** for all API communications (already enforced by FastAPI)
