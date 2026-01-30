#!/usr/bin/env python3
"""
Secure Environment Setup Script
Helps users configure their .env file safely without hardcoding credentials
"""

import os
import sys
import secrets
from pathlib import Path

# Set UTF-8 encoding for Windows console
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')


def generate_secret_key(length=64):
    """Generate a cryptographically secure random secret key"""
    return secrets.token_urlsafe(length)


def check_env_file():
    """Check if .env file exists"""
    env_path = Path(__file__).parent / ".env"
    return env_path.exists()


def create_env_from_template():
    """Create .env file from .env.example template"""
    env_example = Path(__file__).parent / ".env.example"
    env_file = Path(__file__).parent / ".env"

    if not env_example.exists():
        print("[ERROR] .env.example template not found!")
        return False

    # Read template
    with open(env_example, 'r') as f:
        template = f.read()

    # Generate secure secret
    secure_secret = generate_secret_key()

    # Replace placeholder with generated secret
    template = template.replace(
        'your-secret-key-change-in-production',
        secure_secret
    )

    # Write to .env
    with open(env_file, 'w') as f:
        f.write(template)

    print(f"[OK] Created .env file with secure random secret")
    return True


def prompt_for_api_key():
    """Prompt user to add their AI API key (OpenRouter or Gemini)"""
    print("\n" + "="*60)
    print("AI API KEY SETUP")
    print("="*60)
    print("\nTo use AI chatbot features, you need an API key.")
    print("\n[RECOMMENDED] OpenRouter API")
    print("   - Supports multiple AI models (Claude, GPT-4, etc.)")
    print("   - Get your key from: https://openrouter.ai/keys")
    print("\n[ALTERNATIVE] Google Gemini API")
    print("   - Google's AI model")
    print("   - Get your key from: https://aistudio.google.com/app/apikey")
    print("\n[WARNING] Keep your API key secret! Never commit it to git.")
    print("\nOptions:")
    print("  1. Add OpenRouter API key (Recommended)")
    print("  2. Add Gemini API key (Legacy)")
    print("  3. Skip (you can add it later by editing backend/.env)")

    choice = input("\nYour choice (1, 2, or 3): ").strip()

    if choice == "1":
        # OpenRouter setup
        api_key = input("\nPaste your OpenRouter API key: ").strip()

        if not api_key:
            print("[ERROR] No API key provided. Skipping...")
            return False

        if not api_key.startswith("sk-or-"):
            print("[WARNING] OpenRouter API keys typically start with 'sk-or-'")
            confirm = input("Continue anyway? (y/n): ").strip().lower()
            if confirm != 'y':
                print("[CANCELLED]")
                return False

        # Ask for model preference
        print("\n[INFO] Popular OpenRouter models:")
        print("  - anthropic/claude-3.5-sonnet (Recommended)")
        print("  - openai/gpt-4-turbo")
        print("  - google/gemini-pro")
        print("  - meta-llama/llama-3.1-70b-instruct")

        model = input("\nEnter model name (or press Enter for default): ").strip()
        if not model:
            model = "anthropic/claude-3.5-sonnet"

        # Update .env file
        env_file = Path(__file__).parent / ".env"
        with open(env_file, 'r') as f:
            content = f.read()

        # Replace placeholders
        content = content.replace(
            'OPENROUTER_API_KEY=your-openrouter-api-key-here',
            f'OPENROUTER_API_KEY={api_key}'
        )
        content = content.replace(
            'OPENROUTER_MODEL=anthropic/claude-3.5-sonnet',
            f'OPENROUTER_MODEL={model}'
        )

        with open(env_file, 'w') as f:
            f.write(content)

        print(f"[OK] OpenRouter API key added with model: {model}")
        return True

    elif choice == "2":
        # Gemini setup (legacy)
        api_key = input("\nPaste your Gemini API key: ").strip()

        if not api_key:
            print("[ERROR] No API key provided. Skipping...")
            return False

        if not api_key.startswith("AIza"):
            print("[WARNING] Gemini API keys typically start with 'AIza'")
            confirm = input("Continue anyway? (y/n): ").strip().lower()
            if confirm != 'y':
                print("[CANCELLED]")
                return False

        # Update .env file
        env_file = Path(__file__).parent / ".env"
        with open(env_file, 'r') as f:
            content = f.read()

        # Uncomment and replace Gemini key
        content = content.replace(
            '# GEMINI_API_KEY=your-gemini-api-key-here',
            f'GEMINI_API_KEY={api_key}'
        )

        with open(env_file, 'w') as f:
            f.write(content)

        print("[OK] Gemini API key added to .env file")
        return True

    print("\n[SKIPPED] You can add your API key later by editing backend/.env")
    return False


