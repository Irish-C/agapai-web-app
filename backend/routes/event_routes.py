from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from models import EventLog, EventType, Camera, Location
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
        # Get query parameters for pagination (optional, but recommended)
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)

        # Query the database
        # This joins the related tables to get names instead of just IDs
        log_query = db.session.query(
            EventLog,
            EventType.type_name,
            Camera.cam_name,
            Location.loc_name
        ).join(
            EventType, EventLog.event_type_id == EventType.id
        ).join(
            Camera, EventLog.camera_id == Camera.id
        ).join(
            Location, EventLog.location_id == Location.id
        ).order_by(
            EventLog.timestamp.desc()
        )

        # Apply pagination
        paginated_logs = log_query.paginate(page=page, per_page=per_page, error_out=False)
        
        logs = paginated_logs.items
        
        # Serialize the data
        results = []
        for log, type_name, cam_name, loc_name in logs:
            results.append({
                "id": log.id,
                "event_type": type_name,
                "camera_name": cam_name,
                "location_name": loc_name,
                "timestamp": log.timestamp.isoformat() if log.timestamp else None,
                "details": log.details,
                "viewed": log.viewed
            })

        return jsonify({
            'status': 'success',
            'logs': results,
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

# Example: Route to mark an event as "viewed"
@event_routes.route('/event_logs/<int:log_id>/view', methods=['PATCH'])
@jwt_required()
def mark_event_viewed(log_id):
    """
    Marks a specific event log as viewed.
    """
    try:
        log = EventLog.query.get(log_id)
        if not log:
            return jsonify({'status': 'error', 'message': 'Event log not found'}), 404
        
        log.viewed = True
        db.session.commit()
        
        return jsonify({'status': 'success', 'message': f'Event {log_id} marked as viewed.'}), 200

    except Exception as e:
        db.session.rollback()
        print(f"Error marking event as viewed: {e}")
        return jsonify({'status': 'error', 'message': f'Internal server error: {e}'}), 500