"""
Migration script to update existing users with new schema fields.

Adds:
- Default role ("user" for regular users, preserve "superadmin" for existing superadmin)
- Default status ("active")
- Empty profile fields (linkedin_url, title, company, etc.)
- Timestamps (updated_at, last_login_at)
"""

import asyncio
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

# Add backend directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

# Load environment variables
load_dotenv(Path(__file__).parent.parent / '.env')

MONGO_URL = os.environ.get('MONGO_URL')
DB_NAME = os.environ.get('DB_NAME', 'bestpl')


async def migrate_users():
    """Migrate existing users to new schema"""
    print("🔄 Starting user schema migration...")
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    try:
        # Get all users
        users = await db.users.find({}, {"_id": 0}).to_list(1000)
        print(f"📊 Found {len(users)} users to migrate")
        
        migrated_count = 0
        skipped_count = 0
        
        for user in users:
            user_id = user.get("user_id")
            email = user.get("email")
            
            print(f"\n👤 Processing user: {email} ({user_id})")
            
            # Build update data
            update_data = {}
            
            # 1. Add role if missing
            if "role" not in user:
                # Check if this is the superadmin
                if email == "noorussaba.alam@gmail.com":
                    update_data["role"] = "superadmin"
                    print("   ✅ Setting role: superadmin")
                else:
                    update_data["role"] = "user"
                    print("   ✅ Setting role: user")
            else:
                print(f"   ⏭️  Role already set: {user.get('role')}")
            
            # 2. Add status if missing
            if "status" not in user:
                update_data["status"] = "active"
                print("   ✅ Setting status: active")
            else:
                print(f"   ⏭️  Status already set: {user.get('status')}")
            
            # 3. Add profile fields if missing (set to None for optional fields)
            profile_fields = {
                "linkedin_url": None,
                "title": None,
                "company": None,
                "phone_number": None,
                "city": None,
                "country": None,
                "about_me": None,
                "help_topics": []
            }
            
            for field, default_value in profile_fields.items():
                if field not in user:
                    update_data[field] = default_value
                    print(f"   ✅ Adding field: {field}")
            
            # 4. Add timestamps if missing
            now = datetime.now(timezone.utc).isoformat()
            
            if "updated_at" not in user:
                update_data["updated_at"] = user.get("created_at", now)
                print("   ✅ Adding updated_at timestamp")
            
            if "last_login_at" not in user:
                update_data["last_login_at"] = user.get("created_at", now)
                print("   ✅ Adding last_login_at timestamp")
            
            # Update user if there are changes
            if update_data:
                result = await db.users.update_one(
                    {"user_id": user_id},
                    {"$set": update_data}
                )
                
                if result.modified_count > 0:
                    migrated_count += 1
                    print(f"   ✅ User migrated successfully")
                else:
                    print(f"   ⚠️  No changes made")
            else:
                skipped_count += 1
                print(f"   ⏭️  User already up to date")
        
        print("\n" + "="*60)
        print(f"✅ Migration complete!")
        print(f"   - Total users: {len(users)}")
        print(f"   - Migrated: {migrated_count}")
        print(f"   - Skipped (already migrated): {skipped_count}")
        print("="*60)
        
        # Create indexes
        print("\n🔧 Creating database indexes...")
        
        # Email index (unique)
        await db.users.create_index("email", unique=True)
        print("   ✅ Created unique index on 'email'")
        
        # Role index
        await db.users.create_index("role")
        print("   ✅ Created index on 'role'")
        
        # Status index
        await db.users.create_index("status")
        print("   ✅ Created index on 'status'")
        
        # Created_at index (for sorting)
        await db.users.create_index([("created_at", -1)])
        print("   ✅ Created descending index on 'created_at'")
        
        # Session token index (unique)
        await db.user_sessions.create_index("session_token", unique=True)
        print("   ✅ Created unique index on 'session_token'")
        
        # User sessions user_id index
        await db.user_sessions.create_index("user_id")
        print("   ✅ Created index on user_sessions.user_id")
        
        # API usage compound index
        await db.api_usage.create_index([("user_id", 1), ("date", 1)], unique=True)
        print("   ✅ Created compound index on api_usage (user_id, date)")
        
        # AI history indexes
        await db.ai_history.create_index([("user_id", 1), ("created_at", -1)])
        print("   ✅ Created compound index on ai_history (user_id, created_at)")
        
        print("\n✅ All indexes created successfully!")
        
    except Exception as e:
        print(f"\n❌ Migration failed: {str(e)}")
        raise
    finally:
        client.close()


if __name__ == "__main__":
    asyncio.run(migrate_users())
