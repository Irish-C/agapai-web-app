from database import db

async def list_locations_logic():
    locations = await db.location.find_many(order={'loc_name': 'asc'})
    return {'status': 'success', 'locations': [{'id': str(loc.id), 'name': loc.loc_name} for loc in locations]}, 200

async def create_location_logic(data):
    try:
        loc_name = data.get('loc_name')
        if not loc_name:
            return {'status': 'error', 'message': 'loc_name is required'}, 400

        existing = await db.location.find_first(where={'loc_name': loc_name})
        if existing:
            return {'status': 'error', 'message': 'Location already exists'}, 409

        new_loc = await db.location.create(data={'loc_name': loc_name})
        # Emit real-time update event via Socket.IO
        try:
            from src.services.socket_manager import socketio_server
            # Send full updated list for simplicity
            locations = await db.location.find_many(order={'loc_name': 'asc'})
            payload = {'status': 'success', 'locations': [{'id': str(loc.id), 'name': loc.loc_name} for loc in locations]}
            await socketio_server.emit('location_updated', payload, broadcast=True)
        except Exception as emit_err:
            print(f"[create_location_logic] Socket.IO emit error: {emit_err}")
        return {'status': 'success', 'location': {'id': str(new_loc.id), 'name': new_loc.loc_name}}, 201
    except Exception as e:
        return {'status': 'error', 'message': str(e)}, 500

async def update_location_logic(location_id, data):
    try:
        loc_name = data.get('loc_name')
        if not loc_name:
            return {'status': 'error', 'message': 'loc_name is required'}, 400

        await db.location.update(
            where={'id': int(location_id)},
            data={'loc_name': loc_name}
        )
        # Emit real-time update event via Socket.IO
        try:
            from src.services.socket_manager import socketio_server
            locations = await db.location.find_many(order={'loc_name': 'asc'})
            payload = {'status': 'success', 'locations': [{'id': str(loc.id), 'name': loc.loc_name} for loc in locations]}
            await socketio_server.emit('location_updated', payload, broadcast=True)
        except Exception as emit_err:
            print(f"[update_location_logic] Socket.IO emit error: {emit_err}")
        return {'status': 'success', 'message': 'Location updated'}, 200
    except Exception as e:
        return {'status': 'error', 'message': str(e)}, 500

async def delete_location_logic(location_id):
    try:
        await db.location.delete(where={'id': int(location_id)})
        # Emit real-time update event via Socket.IO
        try:
            from src.services.socket_manager import socketio_server
            locations = await db.location.find_many(order={'loc_name': 'asc'})
            payload = {'status': 'success', 'locations': [{'id': str(loc.id), 'name': loc.loc_name} for loc in locations]}
            await socketio_server.emit('location_updated', payload, broadcast=True)
        except Exception as emit_err:
            print(f"[delete_location_logic] Socket.IO emit error: {emit_err}")
        return {'status': 'success', 'message': 'Location deleted'}, 200
    except Exception as e:
        return {'status': 'error', 'message': str(e)}, 500
