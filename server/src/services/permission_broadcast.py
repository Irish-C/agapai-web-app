"""
WebSocket handlers for real-time permission updates.
Broadcasts permission changes to all connected clients.
"""

import logging
from typing import Optional

from src.services.permission_service import get_permission_cache

logger = logging.getLogger(__name__)


class PermissionUpdateBroadcaster:
    """
    Broadcasts permission changes to all connected WebSocket clients in real-time.
    Updates are sent whenever permissions are modified via the API.
    """
    
    def __init__(self, sio):
        """
        Initialize broadcaster with Socket.IO instance.
        
        Args:
            sio: The socketio.AsyncServer instance from app.py
        """
        self.sio = sio
    
    async def broadcast_permission_update(
        self,
        role_id: int,
        role_name: str,
        permission_name: str,
        old_value: Optional[bool],
        new_value: bool,
        changed_by_username: str,
        reason: Optional[str] = None,
    ) -> None:
        """
        Broadcast a single permission change to all connected clients.
        
        Args:
            role_id: ID of the role that was changed
            role_name: Name of the role (for UI display)
            permission_name: Name of the permission that was changed
            old_value: Previous permission state (None if new override)
            new_value: New permission state
            changed_by_username: Username of the superadmin who made the change
            reason: Optional reason for the change
        """
        event_data = {
            "type": "permission_update",
            "role_id": role_id,
            "role_name": role_name,
            "permission_name": permission_name,
            "old_value": old_value,
            "new_value": new_value,
            "changed_by": changed_by_username,
            "reason": reason,
        }
        
        # Broadcast to all connected clients
        await self.sio.emit(
            "permission_changed",
            event_data,
            to=None,  # None means broadcast to all connected clients
        )
        
        logger.info(
            f"Broadcasted permission update: "
            f"role={role_name}({role_id}), "
            f"permission={permission_name}, "
            f"new_value={new_value}, "
            f"by={changed_by_username}"
        )
    
    async def broadcast_bulk_permission_update(
        self,
        role_id: int,
        role_name: str,
        update_count: int,
        changed_by_username: str,
        reason: Optional[str] = None,
    ) -> None:
        """
        Broadcast a bulk permission update (multiple permissions changed at once).
        
        Args:
            role_id: ID of the role that was changed
            role_name: Name of the role
            update_count: Number of permissions that were updated
            changed_by_username: Username of the superadmin who made the change
            reason: Optional reason for the change
        """
        event_data = {
            "type": "bulk_permission_update",
            "role_id": role_id,
            "role_name": role_name,
            "update_count": update_count,
            "changed_by": changed_by_username,
            "reason": reason,
        }
        
        await self.sio.emit(
            "permissions_changed",
            event_data,
            to=None,
        )
        
        logger.info(
            f"Broadcasted bulk permission update: "
            f"role={role_name}({role_id}), "
            f"updates={update_count}, "
            f"by={changed_by_username}"
        )
    
    async def broadcast_permission_reset(
        self,
        role_id: int,
        role_name: str,
        reset_count: int,
        changed_by_username: str,
    ) -> None:
        """
        Broadcast a permission reset (all permissions returned to defaults).
        
        Args:
            role_id: ID of the role that was reset
            role_name: Name of the role
            reset_count: Number of permissions that were reset
            changed_by_username: Username of the superadmin who made the change
        """
        event_data = {
            "type": "permissions_reset",
            "role_id": role_id,
            "role_name": role_name,
            "reset_count": reset_count,
            "changed_by": changed_by_username,
        }
        
        await self.sio.emit(
            "permissions_reset",
            event_data,
            to=None,
        )
        
        logger.info(
            f"Broadcasted permission reset: "
            f"role={role_name}({role_id}), "
            f"resets={reset_count}, "
            f"by={changed_by_username}"
        )
    
    async def broadcast_cache_invalidation(self, role_id: int) -> None:
        """
        Tell connected clients that a role's permission cache was invalidated.
        Clients should refetch permissions for that role.
        
        Args:
            role_id: The role ID whose cache was invalidated
        """
        event_data = {
            "type": "cache_invalidation",
            "role_id": role_id,
        }
        
        await self.sio.emit(
            "permission_cache_invalidated",
            event_data,
            to=None,
        )
        
        logger.debug(f"Broadcasted cache invalidation for role_id={role_id}")
    
    async def broadcast_audit_log_entry(
        self,
        role_id: int,
        role_name: str,
        permission_name: str,
        old_value: Optional[bool],
        new_value: bool,
        changed_by_username: str,
        timestamp: str,
        reason: Optional[str] = None,
    ) -> None:
        """
        Broadcast a new audit log entry to clients viewing the audit log.
        
        Args:
            role_id: Role that was changed
            role_name: Name of the role
            permission_name: Permission that was changed
            old_value: Previous value
            new_value: New value
            changed_by_username: User who made the change
            timestamp: When the change occurred
            reason: Optional reason
        """
        event_data = {
            "type": "audit_log_entry",
            "role_id": role_id,
            "role_name": role_name,
            "permission_name": permission_name,
            "old_value": old_value,
            "new_value": new_value,
            "changed_by": changed_by_username,
            "timestamp": timestamp,
            "reason": reason,
        }
        
        # Emit to all clients on "audit_logs" room
        await self.sio.emit(
            "new_audit_log_entry",
            event_data,
            to="audit_logs",
        )
        
        logger.debug(f"Broadcasted audit log entry for role={role_name}")


# Global broadcaster instance (set at app startup)
_broadcaster: Optional[PermissionUpdateBroadcaster] = None


def initialize_broadcaster(sio) -> None:
    """Initialize the permission broadcaster. Call at app startup."""
    global _broadcaster
    _broadcaster = PermissionUpdateBroadcaster(sio)
    logger.info("Permission update broadcaster initialized")


def get_broadcaster() -> Optional[PermissionUpdateBroadcaster]:
    """Get the global broadcaster instance."""
    return _broadcaster
