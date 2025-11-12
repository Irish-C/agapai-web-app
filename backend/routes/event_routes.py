from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
# ADDED User to imports
from models import EventLog, EventType, Camera, Location, EventClass, User 
from database import db
import traceback
from sqlalchemy.sql import func 

# 1. Create the Blueprint. App will import this.
event_routes = Blueprint('event_routes', __name__)


# 2. Define your /event_logs route
@event_routes.route('/event_logs', methods=['GET'])
@jwt_required()  # Protect this endpoint
def get_event_logs():
    try:
        # Joins based on SQL schema:
        log_query = db.session.query(
            EventLog,
            # 1. RESOLVE EVENT CLASS NAME (Incident Classification)
            EventClass.class_name.label('event_class_name'), 
            # 2. RESOLVE LOCATION/CAMERA NAMES
            Camera.cam_name.label('camera_name'),
            Location.loc_name.label('location_name'),
            # 3. RESOLVE ACKNOWLEDGED BY USERNAME (User.username)
            # Use .label() to give the result a clear name for serialization
            User.username.label('acknowledged_by_username')
        ).join(
            Camera, EventLog.cam_id == Camera.id 
        ).join(
            Location, Camera.loc_id == Location.id 
        ).join(
            EventClass, EventLog.event_class_id == EventClass.id 
        # Use LEFT OUTER JOIN for the User table because ack_by_user_id can be NULL
        ).outerjoin( 
            User, EventLog.ack_by_user_id == User.id
        ).order_by(
            EventLog.timestamp.desc()
        )
        
        # Get all logs
        logs = log_query.all()

        # Serialize the data
        results = []
        # Unpack the tuple of results using the defined labels
        for log, event_class_name, camera_name, location_name, acknowledged_by_username in logs:
            results.append({
                "id": log.id,
                # Use the resolved class name (e.g., 'Backward Fall')
                "event_class_name": event_class_name, 
                "camera_name": camera_name,
                "location": location_name,
                "timestamp": log.timestamp.isoformat() if log.timestamp else None,
                "status": log.event_status,
                # Use the resolved username
                "acknowledged_by_username": acknowledged_by_username,
                "file_path": log.file_path
            })

        # ReportsPage.jsx expects 'data.report'
        return jsonify({
            'status': 'success',
            'report': results
        }), 200

    except Exception as e:
        print(f"Error fetching event logs: {e}")
        print(traceback.format_exc()) # Print full traceback to server console
        return jsonify({'status': 'error', 'message': f'Internal server error: {e}'}), 500

# --- UPDATED 'mark_event_viewed' to match SQL Schema ---
@event_routes.route('/event_logs/<int:log_id>/view', methods=['PATCH'])
@jwt_required()
def mark_event_viewed(log_id):
    """
    Marks a specific event log as 'acknowledged' and records the user.
    """
    try:
        # Get the user ID from the JWT token
        current_user_id = get_jwt_identity()

        log = EventLog.query.get(log_id)
        if not log:
            return jsonify({'status': 'error', 'message': 'Event log not found'}), 404
        
        # Update the columns from SQL schema
        log.event_status = 'acknowledged'
        log.ack_by_user_id = int(current_user_id) # Store the user who acknowledged
        
        db.session.commit()
        
        return jsonify({'status': 'success', 'message': f'Event {log_id} marked as acknowledged.'}), 200

    except Exception as e:
        db.session.rollback()
        print(f"Error marking event as viewed: {e}")
        return jsonify({'status': 'error', 'message': f'Internal server error: {e}'}), 500