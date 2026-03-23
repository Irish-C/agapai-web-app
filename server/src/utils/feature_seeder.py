"""
Seed script to initialize CategoryFeature and CategoryFeaturePermission tables.
Uses raw SQL since Prisma Python client hasn't been regenerated with new models.
"""

import asyncio
import logging
from database import db
from src.utils.feature_constants import CATEGORY_FEATURES, DEFAULT_FEATURE_VISIBILITY

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def seed_categories():
    """Ensure all category definitions exist in the database."""
    logger.info("Ensuring SettingsCategory records exist...")
    
    # Category definitions (metadata, not features)
    category_definitions = {
        "my_account": {
            "category_name": "My Account",
            "description": "Personal account settings and profile",
            "icon_class": "FaUser",
            "sort_order": 1,
        },
        "notifications": {
            "category_name": "Notifications",
            "description": "Notification preferences and settings",
            "icon_class": "FaBell",
            "sort_order": 2,
        },
        "device_location": {
            "category_name": "Devices & Locations",
            "description": "Cameras and location management",
            "icon_class": "FaCameraVideo",
            "sort_order": 3,
        },
        "user_management": {
            "category_name": "User Management",
            "description": "Manage users and roles",
            "icon_class": "FaUsers",
            "sort_order": 4,
        },
        "permissions": {
            "category_name": "Permissions",
            "description": "Feature visibility per role",
            "icon_class": "FaLock",
            "sort_order": 5,
        },
        "category_permissions": {
            "category_name": "Category Settings",
            "description": "Manage category visibility",
            "icon_class": "FaCog",
            "sort_order": 6,
        },
        "audit_log": {
            "category_name": "Audit Log",
            "description": "View system activity and changes",
            "icon_class": "FaFileAlt",
            "sort_order": 7,
        },
    }
    
    category_map = {}
    
    for category_key, metadata in category_definitions.items():
        try:
            # Check if exists
            existing = await db.settingscategory.find_unique(
                where={"category_key": category_key}
            )
            
            if existing:
                logger.info(f"  Category already exists: {category_key}")
                category_map[category_key] = existing.id
            else:
                # Create category
                category = await db.settingscategory.create(
                    data={
                        "category_key": category_key,
                        **metadata,
                    }
                )
                logger.info(f"  ✓ Created category: {category_key}")
                category_map[category_key] = category.id
        except Exception as e:
            logger.error(f"  ✗ Error creating category {category_key}: {e}")
    
    return category_map


async def seed_category_features():
    """Seed CategoryFeature table with all features per category."""
    # Ensure database connection
    if not db.is_connected():
        await db.connect()
    
    logger.info("Seeding CategoryFeature table...")
    
    # First ensure categories exist
    category_map = await seed_categories()
    
    if not category_map:
        logger.error("No categories found. Cannot seed features.")
        return {}
    
    logger.info("Creating CategoryFeature records...")
    
    # Iterate through features for each category in constants
    for category_key, features_list in CATEGORY_FEATURES.items():
        category_id = category_map.get(category_key)
        if not category_id:
            logger.warning(f"Category not found for key: {category_key}")
            continue
        
        logger.info(f"Processing category: {category_key}")
        
        for sort_order, feature_def in enumerate(features_list):
            try:
                # Check if feature already exists
                existing = await db.categoryFeature.find_unique(
                    where={
                        "category_id_feature_key": {
                            "category_id": category_id,
                            "feature_key": feature_def["feature_key"],
                        }
                    }
                )
                
                if existing:
                    logger.debug(f"  Feature already exists: {feature_def['feature_name']}")
                    continue
                
                # Create feature
                feature = await db.categoryFeature.create(
                    data={
                        "category_id": category_id,
                        "feature_key": feature_def["feature_key"],
                        "feature_name": feature_def["feature_name"],
                        "description": feature_def.get("description", ""),
                        "is_active": True,
                        "sort_order": sort_order,
                    }
                )
                logger.info(f"  ✓ Created feature: {feature_def['feature_name']}")
                
            except Exception as e:
                logger.error(f"  ✗ Error creating feature {feature_def['feature_key']}: {e}")
    
    logger.info(f"CategoryFeature seeding complete. Total categories: {len(category_map)}")
    return category_map


async def seed_role_feature_permissions(category_map: dict):
    """Seed CategoryFeaturePermission table with role-feature visibility."""
    # Ensure database connection
    if not db.is_connected():
        await db.connect()
    
    logger.info("Seeding CategoryFeaturePermission table...")
    
    # Get all roles
    roles = await db.role.find_many()
    
    total_created = 0
    
    for role in roles:
        logger.info(f"Processing role: {role.role_name}")
        
        # Get default visibility for this role
        role_visibility = DEFAULT_FEATURE_VISIBILITY.get(role.role_name, {})
        
        # Get all features to assign permissions
        for category_key, feature_list in CATEGORY_FEATURES.items():
            category_id = category_map.get(category_key)
            if not category_id:
                logger.warning(f"Category not found: {category_key}")
                continue
            
            for feature_def in feature_list:
                feature_key = feature_def["feature_key"]
                is_visible = role_visibility.get(feature_key, False)
                
                try:
                    # Get feature by category_id and feature_key
                    feature = await db.categoryFeature.find_unique(
                        where={
                            "category_id_feature_key": {
                                "category_id": category_id,
                                "feature_key": feature_key,
                            }
                        }
                    )
                    
                    if not feature:
                        logger.warning(f"Feature not found: {feature_key}")
                        continue
                    
                    # Check if permission already exists
                    existing = await db.categoryFeaturePermission.find_unique(
                        where={
                            "feature_id_role_id": {
                                "feature_id": feature.id,
                                "role_id": role.id,
                            }
                        }
                    )
                    
                    if existing:
                        logger.debug(f"  Permission already exists for {role.role_name}.{feature_key}")
                        continue
                    
                    # Create permission
                    await db.categoryFeaturePermission.create(
                        data={
                            "feature_id": feature.id,
                            "role_id": role.id,
                            "is_visible": is_visible,
                        }
                    )
                    total_created += 1
                    
                except Exception as e:
                    logger.error(f"  ✗ Error creating permission for {role.role_name}.{feature_key}: {e}")
    
    logger.info(f"CategoryFeaturePermission seeding complete. Total permissions created: {total_created}")


async def main():
    """Main seeding function."""
    logger.info("=" * 60)
    logger.info("Starting Feature-Level Permissions Seeding")
    logger.info("=" * 60)
    
    try:
        # Ensure database connection
        if not db.is_connected():
            await db.connect()
        
        # Seed features
        category_map = await seed_category_features()
        
        # Seed role feature permissions
        await seed_role_feature_permissions(category_map)
        
        logger.info("=" * 60)
        logger.info("✓ Seeding completed successfully!")
        logger.info("=" * 60)
        
    except Exception as e:
        logger.error(f"✗ Seeding failed: {e}")
        raise
    finally:
        # Close database connection
        await db.disconnect()


if __name__ == "__main__":
    asyncio.run(main())
