"""
API Key Rotation Setup Validator

This script validates your API key rotation configuration and tests
that the system is working correctly.

Usage:
    python validate_key_rotation.py
"""

import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from dotenv import load_dotenv

# Load environment variables
load_dotenv()


def validate_environment():
    """Validate environment variables for API key rotation."""
    print("🔍 Validating Environment Configuration...\n")

    issues = []
    warnings = []

    # Check for API keys
    gemini_api_keys = os.getenv("GEMINI_API_KEYS", "")
    gemini_api_key = os.getenv("GEMINI_API_KEY", "")
    google_api_key = os.getenv("GOOGLE_API_KEY", "")

    if gemini_api_keys:
        keys = [k.strip() for k in gemini_api_keys.split(",") if k.strip()]
        print(f"✅ GEMINI_API_KEYS found: {len(keys)} key(s) configured")

        # Validate key format
        for i, key in enumerate(keys, 1):
            if not key.startswith("AIzaSy"):
                issues.append(f"Key #{i} doesn't start with 'AIzaSy' - may be invalid")
            elif len(key) < 30:
                issues.append(f"Key #{i} is too short - may be invalid")
            else:
                print(f"   ✓ Key #{i}: {key[:4]}...{key[-3:]} (valid format)")

        if len(keys) == 1:
            warnings.append("Only 1 key configured - no rotation will occur")
        elif len(keys) >= 2:
            print(f"   ✓ Rotation enabled with {len(keys)} keys")

    elif gemini_api_key or google_api_key:
        key = gemini_api_key or google_api_key
        print(f"⚠️  Single key mode: GEMINI_API_KEY or GOOGLE_API_KEY found")
        print(f"   Key: {key[:4]}...{key[-3:]}")
        warnings.append(
            "Using single key mode - no automatic rotation. "
            "Consider using GEMINI_API_KEYS with multiple keys."
        )
    else:
        issues.append(
            "No API keys found! Set GEMINI_API_KEYS in .env file. "
            "Example: GEMINI_API_KEYS=key1,key2,key3"
        )

    # Check other required variables
    if not os.getenv("DATABASE_URL"):
        issues.append("DATABASE_URL not set")

    if not os.getenv("BETTER_AUTH_SECRET"):
        issues.append("BETTER_AUTH_SECRET not set")

    print()
    return issues, warnings


def test_rotation_service():
    """Test the API key rotation service."""
    print("🧪 Testing API Key Rotation Service...\n")

    try:
        from src.services.api_key_rotation import APIKeyRotationService

        # Initialize service
        service = APIKeyRotationService()
        print("✅ Rotation service initialized successfully")

        # Get status
        status = service.get_status()
        print(f"\n📊 Current Status:")
        print(f"   Total Keys: {status['total_keys']}")
        print(f"   Available Keys: {status['available_keys']}")
        print(f"   Exhausted Keys: {status['exhausted_keys']}")
        print(f"   Current Key: {status['current_key_masked']}")

        if status['total_keys'] == 0:
            print("\n❌ No keys configured!")
            return False

        if status['total_keys'] == 1:
            print("\n⚠️  Only 1 key - rotation disabled")
            return True

        # Test rotation
        print(f"\n🔄 Testing key rotation...")
        original_key = service.get_current_key()
        print(f"   Original key: {service._mask_key(original_key)}")

        success = service.rotate_key(reason="test")
        if success:
            new_key = service.get_current_key()
            print(f"   New key: {service._mask_key(new_key)}")

            if new_key != original_key:
                print("   ✅ Rotation successful - keys are different")
            else:
                print("   ⚠️  Rotation occurred but key is the same (only 1 key available)")
        else:
            print("   ❌ Rotation failed")
            return False

        # Reset for clean state
        service.reset_exhausted_keys()
        print("   ✅ Reset exhausted keys")

        return True

    except Exception as e:
        print(f"❌ Error testing rotation service: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def test_agent_service():
    """Test that the agent service can initialize with rotation."""
    print("\n🤖 Testing Agent Service Integration...\n")

    try:
        # Just try to import - don't actually call the API
        from src.services import agent_service

        if agent_service.client is None:
            print("❌ Agent service client not initialized")
            return False

        if agent_service.rotation_service is None:
            print("⚠️  Agent service not using rotation service")
            return False

        print("✅ Agent service initialized with rotation support")
        return True

    except Exception as e:
        print(f"❌ Error testing agent service: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run all validation checks."""
    print("=" * 60)
    print("API Key Rotation Setup Validator")
    print("=" * 60)
    print()

    # Validate environment
    issues, warnings = validate_environment()

    # Show warnings
    if warnings:
        print("⚠️  Warnings:")
        for warning in warnings:
            print(f"   - {warning}")
        print()

    # Show issues
    if issues:
        print("❌ Issues Found:")
        for issue in issues:
            print(f"   - {issue}")
        print()
        print("Please fix these issues and run the validator again.")
        return False

    # Test rotation service
    if not test_rotation_service():
        print("\n❌ Rotation service test failed")
        return False

    # Test agent service
    if not test_agent_service():
        print("\n❌ Agent service test failed")
        return False

    # Success
    print("\n" + "=" * 60)
    print("✅ All Checks Passed!")
    print("=" * 60)
    print()
    print("Your API key rotation setup is working correctly!")
    print()
    print("Next steps:")
    print("1. Start your backend server: python start_server.py")
    print("2. Test the chatbot at: http://localhost:3000/chat")
    print("3. Monitor rotation status at: http://localhost:8001/api/admin/key-rotation-status")
    print()

    return True


if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\nValidation cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
