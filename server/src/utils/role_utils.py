"""Utilities for normalizing and displaying roles.

This helps keep role strings consistent across the backend (e.g., "Admin" vs "admin").
"""

from typing import Optional


def normalize_role(role: Optional[str]) -> Optional[str]:
    """Normalize a role string to lowercase.

    Returns None if the input is not a string or is empty.
    """
    if isinstance(role, str):
        role_str = role.strip()
        return role_str.lower() if role_str else None
    return None


def display_role(role: Optional[str]) -> Optional[str]:
    """Return a user-friendly title-cased role string."""
    normalized = normalize_role(role)
    if not normalized:
        return None
    return normalized.capitalize()
