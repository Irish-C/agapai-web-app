"""
Redis connection pool singleton for managing Redis client instances.

This module provides a RedisConnectionPool singleton that implements
lazy initialization of a Redis connection pool. The pool is created
on first use and reused for all Redis operations throughout the application.
"""

import os
import redis
import logging

logger = logging.getLogger(__name__)


class RedisConnectionPool:
    """
    Singleton Redis connection pool manager.
    
    This class implements the singleton pattern to ensure that only one
    connection pool is created and reused throughout the application lifetime.
    The connection pool is lazily initialized on first access, reducing startup time
    and ensuring connections are only created when needed.
    
    The singleton pattern is implemented using a class variable (_pool) that
    stores a single instance of redis.ConnectionPool. The @classmethod decorator
    ensures that the pool is shared across all instances of the class.
    
    Attributes:
        _pool: Class variable storing the singleton ConnectionPool instance.
    """
    
    _pool = None
    
    @classmethod
    def get(cls):
        """
        Get or create a Redis client from the connection pool.
        
        This method implements lazy initialization - the connection pool is only
        created when this method is first called. Subsequent calls return a client
        connected to the same pool.
        
        Returns:
            redis.Redis: A Redis client connected to the singleton pool.
            
        Raises:
            Exception: If the connection pool fails to initialize.
            
        Example:
            >>> redis_client = RedisConnectionPool.get()
            >>> redis_client.set('key', 'value')
            >>> value = redis_client.get('key')
        """
        if cls._pool is None:
            try:
                host = os.getenv("REDIS_HOST", "redis")
                port = int(os.getenv("REDIS_PORT", "6379"))
                db = int(os.getenv("REDIS_DB", "0"))
                cls._pool = redis.ConnectionPool(host=host, port=port, db=db)
                logger.info(f"[RedisPool] Connection pool initialized (host={host} port={port} db={db})")
            except Exception as e:
                logger.error(f"[RedisPool] Failed to create connection pool: {e}")
                raise
        return redis.Redis(connection_pool=cls._pool)
    
    @classmethod
    def close(cls):
        """
        Close the connection pool and reset the singleton instance.
        
        This method should be called during application shutdown to properly
        clean up Redis connections. After calling this method, the next call to
        get() will create a new connection pool.
        
        Example:
            >>> RedisConnectionPool.close()
        """
        if cls._pool is not None:
            cls._pool.disconnect()
            cls._pool = None
            logger.info("[RedisPool] Connection pool closed")
