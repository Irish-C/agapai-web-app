import asyncio
from database import db
from werkzeug.security import generate_password_hash
from datetime import datetime

async def seed_database():
    """
    Complete database seeding with:
    - Roles (admin, supervisor, guard, caregiver)
    - Users with assigned roles
    - Locations
    - Event types and classes
    - Sample cameras
    """
    try:
        if not db.is_connected():
            await db.connect()

        # ===== 1. SEED ROLES =====
        print("Seeding roles...")
        roles_data = [
            {"role_name": "admin"},
            {"role_name": "supervisor"},
            {"role_name": "guard"},
            {"role_name": "caregiver"}
        ]
        
        created_roles = {}
        for role_data in roles_data:
            existing = await db.role.find_unique(where={"role_name": role_data["role_name"]})
            if not existing:
                role = await db.role.create(data=role_data)
                created_roles[role_data["role_name"]] = role.id
                print(f"  ✓ Created role: {role_data['role_name']}")
            else:
                created_roles[role_data["role_name"]] = existing.id
                print(f"  ✓ Role already exists: {role_data['role_name']}")

        # ===== 2. SEED USERS =====
        print("\nSeeding users...")
        users_data = [
            {
                "firstname": "Regine",
                "lastname": "Dahan",
                "username": "reginedahan",
                "password": generate_password_hash("agapai321"),
                "role_id": created_roles["admin"]
            },
            {
                "firstname": "Kath",
                "lastname": "Nava",
                "username": "kathnava",
                "password": generate_password_hash("kath321"),
                "role_id": created_roles["supervisor"]
            },
            {
                "firstname": "Kaye",
                "lastname": "Casem",
                "username": "kayrecasem",
                "password": generate_password_hash("kaye321"),
                "role_id": created_roles["guard"]
            },
            {
                "firstname": "Mary",
                "lastname": "Cam",
                "username": "marycam",
                "password": generate_password_hash("mary321"),
                "role_id": created_roles["caregiver"]
            }
        ]

        for user_data in users_data:
            existing = await db.user.find_unique(where={"username": user_data["username"]})
            if not existing:
                user = await db.user.create(data=user_data)
                role_name = [k for k, v in created_roles.items() if v == user_data['role_id']][0]
                print(f"  ✓ Created user: {user_data['username']} (Role: {role_name})")
            else:
                print(f"  ✓ User already exists: {user_data['username']}")

        # ===== 3. SEED LOCATIONS =====
        print("\nSeeding locations...")
        locations_data = [
            {"loc_name": "Sebastian"},
            {"loc_name": "Emmanuel"},
            {"loc_name": "Rose of Lima"},
            {"loc_name": "Gabriel"},
            {"loc_name": "Charbel"}
        ]

        created_locations = {}
        for loc_data in locations_data:
            existing = await db.location.find_unique(where={"loc_name": loc_data["loc_name"]})
            if not existing:
                location = await db.location.create(data=loc_data)
                created_locations[loc_data["loc_name"]] = location.id
                print(f"  ✓ Created location: {loc_data['loc_name']}")
            else:
                created_locations[loc_data["loc_name"]] = existing.id
                print(f"  ✓ Location already exists: {loc_data['loc_name']}")

        # ===== 4. SEED EVENT TYPES =====
        print("\nSeeding event types...")
        event_types_data = [
            {"event_type_name": "Fall"},
            {"event_type_name": "Inactive"}
        ]

        created_event_types = {}
        for et_data in event_types_data:
            existing = await db.eventtype.find_unique(where={"event_type_name": et_data["event_type_name"]})
            if not existing:
                event_type = await db.eventtype.create(data=et_data)
                created_event_types[et_data["event_type_name"]] = event_type.id
                print(f"  ✓ Created event type: {et_data['event_type_name']}")
            else:
                created_event_types[et_data["event_type_name"]] = existing.id
                print(f"  ✓ Event type already exists: {et_data['event_type_name']}")

        # ===== 5. SEED EVENT CLASSES =====
        print("\nSeeding event classes...")
        event_classes_data = [
            {"class_name": "Forward Fall", "event_type_id": created_event_types["Fall"]},
            {"class_name": "Backward Fall", "event_type_id": created_event_types["Fall"]},
            {"class_name": "Side Fall", "event_type_id": created_event_types["Fall"]},
            {"class_name": "Low", "event_type_id": created_event_types["Inactive"]}
        ]

        for ec_data in event_classes_data:
            existing = await db.eventclass.find_first(where={"class_name": ec_data["class_name"]})
            if not existing:
                event_class = await db.eventclass.create(data=ec_data)
                print(f"  ✓ Created event class: {ec_data['class_name']}")
            else:
                print(f"  ✓ Event class already exists: {ec_data['class_name']}")

        # ===== 6. SEED CAMERAS =====
        print("\nSeeding cameras...")
        cameras_data = [
            {
                "cam_name": "Sebastian Camera",
                "cam_status": True,
                "stream_url": "rtsp://camera1.local/stream",
                "loc_id": created_locations.get("Sebastian")
            },
            {
                "cam_name": "Emmanuel Camera",
                "cam_status": True,
                "stream_url": "rtsp://camera2.local/stream",
                "loc_id": created_locations.get("Emmanuel")
            },
            {
                "cam_name": "Rose of Lima Camera",
                "cam_status": True,
                "stream_url": "rtsp://camera3.local/stream",
                "loc_id": created_locations.get("Rose of Lima")
            },
            {
                "cam_name": "Gabriel Camera",
                "cam_status": True,
                "stream_url": "rtsp://camera4.local/stream",
                "loc_id": created_locations.get("Gabriel")
            },
            {
                "cam_name": "Charbel Camera",
                "cam_status": True,
                "stream_url": "rtsp://camera5.local/stream",
                "loc_id": created_locations.get("Charbel")
            }
        ]

        for cam_data in cameras_data:
            existing = await db.camera.find_unique(where={"cam_name": cam_data["cam_name"]})
            if not existing:
                camera = await db.camera.create(data=cam_data)
                print(f"  ✓ Created camera: {cam_data['cam_name']}")
            else:
                print(f"  ✓ Camera already exists: {cam_data['cam_name']}")

        print("\n✅ Database seeding completed successfully!")
        return {"status": "success", "message": "Database seeded completely"}

    except Exception as e:
        print(f"❌ Seed Error: {e}")
        import traceback
        traceback.print_exc()
        return {"status": "error", "message": str(e)}


if __name__ == "__main__":
    result = asyncio.run(seed_database())