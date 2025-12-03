#!/usr/bin/env python3
"""
Simple Email Test - No logging issues
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import psycopg2
from psycopg2.extras import RealDictCursor
import smtplib
from email.message import EmailMessage
from datetime import datetime

# Database and email configuration
DATABASE_URL = "postgresql://neondb_owner:npg_PZae5A9gHpbY@ep-fragrant-violet-ad4xrlr3-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
EMAIL = "harishdeepikassdeepikass@gmail.com"
PASSWORD = "vqsv erqr tstj mvdt"

def simple_test():
    """Simple test without logging issues"""
    print("🧪 SIMPLE EMAIL TEST")
    print("=" * 50)
    
    try:
        # 1. Test Database Connection
        print("\n1. 🗄️ Testing Database Connection...")
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Check email_preferences table
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'email_preferences'
            )
        """)
        result = cursor.fetchone()
        email_prefs_exists = result['exists'] if result else False
        print(f"   Email preferences table exists: {email_prefs_exists}")
        
        # Get users with emails
        if email_prefs_exists:
            cursor.execute("""
                SELECT 
                    u.user_id,
                    u.name,
                    u.email,
                    u.calorie_goal,
                    u.protein_goal,
                    u.created_at,
                    COALESCE(ep.daily_reminders_enabled, true) as daily_reminders_enabled
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
                    true as daily_reminders_enabled
                FROM users u
                WHERE u.email IS NOT NULL 
                AND u.email != ''
                AND u.email != 'user@example.com'
                ORDER BY u.created_at DESC
            """)
        
        users = cursor.fetchall()
        print(f"   ✅ Found {len(users)} users with emails")
        
        for user in users:
            print(f"      📧 {user['name']} ({user['email']}) - {user['calorie_goal']}cal, {user['protein_goal']}g")
        
        cursor.close()
        conn.close()
        
        if len(users) == 0:
            print("   ❌ No users found - cannot send emails")
            return
        
        # 2. Test SMTP Connection
        print(f"\n2. 📧 Testing SMTP Connection...")
        with smtplib.SMTP('smtp.gmail.com', 587) as smtp:
            smtp.ehlo()
            smtp.starttls()
            smtp.login(EMAIL, PASSWORD)
            print("   ✅ SMTP connection successful")
        
        # 3. Send Test Email to First User
        print(f"\n3. 🚀 Sending Test Email...")
        test_user = users[0]
        print(f"   Sending to: {test_user['name']} ({test_user['email']})")
        print(f"   Goals: {test_user['calorie_goal']}cal, {test_user['protein_goal']}g protein")
        
        # Create personalized email
        msg = EmailMessage()
        msg["Subject"] = "🏃‍♂️ Daily Fitness Reminder - Don't Forget Your Goals!"
        msg["From"] = f"Fitness Tracker App <{EMAIL}>"
        msg["To"] = test_user['email']
        
        email_content = f"""
Good Morning, {test_user['name']}!

🎯 Your Daily Goals:
• Calorie Goal: {test_user['calorie_goal']} calories
• Protein Goal: {test_user['protein_goal']}g protein

📝 Quick Reminders:
• Log your meals throughout the day
• Stay hydrated - drink plenty of water  
• Get some physical activity in
• Check your progress in the app

Remember: Small consistent actions lead to big results! You've got this! 💪

This is your daily fitness reminder from Fitness Tracker App.
Keep pushing towards your goals! 🌟
        """
        
        msg.set_content(email_content)
        
        # Send email
        with smtplib.SMTP('smtp.gmail.com', 587) as smtp:
            smtp.ehlo()
            smtp.starttls()
            smtp.login(EMAIL, PASSWORD)
            smtp.send_message(msg)
        
        print("   ✅ Test email sent successfully!")
        
        # 4. Summary
        print(f"\n📊 SUMMARY:")
        print(f"   Database: ✅ Connected")
        print(f"   Users Found: ✅ {len(users)} users")
        print(f"   SMTP: ✅ Working")
        print(f"   Email Sent: ✅ Success")
        print(f"   Personalization: ✅ Individual goals used")
        
        print(f"\n🎉 ALL SYSTEMS WORKING PERFECTLY!")
        print(f"   Your email system can send to all {len(users)} users with their individual goals!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    simple_test()
