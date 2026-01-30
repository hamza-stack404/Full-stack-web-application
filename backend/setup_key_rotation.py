"""
Quick Setup Helper for API Key Rotation

This interactive script helps you configure multiple Gemini API keys
for automatic rotation.

Usage:
    python setup_key_rotation.py
"""

import os
import sys
from pathlib import Path


def print_header():
    """Print welcome header."""
    print("=" * 70)
    print("🔄 API Key Rotation Setup Helper")
    print("=" * 70)
    print()
    print("This script will help you configure multiple Gemini API keys")
    print("for automatic rotation when quota limits are reached.")
    print()


def get_existing_keys():
    """Check for existing keys in .env file."""
    env_path = Path(__file__).parent / ".env"

    if not env_path.exists():
        return []

    with open(env_path, "r") as f:
        content = f.read()

    # Look for GEMINI_API_KEYS
    for line in content.split("\n"):
        if line.startswith("GEMINI_API_KEYS="):
            keys_str = line.split("=", 1)[1].strip()
            if keys_str and not keys_str.startswith("your-"):
                keys = [k.strip() for k in keys_str.split(",") if k.strip()]
                return keys

    # Look for single key
    for line in content.split("\n"):
        if line.startswith("GEMINI_API_KEY="):
            key = line.split("=", 1)[1].strip()
            if key and not key.startswith("your-"):
                return [key]

    return []


def validate_key(key):
    """Validate API key format."""
    if not key:
        return False, "Key is empty"

    if not key.startswith("AIzaSy"):
        return False, "Key should start with 'AIzaSy'"

    if len(key) < 30:
        return False, "Key is too short (should be 39 characters)"

    if len(key) > 50:
        return False, "Key is too long"

    return True, "Valid"


def collect_keys():
    """Interactively collect API keys from user."""
    print("📝 Enter Your API Keys")
    print("-" * 70)
    print()
    print("Get your API keys from: https://aistudio.google.com/app/apikey")
    print()
    print("Tips:")
    print("  - Create 2-3 keys for automatic rotation")
    print("  - Each key gets 20 requests/day on free tier")
    print("  - Press Enter without typing to finish")
    print()

    keys = []
    key_num = 1

    while True:
        if key_num == 1:
            prompt = f"Enter API Key #{key_num} (required): "
        else:
            prompt = f"Enter API Key #{key_num} (optional, press Enter to finish): "

        key = input(prompt).strip()

        # If empty and we have at least one key, we're done
        if not key:
            if keys:
                break
            else:
                print("❌ You must enter at least one API key!")
                continue

        # Validate key
        is_valid, message = validate_key(key)
        if not is_valid:
            print(f"❌ Invalid key: {message}")
            continue

        # Check for duplicates
        if key in keys:
            print("⚠️  This key was already entered. Skipping duplicate.")
            continue

        # Add key
        keys.append(key)
        masked = f"{key[:4]}...{key[-3:]}"
        print(f"✅ Key #{key_num} added: {masked}")
        print()

        key_num += 1

        # Limit to 5 keys
        if len(keys) >= 5:
            print("ℹ️  Maximum of 5 keys reached.")
            break

    return keys


def update_env_file(keys):
    """Update .env file with the keys."""
    env_path = Path(__file__).parent / ".env"

    # Read existing .env or create new
    if env_path.exists():
        with open(env_path, "r") as f:
            lines = f.readlines()
    else:
        lines = []

    # Remove old key configurations
    new_lines = []
    skip_next = False

    for line in lines:
        # Skip old key lines
        if line.startswith("GEMINI_API_KEY"):
            continue
        if line.startswith("GOOGLE_API_KEY"):
            continue
        new_lines.append(line)

    # Add new configuration
    keys_str = ",".join(keys)

    # Find a good place to insert (after DATABASE_URL or at the end)
    insert_index = len(new_lines)
    for i, line in enumerate(new_lines):
        if "DATABASE_URL" in line:
            insert_index = i + 1
            break

    # Insert the keys
    if insert_index < len(new_lines):
        new_lines.insert(insert_index, "\n")
        new_lines.insert(insert_index + 1, "# Gemini API Keys (Automatic Rotation)\n")
        new_lines.insert(insert_index + 2, f"GEMINI_API_KEYS={keys_str}\n")
    else:
        new_lines.append("\n")
        new_lines.append("# Gemini API Keys (Automatic Rotation)\n")
        new_lines.append(f"GEMINI_API_KEYS={keys_str}\n")

    # Write back
    with open(env_path, "w") as f:
        f.writelines(new_lines)

    print(f"✅ Updated {env_path}")


def main():
    """Main setup flow."""
    print_header()

    # Check for existing keys
    existing_keys = get_existing_keys()
    if existing_keys:
        print(f"ℹ️  Found {len(existing_keys)} existing key(s) in .env file")
        for i, key in enumerate(existing_keys, 1):
            masked = f"{key[:4]}...{key[-3:]}"
            print(f"   Key #{i}: {masked}")
        print()

        response = input("Do you want to replace them? (y/N): ").strip().lower()
        if response not in ["y", "yes"]:
            print("\nSetup cancelled. Your existing keys are unchanged.")
            return

        print()

    # Collect keys
    keys = collect_keys()

    if not keys:
        print("\n❌ No keys entered. Setup cancelled.")
        return

    # Summary
    print()
    print("=" * 70)
    print("📋 Summary")
    print("=" * 70)
    print(f"Total keys configured: {len(keys)}")
    print(f"Daily quota: {len(keys) * 20} requests ({len(keys)} keys × 20 requests)")
    print()

    for i, key in enumerate(keys, 1):
        masked = f"{key[:4]}...{key[-3:]}"
        print(f"  Key #{i}: {masked}")

    print()

    # Confirm
    response = input("Save this configuration? (Y/n): ").strip().lower()
    if response in ["n", "no"]:
        print("\nSetup cancelled.")
        return

    # Update .env
    try:
        update_env_file(keys)
        print()
        print("=" * 70)
        print("✅ Setup Complete!")
        print("=" * 70)
        print()
        print("Next steps:")
        print("1. Validate setup: python validate_key_rotation.py")
        print("2. Start backend: python start_server.py")
        print("3. Test chatbot: http://localhost:3000/chat")
        print()
        print("The system will automatically rotate keys when quota limits are reached.")
        print()

    except Exception as e:
        print(f"\n❌ Error updating .env file: {str(e)}")
        return


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nSetup cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
