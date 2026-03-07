"""Database package for the backend.

This module provides a stable import target (`from database import db`) for
code that needs access to the Prisma client. It wraps the actual Prisma
instance defined in `server/db/db_setup.py`.
"""

from db.db_setup import db

__all__ = ["db"]