def validate_env_file():
    """Validate that .env file has required variables"""
    env_file = Path(__file__).parent / ".env"

    if not env_file.exists():
        print("[ERROR] .env file not found!")
        return False

    with open(env_file, 'r') as f:
        content = f.read()

    required_vars = ['DATABASE_URL', 'BETTER_AUTH_SECRET']
    missing_vars = []

    for var in required_vars:
        if f'{var}=' not in content:
            missing_vars.append(var)

    if missing_vars:
        print(f"[ERROR] Missing required variables: {', '.join(missing_vars)}")
        return False

    # Check for placeholder values
    if 'your-secret-key-change-in-production' in content:
        print("[WARNING] BETTER_AUTH_SECRET still has placeholder value")
        print("   Run this script again to generate a secure secret")
        return False

    # Check AI API key configuration
    has_openrouter = 'OPENROUTER_API_KEY=' in content and 'your-openrouter-api-key-here' not in content
    has_gemini = 'GEMINI_API_KEY=' in content and 'your-gemini-api-key-here' not in content and '# GEMINI_API_KEY=' not in content

    if not has_openrouter and not has_gemini:
        print("[INFO] No AI API key configured (AI chatbot features will be disabled)")
        print("   - Add OpenRouter key (recommended): https://openrouter.ai/keys")
        print("   - Or add Gemini key: https://aistudio.google.com/app/apikey")
    elif has_openrouter:
        print("[OK] OpenRouter API key configured")
    elif has_gemini:
        print("[OK] Gemini API key configured (legacy)")

    print("[OK] Environment configuration is valid")
    return True


def main():
    """Main setup process"""
    print("\n" + "="*60)
    print("SECURE ENVIRONMENT SETUP")
    print("="*60)

    # Check if .env already exists
    if check_env_file():
        print("\n[OK] .env file already exists")

        # Validate it
        if validate_env_file():
            print("\n[SUCCESS] Your environment is properly configured!")

            # Ask if they want to update API key
            update = input("\nDo you want to update your Gemini API key? (y/n): ").strip().lower()
            if update == 'y':
                prompt_for_api_key()
        else:
            print("\n[WARNING] Your .env file needs attention.")
            recreate = input("Recreate .env file from template? (y/n): ").strip().lower()
            if recreate == 'y':
                create_env_from_template()
                prompt_for_api_key()
                validate_env_file()
    else:
        print("\n[INFO] .env file not found. Creating from template...")

        if create_env_from_template():
            prompt_for_api_key()
            validate_env_file()

    print("\n" + "="*60)
    print("SETUP COMPLETE")
    print("="*60)
    print("\nNext steps:")
    print("   1. Review backend/.env file")
    print("   2. Update DATABASE_URL with your database credentials")
    print("   3. Start the backend: python -m uvicorn src.main:app --reload")
    print("\nSecurity reminders:")
    print("   - Never commit .env files to git")
    print("   - Never share your API keys")
    print("   - Use different secrets for development and production")
    print("\n")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n[CANCELLED] Setup cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n[ERROR] {e}")
        sys.exit(1)
