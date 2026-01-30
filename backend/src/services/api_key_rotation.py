"""
API Key Rotation Service for Gemini API

This service manages multiple API keys and automatically rotates to the next
available key when quota limits are reached (429 errors).

Security Features:
- Keys stored in environment variables only
- Keys masked in logs
- No keys exposed in error messages
- Secure key validation
"""

import os
import logging
from typing import List, Optional
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class APIKeyRotationService:
    """
    Manages multiple Gemini API keys with automatic rotation on quota exhaustion.

    Usage:
        rotation_service = APIKeyRotationService()
        current_key = rotation_service.get_current_key()

        # On 429 error:
        rotation_service.rotate_key()
        new_key = rotation_service.get_current_key()
    """

    def __init__(self):
        """Initialize the rotation service with keys from environment variables."""
        self.keys: List[str] = []
        self.current_index: int = 0
        self.exhausted_keys: set = set()
        self.last_rotation_time: Optional[datetime] = None
        self.rotation_cooldown: timedelta = timedelta(seconds=30)

        # Load keys from environment
        self._load_keys()

        if not self.keys:
            logger.error("No API keys configured. Please set GEMINI_API_KEYS in .env")
            raise ValueError("No API keys available")

        logger.info(f"API Key Rotation Service initialized with {len(self.keys)} key(s)")

    def _load_keys(self):
        """Load API keys from environment variables."""
        # Try GEMINI_API_KEYS first (comma-separated list)
        keys_str = os.getenv("GEMINI_API_KEYS", "")

        if keys_str:
            # Split by comma and strip whitespace
            self.keys = [key.strip() for key in keys_str.split(",") if key.strip()]
        else:
            # Fallback to single key
            single_key = os.getenv("GEMINI_API_KEY", "") or os.getenv("GOOGLE_API_KEY", "")
            if single_key:
                self.keys = [single_key.strip()]

        # Remove duplicates while preserving order
        seen = set()
        unique_keys = []
        for key in self.keys:
            if key not in seen:
                seen.add(key)
                unique_keys.append(key)
        self.keys = unique_keys

    def get_current_key(self) -> str:
        """
        Get the current active API key.

        Returns:
            str: The current API key

        Raises:
            ValueError: If all keys are exhausted
        """
        if not self.keys:
            raise ValueError("No API keys available")

        if len(self.exhausted_keys) >= len(self.keys):
            # All keys exhausted - reset after cooldown
            if self._should_reset_exhausted_keys():
                logger.info("Resetting exhausted keys after cooldown period")
                self.exhausted_keys.clear()
                self.current_index = 0
            else:
                raise ValueError(
                    "All API keys have reached their quota limits. "
                    "Please wait for quota reset or add more keys."
                )

        return self.keys[self.current_index]

    def rotate_key(self, reason: str = "quota_exceeded") -> bool:
        """
        Rotate to the next available API key.

        Args:
            reason: Reason for rotation (for logging)

        Returns:
            bool: True if rotation successful, False if all keys exhausted
        """
        if not self.keys:
            return False

        # Mark current key as exhausted
        current_key = self.keys[self.current_index]
        self.exhausted_keys.add(current_key)

        masked_key = self._mask_key(current_key)
        logger.warning(
            f"Rotating API key due to {reason}. "
            f"Key {masked_key} marked as exhausted."
        )

        # Try to find next available key
        attempts = 0
        max_attempts = len(self.keys)

        while attempts < max_attempts:
            self.current_index = (self.current_index + 1) % len(self.keys)
            next_key = self.keys[self.current_index]

            if next_key not in self.exhausted_keys:
                self.last_rotation_time = datetime.now()
                masked_next = self._mask_key(next_key)
                logger.info(f"Rotated to new API key: {masked_next}")
                return True

            attempts += 1

        # All keys exhausted
        logger.error("All API keys have been exhausted")
        return False

    def _should_reset_exhausted_keys(self) -> bool:
        """
        Check if enough time has passed to reset exhausted keys.

        Gemini free tier resets daily, so we reset after 24 hours.
        """
        if not self.last_rotation_time:
            return False

        time_since_rotation = datetime.now() - self.last_rotation_time
        # Reset after 24 hours (daily quota reset)
        return time_since_rotation > timedelta(hours=24)

    def _mask_key(self, key: str) -> str:
        """
        Mask an API key for safe logging.

        Args:
            key: The API key to mask

        Returns:
            str: Masked key (e.g., "AIza...AAU")
        """
        if not key or len(key) < 8:
            return "***"
        return f"{key[:4]}...{key[-3:]}"

    def get_status(self) -> dict:
        """
        Get current status of the rotation service.

        Returns:
            dict: Status information
        """
        return {
            "total_keys": len(self.keys),
            "current_index": self.current_index,
            "exhausted_keys": len(self.exhausted_keys),
            "available_keys": len(self.keys) - len(self.exhausted_keys),
            "current_key_masked": self._mask_key(self.keys[self.current_index]) if self.keys else None,
            "last_rotation": self.last_rotation_time.isoformat() if self.last_rotation_time else None
        }

    def reset_exhausted_keys(self):
        """Manually reset all exhausted keys (for testing or manual intervention)."""
        logger.info("Manually resetting all exhausted keys")
        self.exhausted_keys.clear()
        self.current_index = 0
        self.last_rotation_time = None


# Global singleton instance
_rotation_service: Optional[APIKeyRotationService] = None


def get_rotation_service() -> APIKeyRotationService:
    """
    Get the global API key rotation service instance.

    Returns:
        APIKeyRotationService: The singleton instance
    """
    global _rotation_service
    if _rotation_service is None:
        _rotation_service = APIKeyRotationService()
    return _rotation_service


def reset_rotation_service():
    """Reset the global rotation service (for testing)."""
    global _rotation_service
    _rotation_service = None
