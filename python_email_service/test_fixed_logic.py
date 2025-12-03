#!/usr/bin/env python3
"""
Test Fixed Email Logic - Ensure ALL users get emails
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import psycopg2
from psycopg2.extras import RealDictCursor

DATABASE_URL = "postgresql://neondb_owner:npg_PZae5A9gHpbY@ep-fragrant-violet-ad4xrlr3-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"

def test_fixed_logic():
    """Test the fixed email logic"""
    print("🔧 TESTING FIXED EMAIL LOGIC")
    print("=" * 60)
    
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # 1. Show ALL users in database
        print("\n1. 👥 ALL USERS IN DATABASE:")
        print("-" * 40)
        cursor.execute("""
            SELECT user_id, name, email, calorie_goal, protein_goal
            FROM users 
            ORDER BY user_id
        """)
        all_users = cursor.fetchall()
        
        for user in all_users:
            email_status = "✅" if user['email'] else "❌"
            print(f"   {email_status} ID:{user['user_id']} {user['name']} ({user['email']})")
            if user['email']:
                print(f"      Goals: {user['calorie_goal']}cal, {user['protein_goal']}g")
        
        print(f"\n   Total users: {len(all_users)}")
        users_with_emails = [u for u in all_users if u['email']]
        print(f"   Users with emails: {len(users_with_emails)}")
        
        # 2. Show email preferences
        print("\n2. 📧 EMAIL PREFERENCES:")
        print("-" * 40)
        cursor.execute("""
            SELECT ep.user_id, u.name, ep.daily_reminders_enabled, ep.achievement_notifications_enabled
            FROM email_preferences ep
            JOIN users u ON ep.user_id = u.user_id
            ORDER BY ep.user_id
        """)
        prefs = cursor.fetchall()
        
        if prefs:
            for pref in prefs:
                daily = "✅" if pref['daily_reminders_enabled'] else "❌"
                achievement = "✅" if pref['achievement_notifications_enabled'] else "❌"
                print(f"   ID:{pref['user_id']} {pref['name']} - Daily:{daily} Achievement:{achievement}")
        else:
            print("   No email preferences set")
        
        # 3. Test FIXED query logic
        print("\n3. 🔧 TESTING FIXED QUERY LOGIC:")
        print("-" * 40)
        
        # Check if email_preferences exists
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'email_preferences'
            )
        """)
        result = cursor.fetchone()
        email_prefs_exists = result['exists'] if result else False
        print(f"   Email preferences table exists: {email_prefs_exists}")
        
        # Use the FIXED logic
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
                    COALESCE(ep.reminder_time, '09:00:00') as reminder_time
                FROM users u
                LEFT JOIN email_preferences ep ON u.user_id = ep.user_id
                WHERE u.email IS NOT NULL 
                AND u.email != ''
                AND u.email != 'user@example.com'
                AND (ep.daily_reminders_enabled IS NULL OR ep.daily_reminders_enabled = true)
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
        print(f"   Users found by FIXED email query: {len(email_users)}")
        
        for user in email_users:
            daily_status = "✅" if user['daily_reminders_enabled'] else "❌"
            print(f"   {daily_status} ID:{user['user_id']} {user['name']} ({user['email']})")
            print(f"      Goals: {user['calorie_goal']}cal, {user['protein_goal']}g protein")
        
        # 4. Compare results
        print(f"\n4. 📊 COMPARISON:")
        print("-" * 40)
        print(f"   Total users in DB: {len(all_users)}")
        print(f"   Users with emails: {len(users_with_emails)}")
        print(f"   Users with preferences: {len(prefs)}")
        print(f"   Users for email service: {len(email_users)}")
        
        # 5. Logic verification
        print(f"\n5. ✅ LOGIC VERIFICATION:")
        print("-" * 40)
        
        missing_users = []
        for user in users_with_emails:
            found = any(eu['user_id'] == user['user_id'] for eu in email_users)
            if not found:
                missing_users.append(user)
        
        if missing_users:
            print("   ❌ MISSING USERS (should get emails but don't):")
            for user in missing_users:
                print(f"      • ID:{user['user_id']} {user['name']} ({user['email']})")
        else:
            print("   ✅ ALL USERS WITH EMAILS WILL RECEIVE EMAILS!")
        
        # 6. Final assessment
        print(f"\n6. 🎯 FINAL ASSESSMENT:")
        print("-" * 40)
        
        if len(email_users) == len(users_with_emails):
            print("   🎉 PERFECT! Email system will send to ALL users with emails")
            print("   ✅ No loopholes - every user with email gets personalized reminders")
            print("   ✅ Respects preferences - users can opt out if they want")
            print("   ✅ Default behavior - include everyone unless explicitly disabled")
        else:
            print(f"   ⚠️  ISSUE: Expected {len(users_with_emails)} users, got {len(email_users)}")
            print("   Some users with emails are being filtered out")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_fixed_logic()
