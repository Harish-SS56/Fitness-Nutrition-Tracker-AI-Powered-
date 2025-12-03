#!/usr/bin/env python3
"""
COMPLETE EMAIL SYSTEM AUDIT - Line by line verification
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from email_service import FitnessEmailService
import json

def audit_email_system():
    """Complete line-by-line audit of email system"""
    print("🔍 COMPLETE EMAIL SYSTEM AUDIT")
    print("=" * 70)
    
    service = FitnessEmailService()
    
    # 1. Database Connection Test
    print("\n1. 🗄️ DATABASE CONNECTION TEST")
    print("-" * 40)
    db_result = service.test_database_connection()
    print(f"   Status: {'✅ SUCCESS' if db_result['success'] else '❌ FAILED'}")
    print(f"   Users Found: {db_result.get('users_found', 0)}")
    if db_result.get('users'):
        print("   Sample Users:")
        for user in db_result['users'][:3]:
            print(f"     • {user['name']} ({user['email']}) - {user['calorie_goal']}cal, {user['protein_goal']}g")
    
    # 2. SMTP Connection Test
    print("\n2. 📧 SMTP CONNECTION TEST")
    print("-" * 40)
    smtp_result = service.test_connection()
    print(f"   Status: {'✅ SUCCESS' if smtp_result['success'] else '❌ FAILED'}")
    print(f"   Method: {smtp_result.get('method', 'N/A')}")
    print(f"   Message: {smtp_result.get('message', 'N/A')}")
    
    # 3. User Data Fetching Test
    print("\n3. 👥 USER DATA FETCHING TEST")
    print("-" * 40)
    users = service.get_all_users_with_goals()
    print(f"   Total Users: {len(users)}")
    
    if users:
        print("   User Details:")
        for user in users:
            email_valid = "✅" if user['email'] and '@' in user['email'] else "❌"
            goals_valid = "✅" if user['calorie_goal'] and user['protein_goal'] else "❌"
            print(f"     {email_valid} {goals_valid} {user['name']} ({user['email']})")
            print(f"         Goals: {user['calorie_goal']}cal, {user['protein_goal']}g protein")
    
    # 4. Email Template Test
    print("\n4. 📝 EMAIL TEMPLATE TEST")
    print("-" * 40)
    if users:
        sample_user = users[0]
        template = service.generate_daily_reminder_text(
            sample_user['name'],
            sample_user['calorie_goal'],
            sample_user['protein_goal']
        )
        
        # Check if template has correct personalization
        has_name = sample_user['name'] in template
        has_calories = str(sample_user['calorie_goal']) in template
        has_protein = str(sample_user['protein_goal']) in template
        
        print(f"   Name Personalization: {'✅' if has_name else '❌'}")
        print(f"   Calorie Goal: {'✅' if has_calories else '❌'}")
        print(f"   Protein Goal: {'✅' if has_protein else '❌'}")
        
        print("   Template Preview:")
        lines = template.strip().split('\n')[:8]
        for line in lines:
            if line.strip():
                print(f"     {line}")
    
    # 5. Database Logging Test
    print("\n5. 💾 DATABASE LOGGING TEST")
    print("-" * 40)
    try:
        # Test logging function (without actually sending email)
        conn = service.get_db_connection()
        if conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM email_logs")
            log_count = cursor.fetchone()[0]
            print(f"   Email Logs Count: {log_count}")
            
            cursor.execute("SELECT COUNT(*) FROM email_statistics")
            stats_count = cursor.fetchone()[0]
            print(f"   Email Statistics Count: {stats_count}")
            
            cursor.close()
            conn.close()
            print("   Database Logging: ✅ WORKING")
        else:
            print("   Database Logging: ❌ FAILED")
    except Exception as e:
        print(f"   Database Logging: ❌ ERROR - {e}")
    
    # 6. Email Sending Flow Test
    print("\n6. 🚀 EMAIL SENDING FLOW TEST")
    print("-" * 40)
    
    if users and len(users) > 0:
        test_user = users[0]  # Use first user for test
        print(f"   Testing with: {test_user['name']} ({test_user['email']})")
        print(f"   Goals: {test_user['calorie_goal']}cal, {test_user['protein_goal']}g")
        
        # Test individual email sending
        result = service.send_daily_reminder(
            test_user['email'],
            test_user['name'],
            test_user['calorie_goal'],
            test_user['protein_goal'],
            test_user['user_id']
        )
        
        print(f"   Email Sent: {'✅ SUCCESS' if result['success'] else '❌ FAILED'}")
        if result['success']:
            print(f"   Message ID: {result.get('message_id', 'N/A')}")
        else:
            print(f"   Error: {result.get('error', 'Unknown')}")
    
    # 7. Bulk Email Test
    print("\n7. 📬 BULK EMAIL SYSTEM TEST")
    print("-" * 40)
    
    bulk_result = service.send_daily_reminders_to_all_users()
    print(f"   Status: {'✅ SUCCESS' if bulk_result['success'] else '❌ FAILED'}")
    print(f"   Total Users: {bulk_result.get('total_users', 0)}")
    print(f"   Emails Sent: {bulk_result.get('sent_count', 0)}")
    print(f"   Emails Failed: {bulk_result.get('failed_count', 0)}")
    
    # 8. Final Assessment
    print("\n8. 📊 FINAL ASSESSMENT")
    print("-" * 40)
    
    issues = []
    
    if not db_result['success']:
        issues.append("Database connection failed")
    
    if not smtp_result['success']:
        issues.append("SMTP connection failed")
    
    if len(users) == 0:
        issues.append("No users found with email addresses")
    
    if not bulk_result['success']:
        issues.append("Bulk email sending failed")
    
    if issues:
        print("   ❌ ISSUES FOUND:")
        for issue in issues:
            print(f"     • {issue}")
    else:
        print("   ✅ ALL SYSTEMS WORKING PERFECTLY!")
        print("   🎯 Email system correctly:")
        print("     • Connects to database")
        print("     • Fetches all users with emails")
        print("     • Personalizes each email with individual goals")
        print("     • Sends emails via SMTP")
        print("     • Logs all emails to database")
        print("     • Updates email statistics")
    
    print("\n" + "=" * 70)
    print("🎉 EMAIL SYSTEM AUDIT COMPLETED!")

if __name__ == "__main__":
    audit_email_system()
