"""
Standardized error response models and utilities
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class ErrorDetail(BaseModel):
    """Detailed error information"""
    field: Optional[str] = Field(None, description="Field that caused the error (for validation errors)")
    message: str = Field(..., description="Human-readable error message")
    code: Optional[str] = Field(None, description="Machine-readable error code")


class StandardErrorResponse(BaseModel):
    """Standardized error response format"""
    error: str = Field(..., description="Error type or category")
    message: str = Field(..., description="Human-readable error message")
    status_code: int = Field(..., description="HTTP status code")
    timestamp: str = Field(..., description="ISO 8601 timestamp of when error occurred")
    path: Optional[str] = Field(None, description="API path where error occurred")
    request_id: Optional[str] = Field(None, description="Unique request identifier for tracking")
    details: Optional[List[ErrorDetail]] = Field(None, description="Additional error details")

    class Config:
        json_schema_extra = {
            "example": {
                "error": "ValidationError",
                "message": "Invalid input data",
                "status_code": 400,
                "timestamp": "2026-01-23T10:30:00Z",
                "path": "/api/v1/tasks",
                "request_id": "abc123",
                "details": [
                    {
                        "field": "title",
                        "message": "Title cannot be empty",
                        "code": "REQUIRED_FIELD"
                    }
                ]
            }
        }


def create_error_response(
    error_type: str,
    message: str,
    status_code: int,
    path: Optional[str] = None,
    request_id: Optional[str] = None,
    details: Optional[List[ErrorDetail]] = None
) -> Dict[str, Any]:
    """
    Create a standardized error response

    Args:
        error_type: Type or category of error
        message: Human-readable error message
        status_code: HTTP status code
        path: API path where error occurred
        request_id: Unique request identifier
        details: Additional error details

    Returns:
        Dictionary containing standardized error response
    """
    return {
        "error": error_type,
        "message": message,
        "status_code": status_code,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "path": path,
        "request_id": request_id,
        "details": [detail.dict() if isinstance(detail, ErrorDetail) else detail for detail in details] if details else None
    }


# Common error types
class ErrorTypes:
    VALIDATION_ERROR = "ValidationError"
    AUTHENTICATION_ERROR = "AuthenticationError"
    AUTHORIZATION_ERROR = "AuthorizationError"
    NOT_FOUND_ERROR = "NotFoundError"
    CONFLICT_ERROR = "ConflictError"
    RATE_LIMIT_ERROR = "RateLimitError"
    INTERNAL_ERROR = "InternalServerError"
    BAD_REQUEST = "BadRequestError"
    ACCOUNT_LOCKED = "AccountLockedError"
