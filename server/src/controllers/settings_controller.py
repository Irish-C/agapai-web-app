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