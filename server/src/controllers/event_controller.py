from database import db
from datetime import datetime, timedelta

async def get_event_logs_logic(args):
    try:
        limit_param = args.get('limit', type=int)
        start_date_str = args.get('start_date', type=str)
        end_date_str = args.get('end_date', type=str)

        # Build Prisma Filter Dictionary
        filters = {}
        
        # Date Filtering logic
        if start_date_str or end_date_str:
            filters['timestamp'] = {}
            if start_date_str:
                filters['timestamp']['gte'] = datetime.strptime(start_date_str, '%Y-%m-%d')
            if end_date_str:
                end_date_obj = datetime.strptime(end_date_str, '%Y-%m-%d')
                filters['timestamp']['lt'] = end_date_obj + timedelta(days=1)

        # Prisma Query with nested includes (Joins)
        logs = await db.eventlog.find_many(
            where=filters,
            take=limit_param if limit_param else None,
            order={"timestamp": "desc"},
            include={
                "camera": {
                    "include": {"location": True}
                },
                "event_class": True,
                "acknowledged_by": True
            }
        )

        results = []
        for log in logs:
            results.append({
                "id": str(log.id), # BigInt fix
                "event_class_name": log.event_class.class_name if log.event_class else "Unknown", 
                "camera_name": log.camera.cam_name if log.camera else "N/A",
                "location": log.camera.location.loc_name if log.camera and log.camera.location else "N/A",
                "timestamp": log.timestamp.strftime('%m/%d/%Y, %I:%M:%S %p') if log.timestamp else None,
                "status": log.event_status,
                "acknowledged_by_username": log.acknowledged_by.username if log.acknowledged_by else None,
                "file_path": log.file_path
            })
        
        return {"status": "success", "report": results}, 200
    except Exception as e:
        print(f"Event Logic Error: {e}")
        return {"status": "error", "message": str(e)}, 500

async def mark_viewed_logic(log_id, user_id):
    try:
        # Update using Prisma
        updated_log = await db.eventlog.update(
            where={'id': int(log_id)},
            data={
                'event_status': 'acknowledged',
                'ack_by_user_id': int(user_id)
            }
        )
        
        if not updated_log:
            return {"error": "Event log not found"}, 404
        
        return {"status": "success", "message": f"Event {log_id} acknowledged"}, 200
    except Exception as e:
        return {"status": "error", "message": str(e)}, 500