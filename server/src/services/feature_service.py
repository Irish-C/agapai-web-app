"""
Feature Permission Service
Handles caching, retrieval, and validation of feature-level permissions.
Replaces generic role permissions with granular feature visibility per role.
Supports both in-memory and Redis caching.
"""

import logging
from typing import Dict, List, Set, Optional
from datetime import datetime, timedelta

from database import db
from src.utils.feature_constants import CATEGORY_FEATURES, DEFAULT_FEATURE_VISIBILITY, get_feature_visibility

logger = logging.getLogger(__name__)


class FeatureCache:
    """
    Manages in-memory caching of role feature permissions with automatic invalidation.
    Merges code-defined defaults with database-stored overrides.
    """
    
    def __init__(self, cache_ttl_minutes: int = 2):
        self._cache: Dict[int, Dict[str, bool]] = {}  # role_id -> {feature_key -> is_visible}
        self._cache_timestamps: Dict[int, datetime] = {}
        self.cache_ttl = timedelta(minutes=cache_ttl_minutes)
    
    async def get_visible_features(self, role_id: int) -> Dict[str, bool]:
        """
        Get all visible features for a role.
        Returns code defaults merged with database overrides.
        
        Args:
            role_id: The role ID
            
        Returns:
            Dictionary mapping feature_key to is_visible boolean
        """
        if self._is_cache_valid(role_id):
            logger.debug(f"Cache hit for role_id={role_id}")
            return self._cache[role_id].copy()
        
        logger.debug(f"Cache miss for role_id={role_id}, fetching from DB")
        features = await self._fetch_features_from_db(role_id)
        
        # Cache result
        self._cache[role_id] = features.copy()
        self._cache_timestamps[role_id] = datetime.utcnow()
        
        return features
    
    async def _fetch_features_from_db(self, role_id: int) -> Dict[str, bool]:
        """Fetch feature visibility from database, merged with code defaults."""
        try:
            # Get role with name
            role = await db.role.find_unique(where={"id": role_id})
            if not role:
                logger.warning(f"Role not found: {role_id}")
                return {}
            
            # Start with code defaults for this role
            merged_features = DEFAULT_FEATURE_VISIBILITY.get(role.role_name, {}).copy()
            
            # Get database overrides (eager load feature relationships)
            db_overrides = await db.categoryfeaturepermission.find_many(
                where={"role_id": role_id},
                include={"feature": True}
            )
            
            # Apply database overrides
            for override in db_overrides:
                if override.feature:
                    merged_features[override.feature.feature_key] = override.is_visible
            
            return merged_features
            
        except Exception as e:
            logger.error(f"Error fetching features for role_id={role_id}: {e}")
            # Fallback to code defaults
            role = await db.role.find_unique(where={"id": role_id})
            if role:
                return DEFAULT_FEATURE_VISIBILITY.get(role.role_name, {}).copy()
            return {}
    
    async def is_feature_visible(self, role_id: int, feature_key: str) -> bool:
        """Check if a specific feature is visible to a role."""
        features = await self.get_visible_features(role_id)
        return features.get(feature_key, False)
    
    async def get_visible_categories(self, role_id: int) -> Dict[str, List[str]]:
        """
        Get visible categories and their visible features for a role.
        
        Returns:
            {category_key: [feature_keys], ...}
        """
        visible_features = await self.get_visible_features(role_id)
        
        result = {}
        for category_key, features_list in CATEGORY_FEATURES.items():
            visible_in_category = [
                f["feature_key"] for f in features_list
                if visible_features.get(f["feature_key"], False)
            ]
            if visible_in_category:  # Only include if category has visible features
                result[category_key] = visible_in_category
        
        return result
    
    def invalidate(self, role_id: int) -> None:
        """Invalidate cache for a specific role."""
        self._cache.pop(role_id, None)
        self._cache_timestamps.pop(role_id, None)
        logger.info(f"Invalidated feature cache for role_id={role_id}")
    
    def invalidate_all(self) -> None:
        """Clear all cached features."""
        self._cache.clear()
        self._cache_timestamps.clear()
        logger.info("Invalidated all feature caches")
    
    def _is_cache_valid(self, role_id: int) -> bool:
        """Check if cached features are still valid."""
        if role_id not in self._cache:
            return False
        
        cached_at = self._cache_timestamps.get(role_id)
        if not cached_at:
            return False
        
        return datetime.utcnow() - cached_at < self.cache_ttl


class FeatureChecker:
    """Checks if a role has access to specific features."""
    
    def __init__(self, feature_cache: FeatureCache):
        self.cache = feature_cache
    
    async def has_feature(self, role_id: int, feature_key: str) -> bool:
        """Check if role can see/access a feature."""
        return await self.cache.is_feature_visible(role_id, feature_key)
    
    async def has_any_feature(self, role_id: int, feature_keys: Set[str]) -> bool:
        """Check if role has ANY of the features."""
        features = await self.cache.get_visible_features(role_id)
        return any(features.get(fk, False) for fk in feature_keys)
    
    async def has_all_features(self, role_id: int, feature_keys: Set[str]) -> bool:
        """Check if role has ALL of the features."""
        features = await self.cache.get_visible_features(role_id)
        return all(features.get(fk, False) for fk in feature_keys)
    
    async def get_visible_features(self, role_id: int) -> Set[str]:
        """Get all visible features for a role."""
        features = await self.cache.get_visible_features(role_id)
        return {fk for fk, visible in features.items() if visible}
    
    async def get_hidden_features(self, role_id: int) -> Set[str]:
        """Get all hidden features for a role."""
        features = await self.cache.get_visible_features(role_id)
        return {fk for fk, visible in features.items() if not visible}


# Global singleton instances
_feature_cache: Optional[FeatureCache] = None
_feature_checker: Optional[FeatureChecker] = None
_cache_type: str = "memory"


def initialize_feature_service(use_redis: bool = False, redis_url: str = None) -> None:
    """Initialize global feature cache and checker. Call at app startup."""
    global _feature_cache, _feature_checker, _cache_type
    
    if use_redis:
        try:
            from src.services.redis_feature_cache import RedisFeatureCache
            redis_url = redis_url or "redis://localhost:6379"
            _feature_cache = RedisFeatureCache(redis_url=redis_url, cache_ttl_minutes=2)
            _cache_type = "redis"
            logger.info(f"Feature service initialized with Redis caching ({redis_url})")
        except Exception as e:
            logger.warning(f"Failed to initialize Redis cache: {e}. Falling back to in-memory cache.")
            _feature_cache = FeatureCache(cache_ttl_minutes=2)
            _cache_type = "memory"
    else:
        _feature_cache = FeatureCache(cache_ttl_minutes=2)
        _cache_type = "memory"
        logger.info("Feature service initialized with in-memory caching")
    
    _feature_checker = FeatureChecker(_feature_cache)


def get_feature_cache() -> FeatureCache:
    """Get the global feature cache instance."""
    if _feature_cache is None:
        initialize_feature_service()
    return _feature_cache


def get_feature_checker() -> FeatureChecker:
    """Get the global feature checker instance."""
    if _feature_checker is None:
        initialize_feature_service()
    return _feature_checker


def get_cache_type() -> str:
    """Get the current cache type ('memory' or 'redis')."""
    return _cache_type
