from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import traceback

# Define a Flask Blueprint for general settings
settings_routes = Blueprint('settings_routes', __name__)

@settings_routes.route('/settings/notifications', methods=['POST'])
@jwt_required()
def save_notification_settings():
    """
    Saves notification settings for the user.
    NOTE: This is a mock endpoint. You would save this
    to a 'user_preferences' table in a real app.
    """
    try:
        data = request.get_json()
        alert_threshold = data.get('alert_threshold')
        email_notifications = data.get('email_notifications')
        
        # Get the user ID to know who these settings belong to
        user_id = get_jwt_identity()
        
        # --- MOCK SAVE ---
        # In a real app, you would save this to the database, e.g.:
        # user = User.query.get(user_id)
        # user.alert_threshold = alert_threshold
        # user.email_notifications = email_notifications
        # db.session.commit()
        
        print(f"MOCK SAVE: User {user_id} saved settings:")
        print(f"  - Alert Threshold: {alert_threshold}")
        print(f"  - Email Notifications: {email_notifications}")
        
        return jsonify({"status": "success", "message": "Notification settings saved"}), 200

    except Exception as e:
        print(f"Error saving settings: {e}")
        print(traceback.format_exc())
        return jsonify({"status": "error", "message": "Internal server error"}), 500