import asyncio
import os
from datetime import UTC, datetime, timedelta
from database import db
from werkzeug.security import generate_password_hash

async def seed_database():
    try:
        if not db.is_connected():
            await db.connect()

        seed_password = os.getenv('AGAPAI_SEED_PASSWORD')
        if not seed_password:
            return {
                "status": "error",
                "message": "AGAPAI_SEED_PASSWORD is required for seeding user accounts"
            }

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
                "em": "reginefaedahan@gmail.com", "r": "admin", "bd": "1990-01-01T00:00:00Z"
            },
            {
                "fn": "Kath", "mn": "B", "ln": "Nava", "un": "kathnava", 
                "em": "kthcnava@gmail.com", "r": "supervisor", "bd": "1992-05-15T00:00:00Z"
            },
            {
                "fn": "Kaye", "mn": "C", "ln": "Casem", "un": "kayecasem", 
                "em": "kayecasem31@gmail.com", "r": "guard", "bd": "1995-10-20T00:00:00Z"
            },
            {
                "fn": "Mary", "mn": "D", "ln": "Cam", "un": "marycam", 
                "em": "maryirish.cammagay@gmail.com", "r": "caregiver", "bd": "1988-12-12T00:00:00Z"
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
                        'password': generate_password_hash(seed_password),
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
            'Fall': ["Forward Fall", "Backward Fall", "Side Fall"],
            'Inactivity': ["Inactive (low)", "Inactive (medium)", "Inactive (high)", "Inactive (critical)"],
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

        # ===== 6. SEED EVENT LOGS FOR REPORTS =====
        print("\nSeeding report logs...")
        existing_logs = await db.eventlog.count()
        if existing_logs == 0:
            cameras = await db.camera.find_many()
            classes = await db.eventclass.find_many()
            users = await db.user.find_many()

            cam_by_name = {camera.cam_name: camera for camera in cameras}
            class_by_name = {event_class.class_name: event_class for event_class in classes}
            user_by_username = {user.username: user for user in users}

            now = datetime.now(UTC)
            logs_to_seed = [
                {
                    'cam_name': 'Main Lobby Camera',
                    'class_name': 'Forward Fall',
                    'minutes_ago': 8,
                    'status': 'unacknowledged',
                    'ack_user': None,
                    'snapshot': '/static/snapshots/main-lobby-fall-1.jpg'
                },
                {
                    'cam_name': 'Dining Hall Camera',
                    'class_name': 'Inactive (medium)',
                    'minutes_ago': 25,
                    'status': 'acknowledged',
                    'ack_user': 'kathnava',
                    'snapshot': '/static/snapshots/dining-hall-inactive-1.jpg'
                },
                {
                    'cam_name': 'Sebastian Camera',
                    'class_name': 'Side Fall',
                    'minutes_ago': 42,
                    'status': 'acknowledged',
                    'ack_user': 'reginedahan',
                    'snapshot': '/static/snapshots/sebastian-side-fall-1.jpg'
                },
                {
                    'cam_name': 'Emmanuel Camera',
                    'class_name': 'Backward Fall',
                    'minutes_ago': 71,
                    'status': 'unacknowledged',
                    'ack_user': None,
                    'snapshot': '/static/snapshots/emmanuel-backward-fall-1.jpg'
                },
                {
                    'cam_name': 'Rose of Lima Camera',
                    'class_name': 'Inactive (critical)',
                    'minutes_ago': 95,
                    'status': 'acknowledged',
                    'ack_user': 'marycam',
                    'snapshot': '/static/snapshots/rose-of-lima-inactive-critical-1.jpg'
                },
                {
                    'cam_name': 'Gabriel Camera',
                    'class_name': 'Inactive (low)',
                    'minutes_ago': 130,
                    'status': 'unacknowledged',
                    'ack_user': None,
                    'snapshot': '/static/snapshots/gabriel-inactive-low-1.jpg'
                },
                {
                    'cam_name': 'Charbel Camera',
                    'class_name': 'Inactive (high)',
                    'minutes_ago': 180,
                    'status': 'acknowledged',
                    'ack_user': 'kathnava',
                    'snapshot': '/static/snapshots/charbel-inactive-high-1.jpg'
                },
            ]

            created_count = 0
            for item in logs_to_seed:
                camera = cam_by_name.get(item['cam_name'])
                event_class = class_by_name.get(item['class_name'])
                ack_user = user_by_username.get(item['ack_user']) if item['ack_user'] else None

                if not camera or not event_class:
                    continue

                await db.eventlog.create(
                    data={
                        'timestamp': now - timedelta(minutes=item['minutes_ago']),
                        'event_status': item['status'],
                        'file_path': item['snapshot'],
                        'cam_id': camera.id,
                        'event_class_id': event_class.id,
                        'ack_by_user_id': ack_user.id if ack_user else None,
                    }
                )
                created_count += 1

            print(f" ✓ Seeded {created_count} report logs.")
        else:
            print(f" ✓ Report logs already exist: {existing_logs}")
        
        print("\n✅ Database seeding completed successfully!")
        return {"status": "success", "message": "Database seeded completely"}

    except Exception as e:
        print(f"❌ Seed Error: {e}")
        import traceback
        traceback.print_exc()
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    asyncio.run(seed_database())