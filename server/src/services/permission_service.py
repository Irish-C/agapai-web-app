"""
Permission Management Service
Handles caching, retrieval, and validation of role-based permissions
with support for database overrides of default permissions and role hierarchy.
Supports both in-memory and Redis caching for single-server and distributed deployments.
"""

import asyncio
import logging
from typing import Dict, Set, Optional
from datetime import datetime, timedelta

from database import db
from src.utils.permission_constants import DEFAULT_PERMISSIONS, ALL_PERMISSIONS

logger = logging.getLogger(__name__)

class PermissionCache:
    """
    Manages in-memory caching of role permissions with automatic invalidation.
    Merges code-defined defaults with database-stored overrides.
    Supports role hierarchy/inheritance from parent roles.
    """
    
    def __init__(self, cache_ttl_minutes: int = 2):
        self._cache: Dict[int, Dict[str, bool]] = {}
        self._cache_timestamps: Dict[int, datetime] = {}
        self.cache_ttl = timedelta(minutes=cache_ttl_minutes)
    
    async def get_permissions(self, role_id: int) -> Dict[str, bool]:
        """
        Get merged permissions for a role.
        Returns code defaults merged with database overrides.
        
        Args:
            role_id: The role ID to get permissions for
            
        Returns:
            Dictionary mapping permission names to boolean granted status
        """
        # Check cache validity
        if self._is_cache_valid(role_id):
            logger.debug(f"Returning cached permissions for role_id={role_id}")
            return self._cache[role_id].copy()
        
        # Fetch from database
        logger.debug(f"Fetching fresh permissions for role_id={role_id}")
        permissions = await self._fetch_permissions_from_db(role_id)
        
        # Cache the result
        self._cache[role_id] = permissions.copy()
        self._cache_timestamps[role_id] = datetime.utcnow()
        
        return permissions
    
    async def get_role_permissions_by_name(self, role_name: str) -> Dict[str, bool]:
        """
        Get permissions by role name instead of ID.
        Looks up role ID first, then gets permissions.
        """
        try:
            role = await db.role.find_unique(where={"role_name": role_name})
            
            if not role:
                logger.warning(f"Role not found: {role_name}")
                return {}
            
            return await self.get_permissions(role.id)
        except Exception as e:
            logger.error(f"Error fetching permissions for role {role_name}: {e}")
            return {}
    
    async def _fetch_permissions_from_db(self, role_id: int) -> Dict[str, bool]:
        """
        Fetch permissions from database and merge with defaults.
        Database values override code defaults. Inherits from parent role if exists.
        Eager loading used to minimize database queries.
        """
        try:
            # EAGER LOADING: Get role with related permission overrides in single query
            role = await db.role.find_unique(
                where={"id": role_id},
                include={
                    "permission_overrides": True,
                    "parent_role": {
                        "include": {
                            "permission_overrides": True
                        }
                    }
                }
            )
            
            if not role:
                logger.warning(f"Role not found: {role_id}")
                return {}
            
            # Start with code defaults
            merged_permissions = DEFAULT_PERMISSIONS.get(
                role.role_name, {}
            ).copy()
            
            # If role has a parent, inherit from parent first (parent permissions as baseline)
            if role.parent_role:
                parent_permissions = DEFAULT_PERMISSIONS.get(
                    role.parent_role.role_name, {}
                ).copy()
                
                # Apply parent's database overrides
                if role.parent_role.permission_overrides:
                    for perm in role.parent_role.permission_overrides:
                        parent_permissions[perm.permission_name] = perm.is_granted
                
                # Start with inherited permissions
                merged_permissions = parent_permissions.copy()
                logger.debug(f"Role {role.role_name} inheriting from parent {role.parent_role.role_name}")
            
            # Apply this role's database overrides (override parent and defaults)
            if role.permission_overrides:
                for perm in role.permission_overrides:
                    merged_permissions[perm.permission_name] = perm.is_granted
            
            return merged_permissions
            
        except Exception as e:
            logger.error(f"Error fetching permissions for role_id {role_id}: {e}")
            # Try to fallback to defaults
            try:
                role = await db.role.find_unique(where={"id": role_id})
                if role:
                    return DEFAULT_PERMISSIONS.get(role.role_name, {}).copy()
            except:
                pass
            return {}
    
    def invalidate(self, role_id: int) -> None:
        """
        Invalidate cache for a specific role.
        Called when permissions are updated.
        
        Args:
            role_id: The role ID to invalidate cache for
        """
        self._cache.pop(role_id, None)
        self._cache_timestamps.pop(role_id, None)
        logger.info(f"Invalidated permission cache for role_id={role_id}")
    
    def invalidate_all(self) -> None:
        """Clear all cached permissions. Used when system-wide changes occur."""
        self._cache.clear()
        self._cache_timestamps.clear()
        logger.info("Invalidated all permission caches")
    
    def _is_cache_valid(self, role_id: int) -> bool:
        """Check if cached permissions for role are still valid."""
        if role_id not in self._cache:
            return False
        
        cached_at = self._cache_timestamps.get(role_id)
        if not cached_at:
            return False
        
        return datetime.utcnow() - cached_at < self.cache_ttl


