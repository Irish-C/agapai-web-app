# server/src/utils/auth.py
import bcrypt

def hash_password(password: str) -> str:
    """
    Hashes a plain-text password using bcrypt.
    """
    # Convert string to bytes
    password_bytes = password.encode('utf-8')
    # Generate salt and hash
    hashed = bcrypt.hashpw(password_bytes, bcrypt.gensalt())
    # Return as a decoded string for database storage
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies a plain-text password against a hashed one.
    """
    return bcrypt.checkpw(
        plain_password.encode('utf-8'), 
        hashed_password.encode('utf-8')
    )