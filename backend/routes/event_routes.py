from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import EventLog, EventType, Camera, Location, EventClass # Added EventClass
from database import db
import traceback

# 1. Create the Blueprint. App will import this.
event_routes = Blueprint('event_routes', __name__)


# 2. Define your /event_logs route
@event_routes.route('/event_logs', methods=['GET'])
@jwt_required()  # Protect this endpoint
def get_event_logs():
    """
    Fetches and serializes event logs from the database.
    """
    try:
        # Get query parameters for pagination
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)

        # --- THIS IS THE FULLY CORRECTED QUERY ---
        # It now joins based on your SQL schema:
        # EventLog -> Camera -> Location
        # EventLog -> EventClass -> EventType
        log_query = db.session.query(
            EventLog,
            EventType.event_type_name, # <-- Correct column from SQL
            Camera.cam_name,
            Location.loc_name
        ).join(
            Camera, EventLog.cam_id == Camera.id # <-- Correct FK from SQL
        ).join(
            Location, Camera.loc_id == Location.id # <-- Correct join
        ).join(
            EventClass, EventLog.event_class_id == EventClass.id # <-- Correct FK from SQL
        ).join(
            EventType, EventClass.event_type_id == EventType.id # <-- Correct join
        ).order_by(
            EventLog.timestamp.desc()
        )
        # --- END OF QUERY CORRECTION ---

        # Apply pagination
        paginated_logs = log_query.paginate(page=page, per_page=per_page, error_out=False)
        
        logs = paginated_logs.items
        
        # Serialize the data based on SQL schema
        results = []
        for log, type_name, cam_name, loc_name in logs:
            results.append({
                "id": log.id,
                "type": type_name, # <-- Corresponds to 'event_type_name'
                "camera_name": cam_name,
                "location": loc_name,
                "timestamp": log.timestamp.isoformat() if log.timestamp else None,
                "status": log.event_status, # <-- Use 'event_status' column from SQL
                "file_path": log.file_path # <-- Added file_path from SQL
            })

        # Your ReportsPage.jsx expects 'data.report'
        return jsonify({
            'status': 'success',
            'report': results, # <-- Was 'logs', now 'report'
            'total': paginated_logs.total,
            'page': paginated_logs.page,
            'pages': paginated_logs.pages,
            'has_next': paginated_logs.has_next,
            'has_prev': paginated_logs.has_prev
        }), 200

    except Exception as e:
        print(f"Error fetching event logs: {e}")
        print(traceback.format_exc()) # Print full traceback to server console
        return jsonify({'status': 'error', 'message': f'Internal server error: {e}'}), 500

# --- UPDATED 'mark_event_viewed' to match your SQL Schema ---
@event_routes.route('/event_logs/<int:log_id>/view', methods=['PATCH'])
@jwt_required()
def mark_event_viewed(log_id):
    """
    Marks a specific event log as 'acknowledged' and records the user.
    """
    try:
        # Get the user ID from the JWT token (it's a string)
        current_user_id = get_jwt_identity()

        log = EventLog.query.get(log_id)
        if not log:
            return jsonify({'status': 'error', 'message': 'Event log not found'}), 404
        
        # Update the columns from your SQL schema
        log.event_status = 'acknowledged'
        log.ack_by_user_id = int(current_user_id) # Store the user who acknowledged
        
        db.session.commit()
        
        return jsonify({'status': 'success', 'message': f'Event {log_id} marked as acknowledged.'}), 200

    except Exception as e:
        db.session.rollback()
        print(f"Error marking event as viewed: {e}")
        return jsonify({'status': 'error', 'message': f'Internal server error: {e}'}), 500