#!/usr/bin/env python3
"""
Setup database tables for email tracking
"""

import sys
import os

try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
    DB_AVAILABLE = True
except ImportError:
    print("Warning: psycopg2 not available. Install with: pip install psycopg2-binary")
    DB_AVAILABLE = False

def setup_email_tables():
    """Create email tracking tables if they don't exist"""
    if not DB_AVAILABLE:
        print("❌ Database modules not available")
        return False
    
    try:
        db_url = os.getenv('DATABASE_URL', 
            "postgresql://neondb_owner:npg_PZae5A9gHpbY@ep-fragrant-violet-ad4xrlr3-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require")
        
        print("🔗 Connecting to database...")
        conn = psycopg2.connect(db_url)
        cursor = conn.cursor()
        
        # Create email_logs table
        print("📧 Creating email_logs table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS email_logs (
                email_log_id SERIAL PRIMARY KEY,
                user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
                recipient_email TEXT NOT NULL,
                sender_email TEXT DEFAULT 'harishdeepikassdeepikass@gmail.com',
                email_type TEXT NOT NULL CHECK (email_type IN ('daily_reminder', 'achievement_notification', 'welcome', 'password_reset', 'custom')),
                subject TEXT NOT NULL,
                message_content TEXT NOT NULL,
                html_content TEXT,
                status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'pending', 'bounced')) DEFAULT 'pending',
                message_id TEXT,
                error_message TEXT,
                sent_at TIMESTAMP DEFAULT NOW(),
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        """)
        
        # Create email_statistics table
        print("📊 Creating email_statistics table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS email_statistics (
                stat_id SERIAL PRIMARY KEY,
                date DATE DEFAULT CURRENT_DATE,
                email_type TEXT NOT NULL,
                total_sent INT DEFAULT 0,
                total_delivered INT DEFAULT 0,
                total_failed INT DEFAULT 0,
                total_bounced INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(date, email_type)
            )
        """)
        
        # Create indexes
        print("🔍 Creating indexes...")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON email_logs(user_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_email_logs_type_status ON email_logs(email_type, status)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_email_statistics_date_type ON email_statistics(date, email_type)")
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print("✅ Email tracking tables created successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Failed to setup database tables: {e}")
        return False

def test_email_service():
    """Test the email service"""
    try:
        from email_service import FitnessEmailService
        
        print("\n🧪 Testing email service...")
        service = FitnessEmailService()
        
        # Test connection
        result = service.test_connection()
        if result['success']:
            print(f"✅ SMTP connection successful via {result.get('method', 'unknown')}")
        else:
            print(f"❌ SMTP connection failed: {result.get('error', 'Unknown error')}")
            return False
        
        print("✅ Email service is ready!")
        return True
        
    except Exception as e:
        print(f"❌ Email service test failed: {e}")
        return False

def main():
    """Main setup function"""
    print("🐍 Setting up Python Email Service for Fitness Tracker")
    print("=" * 60)
    
    # Setup database tables
    db_success = setup_email_tables()
    
    # Test email service
    email_success = test_email_service()
    
    print("\n" + "=" * 60)
    print("📊 Setup Summary:")
    print(f"   Database Tables: {'✅ Ready' if db_success else '❌ Failed'}")
    print(f"   Email Service: {'✅ Ready' if email_success else '❌ Failed'}")
    
    if db_success and email_success:
        print("\n🎉 Email system is fully configured and ready!")
        print("\n📧 Usage:")
        print("   python email_service.py test")
        print("   python email_service.py send_daily_reminders")
        print("   python email_scheduler.py trigger")
    else:
        print("\n⚠️  Some components need attention. Check the errors above.")

if __name__ == "__main__":
    main()
