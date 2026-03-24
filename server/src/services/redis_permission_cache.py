"""
Redis-based permission caching for distributed/multi-server deployments.
Provides the same interface as PermissionCache but uses Redis for shared caching.
Allows horizontal scaling with guaranteed cache consistency.
"""

import json
import logging
from typing import Dict, Optional
from datetime import datetime, timedelta

try:
    import redis.asyncio as aioredis
except ImportError:
    aioredis = None

from src.utils.permission_constants import DEFAULT_PERMISSIONS, ALL_PERMISSIONS

logger = logging.getLogger(__name__)

class RedisPermissionCache:
    """
    Redis-backed permission cache for multi-server deployments.
    Maintains the same interface as PermissionCache for easy switching.
    """
    
    def __init__(self, redis_url: str = "redis://localhost:6379", cache_ttl_minutes: int = 2):
        """
        Initialize Redis cache.
        
        Args:
            redis_url: Redis connection URL (e.g., "redis://localhost:6379", "rediss://user:pass@host:port")
            cache_ttl_minutes: Cache time-to-live in minutes
        """
        self.redis_url = redis_url
        self.cache_ttl = timedelta(minutes=cache_ttl_minutes)
        self.redis_client: Optional[aioredis.Redis] = None
        self.cache_key_prefix = "permission:role:"
        self.cache_metadata_prefix = "permission:meta:role:"
    
    async def connect(self) -> None:
        """Connect to Redis. Call this at app startup."""
        if aioredis is None:
            logger.warning("Redis module not available. Redis caching disabled.")
            return
        
        try:
            self.redis_client = await aioredis.from_url(
                self.redis_url,
                encoding="utf8",
                decode_responses=True,
                health_check_interval=30
            )
            # Test connection
            await self.redis_client.ping()
            logger.info(f"Connected to Redis at {self.redis_url}")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            self.redis_client = None
    
    async def disconnect(self) -> None:
        """Disconnect from Redis. Call at app shutdown."""
        if self.redis_client:
            await self.redis_client.close()
            logger.info("Disconnected from Redis")
    
    async def get_permissions(self, role_id: int) -> Dict[str, bool]:
        """
        Get merged permissions for a role from Redis or database.
        Falls back to database if Redis is unavailable.
        """
        if not self.redis_client:
            logger.debug(f"Redis unavailable, computing permissions for role_id={role_id}")
            # Fallback: compute on-the-fly (import to avoid circular dependency)
            from database import db
            return await self._compute_permissions(role_id)
        
        try:
            # Try to get from Redis cache
            cache_key = f"{self.cache_key_prefix}{role_id}"
            cached_data = await self.redis_client.get(cache_key)
            
            if cached_data:
                logger.debug(f"Cache hit for role_id={role_id}")
                return json.loads(cached_data)
            
            logger.debug(f"Cache miss for role_id={role_id}, computing...")
            # Not in cache, compute and store
            from database import db
            permissions = await self._compute_permissions(role_id)
            
            # Store in Redis with TTL
            await self.redis_client.setex(
                cache_key,
                int(self.cache_ttl.total_seconds()),
                json.dumps(permissions)
            )
            
            return permissions
            
        except Exception as e:
            logger.error(f"Redis error retrieving permissions for role_id={role_id}: {e}")
            # Fallback to computing directly
            from database import db
            return await self._compute_permissions(role_id)
    
    async def get_role_permissions_by_name(self, role_name: str) -> Dict[str, bool]:
        """Get permissions by role name instead of ID."""
        from database import db
        
        try:
            role = await db.role.find_unique(where={"role_name": role_name})
            if not role:
                logger.warning(f"Role not found: {role_name}")
                return {}
            
            return await self.get_permissions(role.id)
        except Exception as e:
            logger.error(f"Error fetching permissions for role {role_name}: {e}")
            return {}
    
    async def _compute_permissions(self, role_id: int) -> Dict[str, bool]:
        """
        Compute merged permissions (defaults + overrides + inheritance).
        Internal helper used by get_permissions.
        """
        from database import db
        
        try:
            # EAGER LOADING: Role hierarchy via parent_role in current schema.
            role = await db.role.find_unique(
                where={"id": role_id},
                include={
                    "parent_role": True
                }
            )
            
            if not role:
                logger.warning(f"Role not found: {role_id}")
                return {}
            
            # Start with code defaults
            merged_permissions = DEFAULT_PERMISSIONS.get(
                role.role_name, {}
            ).copy()
            
            # If role has a parent, inherit from parent first
            if role.parent_role:
                parent_permissions = DEFAULT_PERMISSIONS.get(
                    role.parent_role.role_name, {}
                ).copy()

                parent_overrides = await db.query_raw(
                    f"""
                    SELECT permission_name, is_granted
                    FROM role_permissions
                    WHERE role_id = {int(role.parent_role.id)}
                    """,
                )
                for perm in parent_overrides:
                    parent_permissions[perm["permission_name"]] = perm["is_granted"]

                merged_permissions = parent_permissions.copy()
                logger.debug(f"Role {role.role_name} inheriting from parent {role.parent_role.role_name}")

            role_overrides = await db.query_raw(
                f"""
                SELECT permission_name, is_granted
                FROM role_permissions
                WHERE role_id = {int(role_id)}
                """,
            )
            for perm in role_overrides:
                merged_permissions[perm["permission_name"]] = perm["is_granted"]

            return merged_permissions
            
        except Exception as e:
            logger.error(f"Error computing permissions for role_id {role_id}: {e}")
            return {}
    
    async def invalidate(self, role_id: int) -> None:
        """Invalidate cache for a specific role."""
        if not self.redis_client:
            return
        
        try:
            cache_key = f"{self.cache_key_prefix}{role_id}"
            await self.redis_client.delete(cache_key)
            logger.info(f"Invalidated Redis cache for role_id={role_id}")
        except Exception as e:
            logger.error(f"Error invalidating cache for role_id={role_id}: {e}")
    
    async def invalidate_all(self) -> None:
        """Clear all cached permissions."""
        if not self.redis_client:
            return
        
        try:
            # Delete all keys matching the pattern
            pattern = f"{self.cache_key_prefix}*"
            keys = await self.redis_client.keys(pattern)
            if keys:
                await self.redis_client.delete(*keys)
            logger.info(f"Invalidated all Redis permission caches ({len(keys)} keys)")
        except Exception as e:
            logger.error(f"Error invalidating all caches: {e}")
    
    async def warm_cache(self, role_ids: list = None) -> None:
        """
        Pre-populate cache with permissions for given roles.
        Called at app startup for performance optimization.
        """
        if not self.redis_client:
            return
        
        from database import db
        
        try:
            # If no specific roles provided, warm all roles
            if role_ids is None:
                roles = await db.role.find_many()
                role_ids = [r.id for r in roles]
            
            logger.info(f"Warming Redis cache for {len(role_ids)} roles...")
            
            for role_id in role_ids:
                permissions = await self._compute_permissions(role_id)
                cache_key = f"{self.cache_key_prefix}{role_id}"
                await self.redis_client.setex(
                    cache_key,
                    int(self.cache_ttl.total_seconds()),
                    json.dumps(permissions)
                )
            
            logger.info(f"Cache warming completed for {len(role_ids)} roles")
        except Exception as e:
            logger.error(f"Error warming cache: {e}")
    
    async def get_cache_stats(self) -> Dict:
        """Get cache statistics (cache size, TTL remaining, etc.)."""
        if not self.redis_client:
            return {"status": "Redis unavailable"}
        
        try:
            pattern = f"{self.cache_key_prefix}*"
            keys = await self.redis_client.keys(pattern)
            
            stats = {
                "cached_roles": len(keys),
                "cache_key_pattern": pattern,
                "redis_connected": True,
                "cache_ttl_seconds": int(self.cache_ttl.total_seconds()),
            }
            
            # Get memory usage if available
            try:
                info = await self.redis_client.info('memory')
                stats["redis_memory_usage_bytes"] = info.get('used_memory', 0)
            except:
                pass
            
            return stats
        except Exception as e:
            logger.error(f"Error getting cache stats: {e}")
            return {"error": str(e)}
