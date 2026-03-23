"""
Feature initialization helper - automatically seeds features if not present
"""

import logging
from database import db
from src.utils.feature_constants import CATEGORY_FEATURES, DEFAULT_FEATURE_VISIBILITY

logger = logging.getLogger(__name__)


async def seed_features_if_needed():
    """Check if features are seeded, and seed them if not"""
    try:
        # Try to count features - this will work if tables are available
        # even if hasattr() returned False earlier (models load dynamically)
        feature_count = await db.categoryfeature.count()
        
        if feature_count > 0:
            logger.info(f"Features already seeded ({feature_count} features found)")
            return True
        
        logger.info("No features found in database. Seeding features...")
        
        # Ensure categories exist
        await seed_categories_if_needed()
        
        # Seed category features
        await seed_category_features()
        
        # Seed role feature permissions
        await seed_role_feature_permissions()
        
        logger.info("✓ Feature seeding completed successfully")
        return True
        
    except AttributeError as e:
        # Prisma client doesn't have feature tables - graceful fallback
        logger.warning(f"Feature tables not available in Prisma client: {e}")
        logger.info("System will use code-defined DEFAULT_FEATURE_VISIBILITY for fallback.")
        return True
    except Exception as e:
        logger.error(f"Error seeding features: {e}")
        logger.info("System will continue using code-defined DEFAULT_FEATURE_VISIBILITY for fallback.")
        # Don't fail startup if seeding fails - features can still use code defaults
        return False


async def seed_categories_if_needed():
    """Ensure all settings categories exist"""
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
    
    for category_key, metadata in category_definitions.items():
        existing = await db.settingscategory.find_unique(
            where={"category_key": category_key}
        )
        if not existing:
            await db.settingscategory.create(
                data={
                    "category_key": category_key,
                    **metadata,
                }
            )
            logger.debug(f"Created category: {category_key}")


async def seed_category_features():
    """Seed all features for each category"""
    logger.info("Seeding category features...")
    
    for category_key, features_list in CATEGORY_FEATURES.items():
        category = await db.settingscategory.find_unique(
            where={"category_key": category_key}
        )
        
        if not category:
            logger.warning(f"Category not found: {category_key}")
            continue
        
        for sort_order, feature_def in enumerate(features_list):
            existing = await db.categoryfeature.find_unique(
                where={
                    "category_id_feature_key": {
                        "category_id": category.id,
                        "feature_key": feature_def["feature_key"],
                    }
                }
            )
            
            if not existing:
                await db.categoryfeature.create(
                    data={
                        "category_id": category.id,
                        "feature_key": feature_def["feature_key"],
                        "feature_name": feature_def["feature_name"],
                        "description": feature_def.get("description", ""),
                        "is_active": True,
                        "sort_order": sort_order,
                    }
                )
    
    logger.info(f"✓ CategoryFeature seeding complete")


async def seed_role_feature_permissions():
    """Seed category feature permissions for all roles"""
    logger.info("Seeding role feature permissions...")
    
    roles = await db.role.find_many()
    total_created = 0
    
    for role in roles:
        role_visibility = DEFAULT_FEATURE_VISIBILITY.get(role.role_name, {})
        
        for category_key, feature_list in CATEGORY_FEATURES.items():
            category = await db.settingscategory.find_unique(
                where={"category_key": category_key}
            )
            
            if not category:
                continue
            
            for feature_def in feature_list:
                feature_key = feature_def["feature_key"]
                is_visible = role_visibility.get(feature_key, False)
                
                feature = await db.categoryfeature.find_unique(
                    where={
                        "category_id_feature_key": {
                            "category_id": category.id,
                            "feature_key": feature_key,
                        }
                    }
                )
                
                if not feature:
                    continue
                
                existing = await db.categoryfeaturepermission.find_unique(
                    where={
                        "feature_id_role_id": {
                            "feature_id": feature.id,
                            "role_id": role.id,
                        }
                    }
                )
                
                if not existing:
                    await db.categoryfeaturepermission.create(
                        data={
                            "feature_id": feature.id,
                            "role_id": role.id,
                            "is_visible": is_visible,
                        }
                    )
                    total_created += 1
    
    logger.info(f"✓ CategoryFeaturePermission seeding complete. Created {total_created} permissions")
