#!/usr/bin/env python3
"""
Analyze Email Logs Table Usage
Check how email_logs table is used across the system
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import psycopg2
from psycopg2.extras import RealDictCursor

DATABASE_URL = "postgresql://neondb_owner:npg_PZae5A9gHpbY@ep-fragrant-violet-ad4xrlr3-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"

def analyze_email_logs():
    """Analyze email_logs table usage and data"""
    print("📊 EMAIL_LOGS TABLE ANALYSIS")
    print("=" * 60)
    
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # 1. Check table structure
        print("\n1. 📋 EMAIL_LOGS TABLE STRUCTURE:")
        print("-" * 40)
        cursor.execute("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'email_logs'
            ORDER BY ordinal_position
        """)
        columns = cursor.fetchall()
        
        for col in columns:
            nullable = "NULL" if col['is_nullable'] == 'YES' else "NOT NULL"
            default = f" DEFAULT {col['column_default']}" if col['column_default'] else ""
            print(f"   • {col['column_name']}: {col['data_type']} {nullable}{default}")
        
        # 2. Check current data
        print(f"\n2. 📧 CURRENT EMAIL_LOGS DATA:")
        print("-" * 40)
        cursor.execute("""
            SELECT COUNT(*) as total_logs FROM email_logs
        """)
        total = cursor.fetchone()['total_logs']
        print(f"   Total email logs: {total}")
        
        if total > 0:
            # Show recent logs
            cursor.execute("""
                SELECT 
                    email_log_id, user_id, recipient_email, email_type, 
                    subject, status, sent_at, error_message
                FROM email_logs 
                ORDER BY sent_at DESC 
                LIMIT 10
            """)
            recent_logs = cursor.fetchall()
            
            print(f"\n   📋 Recent Email Logs (Last 10):")
            for log in recent_logs:
                status_icon = "✅" if log['status'] == 'sent' else "❌" if log['status'] == 'failed' else "⏳"
                error_info = f" - {log['error_message']}" if log['error_message'] else ""
                print(f"     {status_icon} ID:{log['email_log_id']} | {log['email_type']} | {log['recipient_email']}")
                print(f"        Subject: {log['subject'][:50]}...")
                print(f"        Time: {log['sent_at']}{error_info}")
                print()
        
        # 3. Check by email type
        print(f"\n3. 📊 EMAILS BY TYPE:")
        print("-" * 40)
        cursor.execute("""
            SELECT email_type, COUNT(*) as count, 
                   SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
                   SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
            FROM email_logs 
            GROUP BY email_type 
            ORDER BY count DESC
        """)
        type_stats = cursor.fetchall()
        
        for stat in type_stats:
            print(f"   • {stat['email_type']}: {stat['count']} total ({stat['sent']} sent, {stat['failed']} failed)")
        
        # 4. Check by status
        print(f"\n4. 📈 EMAILS BY STATUS:")
        print("-" * 40)
        cursor.execute("""
            SELECT status, COUNT(*) as count
            FROM email_logs 
            GROUP BY status 
            ORDER BY count DESC
        """)
        status_stats = cursor.fetchall()
        
        for stat in status_stats:
            icon = "✅" if stat['status'] == 'sent' else "❌" if stat['status'] == 'failed' else "⏳"
            print(f"   {icon} {stat['status']}: {stat['count']} emails")
        
        # 5. Check recent activity
        print(f"\n5. 📅 RECENT ACTIVITY (Last 7 days):")
        print("-" * 40)
        cursor.execute("""
            SELECT DATE(sent_at) as date, COUNT(*) as count
            FROM email_logs 
            WHERE sent_at >= NOW() - INTERVAL '7 days'
            GROUP BY DATE(sent_at)
            ORDER BY date DESC
        """)
        recent_activity = cursor.fetchall()
        
        if recent_activity:
            for activity in recent_activity:
                print(f"   📧 {activity['date']}: {activity['count']} emails")
        else:
            print("   No email activity in the last 7 days")
        
        # 6. Check users with emails
        print(f"\n6. 👥 USERS WITH EMAIL LOGS:")
        print("-" * 40)
        cursor.execute("""
            SELECT u.name, u.email, COUNT(el.email_log_id) as email_count
            FROM users u
            LEFT JOIN email_logs el ON u.user_id = el.user_id
            WHERE u.email IS NOT NULL
            GROUP BY u.user_id, u.name, u.email
            ORDER BY email_count DESC
        """)
        user_stats = cursor.fetchall()
        
        for user in user_stats:
            print(f"   📧 {user['name']} ({user['email']}): {user['email_count']} emails logged")
        
        # 7. Usage analysis
        print(f"\n7. 🔍 EMAIL_LOGS USAGE ANALYSIS:")
        print("-" * 40)
        
        print("   📍 WHERE EMAIL_LOGS IS USED:")
        print("     • Python Email Service (email_service.py)")
        print("       - Logs every email sent via log_email_to_database()")
        print("       - Tracks: user_id, recipient, type, subject, content, status")
        print("       - Updates status and error messages")
        print()
        print("     • Next.js API Routes:")
        print("       - /api/email/test-send - Logs test emails")
        print("       - /api/email/send-direct - Logs direct emails")
        print("       - /api/email/send-working - Logs working emails")
        print("       - /api/email/send-real-debug - Logs debug emails")
        print()
        print("   🎯 PURPOSE:")
        print("     ✅ Audit trail - Track all emails sent")
        print("     ✅ Debugging - See what emails were sent and when")
        print("     ✅ Error tracking - Log failed emails with error messages")
        print("     ✅ User history - See email history per user")
        print("     ✅ Compliance - Keep records of all communications")
        print()
        print("   📊 DATA INTEGRITY:")
        if total > 0:
            print("     ✅ Table is being used actively")
            print("     ✅ Data is being logged properly")
        else:
            print("     ⚠️  No email logs found - emails may not be logging properly")
        
        cursor.close()
        conn.close()
        
        print(f"\n🎉 EMAIL_LOGS ANALYSIS COMPLETE!")
        
    except Exception as e:
        print(f"❌ Analysis failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    analyze_email_logs()
