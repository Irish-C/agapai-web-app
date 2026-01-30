from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import EventLog, EventType, Camera, Location, EventClass, User 
from database import db
import traceback
from sqlalchemy.sql import func 
from datetime import datetime, timedelta # 👈 IMPORTED FOR DATE FILTERING

# 1. Create the Blueprint. App will import this.
event_routes = Blueprint('event_routes', __name__)


# 2. Define your /event_logs route
@event_routes.route('/event_logs', methods=['GET'])
@jwt_required()  # Protect this endpoint
def get_event_logs():
    try:
        # --- 1. Get Query Parameters ---
        limit_param = request.args.get('limit', default=None, type=int)
        start_date_str = request.args.get('start_date', type=str)
        end_date_str = request.args.get('end_date', type=str)

        # Start the complex query construction with joins
        log_query = db.session.query(
            EventLog,
            # 1. RESOLVE EVENT CLASS NAME (Incident Classification)
            EventClass.class_name.label('event_class_name'), 
            # 2. RESOLVE LOCATION/CAMERA NAMES
            Camera.cam_name.label('camera_name'),
            Location.loc_name.label('location_name'),
            # 3. RESOLVE ACKNOWLEDGED BY USERNAME (User.username)
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
        
        # --- 2. Apply Date Filters ---
        
        # Filter by Start Date (Inclusive: >= selected date at 00:00:00)
        if start_date_str:
            try:
                # Convert YYYY-MM-DD string to datetime object (defaults to 00:00:00)
                start_filter_dt = datetime.strptime(start_date_str, '%Y-%m-%d')
                log_query = log_query.filter(EventLog.timestamp >= start_filter_dt)
            except ValueError:
                # If the date format is invalid, skip the filter but continue
                print(f"Warning: Invalid start_date format received: {start_date_str}")

        # Filter by End Date (Exclusive: < the next day at 00:00:00)
        if end_date_str:
            try:
                # Convert YYYY-MM-DD string to a datetime object (will be at 00:00:00)
                end_date_obj = datetime.strptime(end_date_str, '%Y-%m-%d')
                
                # Add one day to get the start of the next day
                # e.g., 2025-11-17 -> 2025-11-18 00:00:00
                next_day_midnight = end_date_obj + timedelta(days=1)
                
                # Apply filter: timestamp < next_day_midnight 
                log_query = log_query.filter(EventLog.timestamp < next_day_midnight)
            except ValueError:
                # If the date format is invalid, skip the filter but continue
                print(f"Warning: Invalid end_date format received: {end_date_str}")
        
        # --- 3. Apply Limit ---
        if limit_param is not None and limit_param > 0:
            log_query = log_query.limit(limit_param) 
        
        # Get logs
        logs = log_query.all()

        # Serialize the data
        results = []
        # Unpack the tuple of results using the defined labels
        for log, event_class_name, camera_name, location_name, acknowledged_by_username in logs:
            # Formatting the timestamp to match the frontend's expected locale string: MM/DD/YYYY, HH:MM:SS AM/PM
            # Note: The frontend will likely use its own Date() constructor, but providing this standard helps
            formatted_timestamp = log.timestamp.strftime('%m/%d/%Y, %I:%M:%S %p') if log.timestamp else None
            
            results.append({
                "id": log.id,
                "event_class_name": event_class_name, 
                "camera_name": camera_name,
                "location": location_name,
                "timestamp": formatted_timestamp, # Send formatted string
                "status": log.event_status,
                "acknowledged_by_username": acknowledged_by_username,
                "file_path": log.file_path
            })

        # ReportsPage.jsx expects 'data.report'
        return jsonify({
            'status': 'success',
            'report': results
        }), 200

    except Exception as e:
        db.session.rollback()
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