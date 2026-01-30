"""
AI Service Selector
Automatically selects between OpenRouter and Gemini based on available API keys
Prioritizes OpenRouter if both are configured
"""
import os
import logging

logger = logging.getLogger(__name__)

# Check which AI service is available
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Determine which service to use
if OPENROUTER_API_KEY and OPENROUTER_API_KEY != "your-openrouter-api-key-here":
    # OpenRouter is configured and available
    logger.info("Using OpenRouter AI service")
    from .agent_service_openrouter import run_agent
    AI_SERVICE = "openrouter"
elif GEMINI_API_KEY and GEMINI_API_KEY != "your-gemini-api-key-here":
    # Fallback to Gemini if OpenRouter is not configured
    logger.info("Using Gemini AI service (legacy)")
    from .agent_service import run_agent
    AI_SERVICE = "gemini"
else:
    # No AI service configured
    logger.warning("No AI service configured - AI features will be disabled")

    def run_agent(user_id: int, message: str, conversation_history=None):
        """Fallback function when no AI service is configured"""
        return "I'm sorry, but the AI service is not configured. Please contact your administrator to set up an API key for OpenRouter or Gemini."

    AI_SERVICE = "none"

# Export the run_agent function
__all__ = ['run_agent', 'AI_SERVICE']
