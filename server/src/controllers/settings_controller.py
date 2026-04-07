from database import db

async def save_notifications_logic(user_id, data):
    """
    Handles the logic for saving user preferences using Prisma.
    """
    try:
        # 1. Extract data from the request
        alert_threshold = data.get('alert_threshold')
        email_notifications = data.get('email_notifications')

        # 2. Update the database
        # We use int(user_id) because JWT identities are often stored as strings
        updated_user = await db.user.update(
            where={'id': int(user_id)},
            data={
                # Ensure these field names match your schema.prisma exactly
                'email_notifications': data.get('email_notifications') is True,
                'alert_threshold': int(alert_threshold) if alert_threshold else 0
            }
        )

        return {
            "status": "success", 
            "message": "Notification settings saved",
            "user": updated_user.username
        }, 200

    except Exception as e:
        print(f"Settings Save Error: {e}")
        return {"status": "error", "message": str(e)}, 500


async def get_global_notifications_logic():
    try:
        # Return the first (and only) global settings row or defaults
        gs = await db.globalsetting.find_first()
        if not gs:
            return {
                'emit_fall': True,
                'persist_fall': True,
                'emit_inactivity': False,
                'persist_inactivity': False,
                'ai_enabled': True,
            }, 200

        return {
            'emit_fall': bool(getattr(gs, 'emit_fall', True)),
            'persist_fall': bool(getattr(gs, 'persist_fall', True)),
            'emit_inactivity': bool(getattr(gs, 'emit_inactivity', False)),
            'persist_inactivity': bool(getattr(gs, 'persist_inactivity', False)),
            'ai_enabled': bool(getattr(gs, 'ai_enabled', True)),
        }, 200

    except Exception as e:
        print(f"Get Global Settings Error: {e}")
        return {"status": "error", "message": str(e)}, 500


async def save_global_notifications_logic(data):
    try:
        payload = {}
        if 'emit_fall' in data:
            payload['emit_fall'] = bool(data.get('emit_fall'))
        if 'persist_fall' in data:
            payload['persist_fall'] = bool(data.get('persist_fall'))
        if 'emit_inactivity' in data:
            payload['emit_inactivity'] = bool(data.get('emit_inactivity'))
        if 'persist_inactivity' in data:
            payload['persist_inactivity'] = bool(data.get('persist_inactivity'))
        if 'ai_enabled' in data:
            payload['ai_enabled'] = bool(data.get('ai_enabled'))
        # If a row exists, update it; otherwise create one
        gs = await db.globalsetting.find_first()
        if gs:
            updated = await db.globalsetting.update(where={'id': gs.id}, data=payload)
            return {"status": "success", "settings": updated}, 200
        else:
            created = await db.globalsetting.create(data=payload)
            return {"status": "success", "settings": created}, 201

    except Exception as e:
        print(f"Save Global Settings Error: {e}")
        return {"status": "error", "message": str(e)}, 500