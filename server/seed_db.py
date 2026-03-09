import asyncio
from datetime import datetime
from database import db
from werkzeug.security import generate_password_hash

async def seed_database():
    try:
        if not db.is_connected():
            await db.connect()

        # ===== 1. SEED ROLES =====
        print("Seeding roles...")
        role_names = ["admin", "supervisor", "guard", "caregiver"]
        created_roles = {}

        for name in role_names:
            role = await db.role.find_first(where={'role_name': name})
            if not role:
                role = await db.role.create(data={'role_name': name})
                print(f" ✓ Created role: {name}")
            else:
                print(f" ✓ Role exists: {name}")
            created_roles[name] = role.id

        # ===== 2. SEED USERS (Updated for New Schema) =====
        print("\nSeeding users...")
        # Note: Added email, birthdate, and middle_name to match schema
        users_data = [
            {
                "fn": "Regine", "mn": "A", "ln": "Dahan", "un": "reginedahan", 
                "em": "regine@agapai.com", "pw": "agapai321", "r": "admin", "bd": "1990-01-01T00:00:00Z"
            },
            {
                "fn": "Kath", "mn": "B", "ln": "Nava", "un": "kathnava", 
                "em": "kath@agapai.com", "pw": "kath321", "r": "supervisor", "bd": "1992-05-15T00:00:00Z"
            },
            {
                "fn": "Kaye", "mn": "C", "ln": "Casem", "un": "kayrecasem", 
                "em": "kaye@agapai.com", "pw": "kaye321", "r": "guard", "bd": "1995-10-20T00:00:00Z"
            },
            {
                "fn": "Mary", "mn": "D", "ln": "Cam", "un": "marycam", 
                "em": "mary@agapai.com", "pw": "mary321", "r": "caregiver", "bd": "1988-12-12T00:00:00Z"
            }
        ]

        for u in users_data:
            await db.user.upsert(
                where={'username': u['un']},
                data={
                    'create': {
                        'firstname': u['fn'],
                        'middle_name': u['mn'],
                        'lastname': u['ln'],
                        'email': u['em'],
                        'birthdate': u['bd'],
                        'username': u['un'],
                        'password': generate_password_hash(u['pw']),
                        'role': {'connect': {'id': created_roles[u['r']]}}
                    },
                    'update': {
                        'firstname': u['fn'],
                        'lastname': u['ln'],
                        'email': u['em'],
                        'role_id': created_roles[u['r']]
                    }
                }
            )
        print(" ✓ Users processed.")

        # ===== 3. SEED LOCATIONS =====
        print("\nSeeding locations...")
        loc_names = ["Sebastian", "Emmanuel", "Rose of Lima", "Gabriel", "Charbel", "Main Lobby", "Dining Hall"]
        created_locs = {}

        for name in loc_names:
            loc = await db.location.find_first(where={'loc_name': name})
            if not loc:
                loc = await db.location.create(data={'loc_name': name})
            created_locs[name] = loc.id
        print(" ✓ Locations processed.")

        # ===== 4. SEED EVENT TYPES & CLASSES =====
        print("\nSeeding events...")
        event_types = {
            'Fall': ["Forward Fall", "Backward Fall", "Side Fall", "Slumped Chair"],
            'Activity': ["Wandering", "Normal Movement", "Restricted Area Entry"]
        }
        
        for type_name, classes in event_types.items():
            et = await db.eventtype.find_first(where={'event_type_name': type_name})
            if not et:
                et = await db.eventtype.create(data={'event_type_name': type_name})
            
            for cls in classes:
                existing_cls = await db.eventclass.find_first(where={'class_name': cls})
                if not existing_cls:
                    await db.eventclass.create(
                        data={'class_name': cls, 'event_type_id': et.id}
                    )
        print(" ✓ Event types/classes processed.")

        # ===== 5. SEED CAMERAS =====
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