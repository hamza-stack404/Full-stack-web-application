"""
Admin API endpoints for monitoring and managing the application.
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any
import logging

from ..auth import get_current_user
from ..services.api_key_rotation import get_rotation_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/key-rotation-status")
async def get_key_rotation_status(current_user: dict = Depends(get_current_user)) -> Dict[str, Any]:
    """
    Get the current status of the API key rotation service.

    Returns:
        dict: Status information including:
            - total_keys: Total number of configured keys
            - current_index: Index of currently active key
            - exhausted_keys: Number of keys that hit quota
            - available_keys: Number of keys still available
            - current_key_masked: Masked version of current key
            - last_rotation: Timestamp of last rotation

    Security:
        - Requires authentication
        - Keys are masked in response
        - No sensitive data exposed
    """
    try:
        rotation_service = get_rotation_service()
        status = rotation_service.get_status()

        logger.info(f"Key rotation status requested by user {current_user.get('id')}")

        return {
            "success": True,
            "status": status,
            "message": "API key rotation status retrieved successfully"
        }
    except Exception as e:
        logger.error(f"Error getting key rotation status: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve key rotation status"
        )


@router.post("/reset-exhausted-keys")
async def reset_exhausted_keys(current_user: dict = Depends(get_current_user)) -> Dict[str, Any]:
    """
    Manually reset all exhausted API keys.

    This endpoint allows administrators to manually reset the exhausted keys
    list, making all keys available again. Use this for testing or when you
    know the quota has been reset.

    Security:
        - Requires authentication
        - Should be restricted to admin users in production

    Returns:
        dict: Success message and new status
    """
    try:
        rotation_service = get_rotation_service()
        rotation_service.reset_exhausted_keys()

        logger.warning(
            f"Exhausted keys manually reset by user {current_user.get('id')}"
        )

        status = rotation_service.get_status()

        return {
            "success": True,
            "message": "All exhausted keys have been reset",
            "status": status
        }
    except Exception as e:
        logger.error(f"Error resetting exhausted keys: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to reset exhausted keys"
        )


@router.get("/health")
async def health_check() -> Dict[str, Any]:
    """
    Health check endpoint for monitoring.

    Returns:
        dict: Health status including API key availability
    """
    try:
        rotation_service = get_rotation_service()
        status = rotation_service.get_status()

        is_healthy = status['available_keys'] > 0

        return {
            "status": "healthy" if is_healthy else "degraded",
            "api_keys_available": status['available_keys'],
            "api_keys_total": status['total_keys'],
            "timestamp": status.get('last_rotation')
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "error": "API key rotation service unavailable"
        }
