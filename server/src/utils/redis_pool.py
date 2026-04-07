"""
Redis connection pool singleton for managing Redis client instances.

This module provides a RedisConnectionPool singleton that implements
lazy initialization of a Redis connection pool. The pool is created
on first use and reused for all Redis operations throughout the application.

Supports both synchronous and asynchronous Redis operations:
- Sync: For cache operations, rate limiting, process tracking
- Async: For pub/sub, non-blocking frame serving
"""

import os
import redis
import redis.asyncio as aioredis
import logging

logger = logging.getLogger(__name__)


class RedisConnectionPool:
    """
    Singleton Redis connection pool manager.
    
    This class implements the singleton pattern to ensure that only one
    connection pool is created and reused throughout the application lifetime.
    The connection pool is lazily initialized on first access, reducing startup time
    and ensuring connections are only created when needed.
    
    Supports both:
    - Sync operations: _pool (redis.ConnectionPool)
    - Async operations: _async_pool (redis.asyncio.ConnectionPool)
    
    Attributes:
        _pool: Synchronous ConnectionPool instance
        _async_pool: Asynchronous ConnectionPool instance
        _async_client: Singleton async client for pub/sub operations
    """
    
    _pool = None
    _async_pool = None
    _async_client = None
    
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
                cls._pool = redis.ConnectionPool(
                    host=host, 
                    port=port, 
                    db=db,
                    decode_responses=False  # Handle raw bytes (e.g., image frames)
                )
                logger.info(f"[RedisPool] Connection pool initialized (host={host} port={port} db={db})")
            except Exception as e:
                logger.error(f"[RedisPool] Failed to create connection pool: {e}")
                raise
        return redis.Redis(connection_pool=cls._pool, decode_responses=False)
    
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
    
    # =========================================================================
    # ASYNC OPERATIONS (for pub/sub, non-blocking frame serving)
    # =========================================================================
    
    @classmethod
    async def get_async(cls):
        """
        Get or create an async Redis client for non-blocking operations.
        
        Used for pub/sub operations, async frame publishing, and detection events.
        This method returns the shared singleton async client to avoid creating
        multiple async connections.
        
        Returns:
            redis.asyncio.Redis: An async Redis client
            
        Example:
            >>> async_client = await RedisConnectionPool.get_async()
            >>> await async_client.publish('channel', 'message')
        """
        if cls._async_client is None:
            try:
                REDIS_URL = os.getenv('REDIS_URL') or \
                    f"redis://{os.getenv('REDIS_HOST', 'redis')}:{os.getenv('REDIS_PORT', '6379')}/{os.getenv('REDIS_DB', '0')}"
                cls._async_client = await aioredis.from_url(REDIS_URL, decode_responses=False)
                logger.info(f"[RedisPool] Async client initialized ({REDIS_URL})")
            except Exception as e:
                logger.error(f"[RedisPool] Failed to create async client: {e}")
                raise
        return cls._async_client
    
    @classmethod
    async def close_async(cls):
        """Close the async client and reset singleton instance."""
        if cls._async_client is not None:
            await cls._async_client.close()
            cls._async_client = None
            logger.info("[RedisPool] Async client closed")
    
    # =========================================================================
    # FRAME CACHING (for latest camera frames)
    # =========================================================================
    
    @classmethod
    def cache_frame(cls, camera_id: int, frame_bytes: bytes, ttl: int = 3600):
        """
        Cache the latest raw frame for a camera.
        
        Stores raw JPEG/video frame data in Redis with TTL for quick retrieval
        by detection endpoints and streaming services.
        
        Args:
            camera_id: Camera ID
            frame_bytes: Raw frame bytes (JPEG)
            ttl: Time-to-live in seconds (default: 1 hour)
        """
        try:
            r = cls.get()
            key = f"latest_frame_raw_{camera_id}"
            r.setex(key, ttl, frame_bytes)
            return True
        except Exception as e:
            logger.error(f"[RedisPool] Failed to cache frame for camera {camera_id}: {e}")
            return False
    
    @classmethod
    def cache_annotated_frame(cls, camera_id: int, frame_bytes: bytes, ttl: int = 3600):
        """
        Cache the latest annotated frame (with YOLO boxes) for a camera.
        
        Args:
            camera_id: Camera ID
            frame_bytes: Annotated frame bytes (JPEG with bounding boxes)
            ttl: Time-to-live in seconds (default: 1 hour)
        """
        try:
            r = cls.get()
            key = f"latest_frame_{camera_id}"
            r.setex(key, ttl, frame_bytes)
            return True
        except Exception as e:
            logger.error(f"[RedisPool] Failed to cache annotated frame for camera {camera_id}: {e}")
            return False
    
    @classmethod
    def get_frame(cls, camera_id: int, annotated: bool = False):
        """
        Retrieve cached frame for a camera.
        
        Args:
            camera_id: Camera ID
            annotated: If True, get annotated frame; if False, get raw frame
            
        Returns:
            bytes: Frame data or None if not cached
        """
        try:
            r = cls.get()
            key = f"latest_frame_{camera_id}" if annotated else f"latest_frame_raw_{camera_id}"
            return r.get(key)
        except Exception as e:
            logger.error(f"[RedisPool] Failed to retrieve frame for camera {camera_id}: {e}")
            return None
    
    # =========================================================================
    # DETECTION EVENTS (for pub/sub)
    # =========================================================================
    
    @classmethod
    async def publish_detection(cls, camera_id: int, event_data: dict):
        """
        Publish a detection event to a camera-specific channel.
        
        Used by /detect endpoint to notify subscribers about detections
        in real-time without blocking.
        
        Args:
            camera_id: Camera ID
            event_data: Detection event serialized as JSON
        """
        try:
            async_client = await cls.get_async()
            channel = f"camera:{camera_id}:detections"
            await async_client.publish(channel, event_data)
            return True
        except Exception as e:
            logger.error(f"[RedisPool] Failed to publish detection for camera {camera_id}: {e}")
            return False
    
    @classmethod
    async def subscribe_detections(cls, camera_id: int):
        """
        Subscribe to detection events for a camera.
        
        Args:
            camera_id: Camera ID
            
        Returns:
            Channel object for listening to detection events
        """
        try:
            async_client = await cls.get_async()
            channel_name = f"camera:{camera_id}:detections"
            pubsub = async_client.pubsub()
            await pubsub.subscribe(channel_name)
            return pubsub
        except Exception as e:
            logger.error(f"[RedisPool] Failed to subscribe to detections for camera {camera_id}: {e}")
            return None
    
    # =========================================================================
    # GENERIC KEY-VALUE CACHING
    # =========================================================================
    
    @classmethod
    def cache_set(cls, key: str, value, ttl: int = 3600):
        """
        Generic cache set operation.
        
        Args:
            key: Cache key
            value: Value to cache (bytes or string)
            ttl: Time-to-live in seconds
            
        Returns:
            bool: Success status
        """
        try:
            r = cls.get()
            if isinstance(value, str):
                value = value.encode('utf-8')
            r.setex(key, ttl, value)
            return True
        except Exception as e:
            logger.error(f"[RedisPool] Failed to set cache key {key}: {e}")
            return False
    
    @classmethod
    def cache_get(cls, key: str):
        """
        Generic cache get operation.
        
        Args:
            key: Cache key
            
        Returns:
            bytes or None: Cached value or None if not found
        """
        try:
            r = cls.get()
            return r.get(key)
        except Exception as e:
            logger.error(f"[RedisPool] Failed to get cache key {key}: {e}")
            return None
