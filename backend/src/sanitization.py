"""
Input Sanitization Utilities
Provides functions to sanitize user input and prevent XSS attacks
"""

import bleach
import re
from typing import Optional

# Allowed HTML tags for rich text (very restrictive)
ALLOWED_TAGS = [
    'p', 'br', 'strong', 'em', 'u', 'code', 'pre',
    'ul', 'ol', 'li', 'blockquote'
]

# Allowed HTML attributes
ALLOWED_ATTRIBUTES = {
    '*': ['class'],  # Allow class attribute on all tags
}

# Allowed CSS classes (for syntax highlighting, etc.)
ALLOWED_CLASSES = [
    'code-block', 'inline-code', 'quote'
]


def sanitize_html(text: str, strip: bool = False) -> str:
    """
    Sanitize HTML content to prevent XSS attacks

    Args:
        text: The text to sanitize
        strip: If True, strip all HTML tags. If False, allow safe tags.

    Returns:
        Sanitized text safe for storage and display
    """
    if not text:
        return ""

    if strip:
        # Strip all HTML tags
        return bleach.clean(text, tags=[], strip=True)

    # Allow only safe HTML tags
    return bleach.clean(
        text,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRIBUTES,
        strip=True  # Strip disallowed tags instead of escaping
    )


def sanitize_plain_text(text: str, max_length: Optional[int] = None) -> str:
    """
    Sanitize plain text input (no HTML allowed)

    Args:
        text: The text to sanitize
        max_length: Maximum allowed length (optional)

    Returns:
        Sanitized plain text
    """
    if not text:
        return ""

    # Remove all HTML tags
    sanitized = bleach.clean(text, tags=[], strip=True)

    # Remove control characters except newlines and tabs
    sanitized = re.sub(r'[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]', '', sanitized)

    # Normalize whitespace
    sanitized = re.sub(r'\s+', ' ', sanitized).strip()

    # Truncate if max_length specified
    if max_length and len(sanitized) > max_length:
        sanitized = sanitized[:max_length]

    return sanitized


def sanitize_chat_message(message: str) -> str:
    """
    Sanitize chat message content
    Allows basic formatting but prevents XSS

    Args:
        message: The chat message to sanitize

    Returns:
        Sanitized message safe for storage and display
    """
    if not message:
        return ""

    # For chat messages, we allow some basic HTML formatting
    # but strip anything dangerous
    sanitized = bleach.clean(
        message,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRIBUTES,
        strip=True
    )

    # Remove excessive whitespace
    sanitized = re.sub(r'\n{3,}', '\n\n', sanitized)  # Max 2 consecutive newlines

    return sanitized.strip()


def sanitize_task_title(title: str) -> str:
    """
    Sanitize task title (no HTML allowed)

    Args:
        title: The task title to sanitize

    Returns:
        Sanitized title
    """
    return sanitize_plain_text(title, max_length=500)


def sanitize_username(username: str) -> str:
    """
    Sanitize username (alphanumeric, underscore, hyphen only)

    Args:
        username: The username to sanitize

    Returns:
        Sanitized username
    """
    if not username:
        return ""

    # Remove all HTML
    sanitized = bleach.clean(username, tags=[], strip=True)

    # Allow only alphanumeric, underscore, and hyphen
    sanitized = re.sub(r'[^\w\-]', '', sanitized)

    return sanitized[:255]  # Max length


def sanitize_email(email: str) -> str:
    """
    Sanitize email address

    Args:
        email: The email to sanitize

    Returns:
        Sanitized email
    """
    if not email:
        return ""

    # Remove all HTML
    sanitized = bleach.clean(email, tags=[], strip=True)

    # Remove whitespace
    sanitized = sanitized.strip().lower()

    return sanitized[:255]  # Max length


def sanitize_url(url: str) -> str:
    """
    Sanitize URL to prevent javascript: and data: schemes

    Args:
        url: The URL to sanitize

    Returns:
        Sanitized URL or empty string if dangerous
    """
    if not url:
        return ""

    # Remove all HTML
    sanitized = bleach.clean(url, tags=[], strip=True).strip()

    # Check for dangerous schemes
    dangerous_schemes = ['javascript:', 'data:', 'vbscript:', 'file:']
    lower_url = sanitized.lower()

    for scheme in dangerous_schemes:
        if lower_url.startswith(scheme):
            return ""  # Reject dangerous URLs

    return sanitized


def escape_for_json(text: str) -> str:
    """
    Escape text for safe inclusion in JSON

    Args:
        text: The text to escape

    Returns:
        Escaped text
    """
    if not text:
        return ""

    # Escape special characters
    text = text.replace('\\', '\\\\')
    text = text.replace('"', '\\"')
    text = text.replace('\n', '\\n')
    text = text.replace('\r', '\\r')
    text = text.replace('\t', '\\t')

    return text
