import asyncio
from database import db
from werkzeug.security import generate_password_hash

async def seed_database():
    try:
        if not db.is_connected():
            await db.connect()

        # ===== 1. SEED ROLES (Manual Check) =====
        print("Seeding roles...")
        role_names = ["admin", "supervisor", "guard", "caregiver"]
        created_roles = {}

        for name in role_names:
            # find_first doesn't require a unique index
            role = await db.role.find_first(where={'role_name': name})
            if not role:
                role = await db.role.create(data={'role_name': name})
                print(f" ✓ Created role: {name}")
            else:
                print(f" ✓ Role exists: {name}")
            created_roles[name] = role.id

        # ===== 2. SEED USERS (Keep Upsert - Username is usually Unique) =====
        print("\nSeeding users...")
        users_data = [
            {"fn": "Regine", "ln": "Dahan", "un": "reginedahan", "pw": "agapai321", "r": "admin"},
            {"fn": "Kath", "ln": "Nava", "un": "kathnava", "pw": "kath321", "r": "supervisor"},
            {"fn": "Kaye", "ln": "Casem", "un": "kayrecasem", "pw": "kaye321", "r": "guard"},
            {"fn": "Mary", "ln": "Cam", "un": "marycam", "pw": "mary321", "r": "caregiver"}
        ]

        for u in users_data:
            await db.user.upsert(
                where={'username': u['un']},
                data={
                    'create': {
                        'firstname': u['fn'],
                        'lastname': u['ln'],
                        'username': u['un'],
                        'password': generate_password_hash(u['pw']),
                        'role': {'connect': {'id': created_roles[u['r']]}}
                    },
                    'update': {
                        'firstname': u['fn'],
                        'lastname': u['ln'],
                        'role_id': created_roles[u['r']]
                    }
                }
            )
        print(" ✓ Users processed.")

        # ===== 3. SEED LOCATIONS (Manual Check) =====
        print("\nSeeding locations...")
        loc_names = ["Sebastian", "Emmanuel", "Rose of Lima", "Gabriel", "Charbel"]
        created_locs = {}

        for name in loc_names:
            loc = await db.location.find_first(where={'loc_name': name})
            if not loc:
                loc = await db.location.create(data={'loc_name': name})
            created_locs[name] = loc.id
        print(" ✓ Locations processed.")

        # ===== 4. SEED EVENT TYPES & CLASSES (Manual Check) =====
        print("\nSeeding events...")
        et_name = 'Fall'
        fall_type = await db.eventtype.find_first(where={'event_type_name': et_name})
        if not fall_type:
            fall_type = await db.eventtype.create(data={'event_type_name': et_name})
        
        event_classes = ["Forward Fall", "Backward Fall", "Side Fall"]
        for cls in event_classes:
            existing_cls = await db.eventclass.find_first(where={'class_name': cls})
            if not existing_cls:
                await db.eventclass.create(
                    data={'class_name': cls, 'event_type_id': fall_type.id}
                )
        print(" ✓ Event types/classes processed.")

        # ===== 5. SEED CAMERAS (Manual Check) =====
        print("\nSeeding cameras...")
        for loc_name, loc_id in created_locs.items():
            cam_name = f"{loc_name} Camera"
            existing_cam = await db.camera.find_first(where={'cam_name': cam_name})
            if not existing_cam:
                await db.camera.create(
                    data={
                        'cam_name': cam_name,
                        'cam_status': True,
                        'stream_url': f"rtsp://{loc_name.lower().replace(' ', '')}.local/stream",
                        'loc_id': loc_id
                    }
                )
        
        print("\n✅ Database seeding completed successfully!")
        return {"status": "success", "message": "Database seeded completely"}

    except Exception as e:
        print(f"❌ Seed Error: {e}")
        import traceback
        traceback.print_exc()
        return {"status": "error", "message": str(e)}