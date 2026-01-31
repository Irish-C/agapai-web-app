# server/controllers/event_controller.py
from models import EventLog, EventClass, Camera, Location, User
from database import db
from datetime import datetime, timedelta
from flask import jsonify

def get_event_logs_logic(args):
    try:
        limit_param = args.get('limit', type=int)
        start_date_str = args.get('start_date', type=str)
        end_date_str = args.get('end_date', type=str)

        # Build Query with Joins
        log_query = db.session.query(
            EventLog,
            EventClass.class_name.label('event_class_name'), 
            Camera.cam_name.label('camera_name'),
            Location.loc_name.label('location_name'),
            User.username.label('acknowledged_by_username')
        ).join(Camera, EventLog.cam_id == Camera.id)\
         .join(Location, Camera.loc_id == Location.id)\
         .join(EventClass, EventLog.event_class_id == EventClass.id)\
         .outerjoin(User, EventLog.ack_by_user_id == User.id)\
         .order_by(EventLog.timestamp.desc())

        # Apply Filters
        if start_date_str:
            try:
                start_filter_dt = datetime.strptime(start_date_str, '%Y-%m-%d')
                log_query = log_query.filter(EventLog.timestamp >= start_filter_dt)
            except ValueError: pass

        if end_date_str:
            try:
                end_date_obj = datetime.strptime(end_date_str, '%Y-%m-%d')
                next_day_midnight = end_date_obj + timedelta(days=1)
                log_query = log_query.filter(EventLog.timestamp < next_day_midnight)
            except ValueError: pass

        if limit_param:
            log_query = log_query.limit(limit_param)

        logs = log_query.all()
        results = []
        for log, event_class, cam, loc, ack_user in logs:
            results.append({
                "id": log.id,
                "event_class_name": event_class, 
                "camera_name": cam,
                "location": loc,
                "timestamp": log.timestamp.strftime('%m/%d/%Y, %I:%M:%S %p') if log.timestamp else None,
                "status": log.event_status,
                "acknowledged_by_username": ack_user,
                "file_path": log.file_path
            })
        
        return {"status": "success", "report": results}, 200
    except Exception as e:
        return {"status": "error", "message": str(e)}, 500

def mark_viewed_logic(log_id, user_id):
    try:
        log = EventLog.query.get(log_id)
        if not log:
            return {"error": "Event log not found", "code": 404}
        
        log.event_status = 'acknowledged'
        log.ack_by_user_id = int(user_id)
        db.session.commit()
        return {"status": "success", "message": f"Event {log_id} acknowledged"}, 200
    except Exception as e:
        db.session.rollback()
        return {"status": "error", "message": str(e)}, 500