class PermissionChecker:
    """
    Checks if a user or role has specific permissions.
    Works with cached permission data.
    """
    
    def __init__(self, permission_cache: PermissionCache):
        self.cache = permission_cache
    
    async def has_permission(
        self,
        role_id: int,
        permission: str,
    ) -> bool:
        """
        Check if a role has a specific permission.
        
        Args:
            role_id: Role ID to check
            permission: Permission name to check
            
        Returns:
            True if the role has the permission, False otherwise
        """
        permissions = await self.cache.get_permissions(role_id)
        return permissions.get(permission, False)
    
    async def has_any_permission(
        self,
        role_id: int,
        permissions: Set[str],
    ) -> bool:
        """
        Check if a role has ANY of the specified permissions.
        Useful for "can do X or Y" checks.
        """
        role_perms = await self.cache.get_permissions(role_id)
        return any(role_perms.get(p, False) for p in permissions)
    
    async def has_all_permissions(
        self,
        role_id: int,
        permissions: Set[str],
    ) -> bool:
        """
        Check if a role has ALL of the specified permissions.
        Useful for "must be able to do X and Y" checks.
        """
        role_perms = await self.cache.get_permissions(role_id)
        return all(role_perms.get(p, False) for p in permissions)
    
    async def get_granted_permissions(self, role_id: int) -> Set[str]:
        """Get set of all permissions granted to a role."""
        permissions = await self.cache.get_permissions(role_id)
        return {perm for perm, granted in permissions.items() if granted}
    
    async def get_denied_permissions(self, role_id: int) -> Set[str]:
        """Get set of all permissions denied to a role."""
        permissions = await self.cache.get_permissions(role_id)
        return {perm for perm, granted in permissions.items() if not granted}


# Global singleton instances
_permission_cache: Optional[object] = None  # Can be PermissionCache or RedisPermissionCache
_permission_checker: Optional[PermissionChecker] = None
_cache_type: str = "memory"  # "memory" or "redis"


def initialize_permission_service(use_redis: bool = False, redis_url: str = None) -> None:
    """
    Initialize global permission cache and checker. Call at app startup.
    
    Args:
        use_redis: If True, use Redis caching. If False, use in-memory caching.
        redis_url: Redis connection URL (only used if use_redis=True)
    """
    global _permission_cache, _permission_checker, _cache_type
    
    if use_redis:
        try:
            from src.services.redis_permission_cache import RedisPermissionCache
            redis_url = redis_url or "redis://localhost:6379"
            _permission_cache = RedisPermissionCache(redis_url=redis_url, cache_ttl_minutes=2)
            _cache_type = "redis"
            logger.info(f"Permission service initialized with Redis caching ({redis_url})")
        except Exception as e:
            logger.warning(f"Failed to initialize Redis cache: {e}. Falling back to in-memory cache.")
            _permission_cache = PermissionCache(cache_ttl_minutes=2)
            _cache_type = "memory"
    else:
        _permission_cache = PermissionCache(cache_ttl_minutes=2)
        _cache_type = "memory"
        logger.info("Permission service initialized with in-memory caching")
    
    _permission_checker = PermissionChecker(_permission_cache)


async def initialize_permission_service_async(use_redis: bool = False, redis_url: str = None) -> None:
    """
    Async initialization that connects to Redis and warms the cache.
    Call at app startup for full cache optimization.
    
    Args:
        use_redis: If True, use Redis caching.
        redis_url: Redis connection URL
    """
    initialize_permission_service(use_redis=use_redis, redis_url=redis_url)
    
    # If using Redis, connect and warm cache
    global _permission_cache
    if _cache_type == "redis" and hasattr(_permission_cache, 'connect'):
        try:
            await _permission_cache.connect()
            await _permission_cache.warm_cache()
            logger.info("Redis permission cache connected and warmed")
        except Exception as e:
            logger.error(f"Error warming Redis cache: {e}")


def get_permission_cache() -> object:
    """Get the global permission cache instance."""
    if _permission_cache is None:
        initialize_permission_service()
    return _permission_cache


def get_permission_checker() -> PermissionChecker:
    """Get the global permission checker instance."""
    if _permission_checker is None:
        initialize_permission_service()
    return _permission_checker


def get_cache_type() -> str:
    """Get the current cache type ('memory' or 'redis')."""
    return _cache_type
