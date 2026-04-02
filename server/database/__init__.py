"""Database package for the backend.

This module provides a stable import target (`from database import db`) for
code that needs access to the Prisma client. The implementation lives in
`server/database/db_setup.py` and is re-exported here so callers use a
single import path.
"""

from .db_setup import db

__all__ = ["db"]
