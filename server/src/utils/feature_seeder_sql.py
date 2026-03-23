"""
Seed script to initialize CategoryFeature and CategoryFeaturePermission tables using raw SQL.
Uses raw SQL because Prisma Python client hasn't been regenerated with new models.
"""

import asyncio
import logging
from database import db
from src.utils.feature_constants import CATEGORY_FEATURES, DEFAULT_FEATURE_VISIBILITY

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def seed():
    """Seed features and permissions using raw SQL."""
    logger.info("=" * 60)
    logger.info("Starting Feature-Level Permissions Seeding (SQL-based)")
    logger.info("=" * 60)
    
    try:
        # Ensure database connection
        if not db.is_connected():
            await db.connect()
        
        # 1. Ensure categories exist
        logger.info("Ensuring SettingsCategory records exist...")
        category_definitions = {
            "my_account": ("My Account", "Personal account settings and profile", "FaUser", 1),
            "notifications": ("Notifications", "Notification preferences and settings", "FaBell", 2),
            "device_location": ("Devices & Locations", "Cameras and location management", "FaCameraVideo", 3),
            "user_management": ("User Management", "Manage users and roles", "FaUsers", 4),
            "permissions": ("Permissions", "Feature visibility per role", "FaLock", 5),
            "category_permissions": ("Category Settings", "Manage category visibility", "FaCog", 6),
            "audit_log": ("Audit Log", "View system activity and changes", "FaFileAlt", 7),
        }
        
        for cat_key, (cat_name, desc, icon, sort_order) in category_definitions.items():
            try:
                # Insert category if it doesn't exist
                await db.query_raw(f"""
                    INSERT INTO settings_categories (category_key, category_name, description, icon_class, sort_order, is_active, created_at, updated_at)
                    VALUES ('{cat_key}', '{cat_name}', '{desc}', '{icon}', {sort_order}, true, NOW(), NOW())
                    ON CONFLICT (category_key) DO NOTHING
                """)
                logger.info(f"  ✓ Category ready: {cat_key}")
            except Exception as e:
                logger.error(f"  ✗ Error with category {cat_key}: {e}")
        
        # 2. Seed features
        logger.info("Seeding CategoryFeature records...")
        feature_count = 0
        
        # Get category IDs from database
        category_ids = await db.query_raw("""
            SELECT id, category_key FROM settings_categories
        """)
        category_map = {row['category_key']: row['id'] for row in category_ids}
        
        for category_key, features_list in CATEGORY_FEATURES.items():
            category_id = category_map.get(category_key)
            if not category_id:
                logger.warning(f"  Category not found: {category_key}")
                continue
            
            logger.info(f"Processing category: {category_key}")
            
            for sort_order, feature_def in enumerate(features_list):
                feature_key = feature_def["feature_key"]
                feature_name = feature_def["feature_name"].replace("'", "''")  # Escape quotes
                description = feature_def.get("description", "").replace("'", "''")
                
                try:
                    await db.query_raw(f"""
                        INSERT INTO category_features (category_id, feature_key, feature_name, description, is_active, sort_order, created_at, updated_at)
                        VALUES ({category_id}, '{feature_key}', '{feature_name}', '{description}', true, {sort_order}, NOW(), NOW())
                        ON CONFLICT (category_id, feature_key) DO NOTHING
                    """)
                    feature_count += 1
                    logger.info(f"  ✓ Feature added: {feature_name}")
                except Exception as e:
                    logger.error(f"  ✗ Error adding feature {feature_key}: {e}")
        
        logger.info(f"CategoryFeature seeding complete. {feature_count} features added.")
        
        # 3. Seed permissions
        logger.info("Seeding CategoryFeaturePermission records...")
        
        # Get all features and roles
        features = await db.query_raw("""
            SELECT id, feature_key FROM category_features
        """)
        feature_map = {row['feature_key']: row['id'] for row in features}
        
        roles = await db.query_raw("""
            SELECT id, role_name FROM roles
        """)
        role_list = [(row['id'], row['role_name']) for row in roles]
        
        permission_count = 0
        
        for role_id, role_name in role_list:
            logger.info(f"  Processing role: {role_name}")
            
            # Get visibility settings for this role
            role_visibility = DEFAULT_FEATURE_VISIBILITY.get(role_name, {})
            
            for feature_key, is_visible in role_visibility.items():
                feature_id = feature_map.get(feature_key)
                if not feature_id:
                    logger.warning(f"    Feature not found: {feature_key}")
                    continue
                
                try:
                    is_visible_int = 1 if is_visible else 0
                    await db.query_raw(f"""
                        INSERT INTO category_feature_permissions (feature_id, role_id, is_visible, created_at, updated_at)
                        VALUES ({feature_id}, {role_id}, {is_visible_int}, NOW(), NOW())
                        ON CONFLICT (feature_id, role_id) DO NOTHING
                    """)
                    permission_count += 1
                except Exception as e:
                    logger.error(f"    ✗ Error with permission {role_name}.{feature_key}: {e}")
        
        logger.info(f"CategoryFeaturePermission seeding complete. {permission_count} permissions created.")
        
        logger.info("=" * 60)
        logger.info("✓ Seeding completed successfully!")
        logger.info("=" * 60)
        
    except Exception as e:
        logger.error(f"✗ Seeding failed: {e}")
        import traceback
        logger.error(traceback.format_exc())
        raise
    finally:
        # Close database connection
        await db.disconnect()


if __name__ == "__main__":
    asyncio.run(seed())
