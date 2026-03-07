from database import db

async def list_locations_logic():
    locations = await db.location.find_many(order={'loc_name': 'asc'})
    return {'status': 'success', 'locations': [{'id': loc.id, 'name': loc.loc_name} for loc in locations]}, 200

async def create_location_logic(data):
    try:
        loc_name = data.get('loc_name')
        if not loc_name:
            return {'status': 'error', 'message': 'loc_name is required'}, 400

        existing = await db.location.find_first(where={'loc_name': loc_name})
        if existing:
            return {'status': 'error', 'message': 'Location already exists'}, 409

        new_loc = await db.location.create(data={'loc_name': loc_name})
        return {'status': 'success', 'location': {'id': new_loc.id, 'name': new_loc.loc_name}}, 201
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
        return {'status': 'success', 'message': 'Location updated'}, 200
    except Exception as e:
        return {'status': 'error', 'message': str(e)}, 500

async def delete_location_logic(location_id):
    try:
        await db.location.delete(where={'id': int(location_id)})
        return {'status': 'success', 'message': 'Location deleted'}, 200
    except Exception as e:
        return {'status': 'error', 'message': str(e)}, 500
