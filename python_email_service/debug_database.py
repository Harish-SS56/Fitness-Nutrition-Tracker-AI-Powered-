#!/usr/bin/env python3
"""
Debug Database - Check what's in the users table
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import psycopg2
from psycopg2.extras import RealDictCursor

# Database connection
DATABASE_URL = "postgresql://neondb_owner:npg_PZae5A9gHpbY@ep-fragrant-violet-ad4xrlr3-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"

def debug_database():
    """Debug what's in the database"""
    print("🔍 DATABASE DEBUG")
    print("=" * 50)
    
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Check if users table exists
        print("\n1. Checking if users table exists...")
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'users'
            )
        """)
        users_table_exists = cursor.fetchone()['exists']
        print(f"   Users table exists: {users_table_exists}")
        
        if not users_table_exists:
            print("❌ Users table doesn't exist!")
            return
        
        # Check total users
        print("\n2. Checking total users...")
        cursor.execute("SELECT COUNT(*) as total FROM users")
        total_users = cursor.fetchone()['total']
        print(f"   Total users: {total_users}")
        
        # Check users with emails
        print("\n3. Checking users with emails...")
        cursor.execute("""
            SELECT COUNT(*) as total 
            FROM users 
            WHERE email IS NOT NULL AND email != ''
        """)
        users_with_emails = cursor.fetchone()['total']
        print(f"   Users with emails: {users_with_emails}")
        
        # Show all users
        print("\n4. All users in database:")
        cursor.execute("""
            SELECT user_id, name, email, calorie_goal, protein_goal, created_at
            FROM users 
            ORDER BY user_id
        """)
        users = cursor.fetchall()
        
        if users:
            for user in users:
                email_status = "✅" if user['email'] else "❌"
                print(f"   {email_status} ID: {user['user_id']}, Name: {user['name']}, Email: {user['email']}")
                print(f"      Goals: {user['calorie_goal']}cal, {user['protein_goal']}g protein")
        else:
            print("   No users found!")
        
        # Check email_preferences table
        print("\n5. Checking email_preferences table...")
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'email_preferences'
            )
        """)
        email_prefs_exists = cursor.fetchone()['exists']
        print(f"   Email preferences table exists: {email_prefs_exists}")
        
        if email_prefs_exists:
            cursor.execute("SELECT COUNT(*) as total FROM email_preferences")
            total_prefs = cursor.fetchone()['total']
            print(f"   Total email preferences: {total_prefs}")
        
        # Test the exact query from email service
        print("\n6. Testing email service query...")
        if email_prefs_exists:
            cursor.execute("""
                SELECT 
                    u.user_id,
                    u.name,
                    u.email,
                    u.calorie_goal,
                    u.protein_goal,
                    u.created_at,
                    COALESCE(ep.daily_reminders_enabled, true) as daily_reminders_enabled,
                    COALESCE(ep.achievement_notifications_enabled, true) as achievement_notifications_enabled,
                    ep.reminder_time
                FROM users u
                LEFT JOIN email_preferences ep ON u.user_id = ep.user_id
                WHERE u.email IS NOT NULL 
                AND u.email != ''
                AND u.email != 'user@example.com'
                AND COALESCE(ep.daily_reminders_enabled, true) = true
                ORDER BY u.created_at DESC
            """)
        else:
            cursor.execute("""
                SELECT 
                    u.user_id,
                    u.name,
                    u.email,
                    u.calorie_goal,
                    u.protein_goal,
                    u.created_at,
                    true as daily_reminders_enabled,
                    true as achievement_notifications_enabled,
                    '09:00:00' as reminder_time
                FROM users u
                WHERE u.email IS NOT NULL 
                AND u.email != ''
                AND u.email != 'user@example.com'
                ORDER BY u.created_at DESC
            """)
        
        email_users = cursor.fetchall()
        print(f"   Users found by email service query: {len(email_users)}")
        
        for user in email_users:
            print(f"   📧 {user['name']} ({user['email']}) - {user['calorie_goal']}cal, {user['protein_goal']}g")
        
        cursor.close()
        conn.close()
        
        print(f"\n📊 SUMMARY:")
        print(f"   Total users: {total_users}")
        print(f"   Users with emails: {users_with_emails}")
        print(f"   Users for email service: {len(email_users)}")
        
        if len(email_users) == 0:
            print("\n❌ PROBLEM: No users found for email service!")
            print("   Possible issues:")
            print("   1. No users have email addresses")
            print("   2. All emails are empty or 'user@example.com'")
            print("   3. Email preferences are disabled")
        else:
            print(f"\n✅ SUCCESS: Found {len(email_users)} users for email service!")
        
    except Exception as e:
        print(f"❌ Database error: {e}")

if __name__ == "__main__":
    debug_database()
