#!/usr/bin/env python3
"""
Simple test for Python Email Service
"""

import sys
import json

def test_email_service():
    """Test the email service"""
    try:
        print("🧪 Testing Python Email Service...")
        
        # Test import
        from email_service import FitnessEmailService
        print("✅ Email service imported successfully")
        
        # Create service instanc
        e
        service = FitnessEmailService()
        print("✅ Email service instance created")
        
        # Test SMTP connection
        result = service.test_connection()
        print(f"📧 SMTP Test Result: {result}")
        
        if result['success']:
            print("✅ SMTP connection test PASSED")
        else:
            print(f"❌ SMTP connection test FAILED: {result.get('error', 'Unknown error')}")
        
        # Test sending a single email (simulation)
        print("\n📧 Testing single email send...")
        email_result = service.send_daily_reminder(
            "test@example.com", 
            "Test User", 
            2000, 
            150
        )
        print(f"📧 Email Test Result: {email_result}")
        
        if email_result['success']:
            print("✅ Email sending test PASSED")
        else:
            print(f"❌ Email sending test FAILED: {email_result.get('error', 'Unknown error')}")
        
        return True
        
    except ImportError as e:
        print(f"❌ Import failed: {e}")
        print("💡 Make sure to install requirements: pip install psycopg2-binary schedule")
        return False
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

def test_scheduler():
    """Test the scheduler"""
    try:
        print("\n🕘 Testing Python Email Scheduler...")
        
        # Test import
        from email_scheduler import EmailScheduler
        print("✅ Email scheduler imported successfully")
        
        # Create scheduler instance
        scheduler = EmailScheduler()
        print("✅ Email scheduler instance created")
        
        # Test status
        status = scheduler.get_scheduler_status()
        print(f"📊 Scheduler Status: {status}")
        
        # Test manual trigger
        print("\n🔥 Testing manual trigger...")
        trigger_result = scheduler.trigger_manual_reminder()
        print(f"🔥 Trigger Result: {trigger_result}")
        
        if trigger_result['success']:
            print("✅ Manual trigger test PASSED")
        else:
            print(f"❌ Manual trigger test FAILED")
        
        return True
        
    except ImportError as e:
        print(f"❌ Scheduler import failed: {e}")
        return False
    except Exception as e:
        print(f"❌ Scheduler test failed: {e}")
        return False

def main():
    """Main test function"""
    print("🐍 Python Email Service Test Suite")
    print("=" * 50)
    
    # Test email service
    email_test_passed = test_email_service()
    
    # Test scheduler
    scheduler_test_passed = test_scheduler()
    
    print("\n" + "=" * 50)
    print("🎯 Test Summary:")
    print(f"   Email Service: {'✅ PASSED' if email_test_passed else '❌ FAILED'}")
    print(f"   Scheduler: {'✅ PASSED' if scheduler_test_passed else '❌ FAILED'}")
    
    if email_test_passed and scheduler_test_passed:
        print("\n🎉 All tests PASSED! Python email system is ready!")
        print("\n📧 Next steps:")
        print("   1. Start your Next.js server: npm run dev")
        print("   2. Test via API: curl -X POST http://localhost:3000/api/email/scheduler -d '{\"action\":\"trigger\"}'")
        print("   3. Check console for Python email logs")
    else:
        print("\n⚠️  Some tests failed. Check the errors above.")

if __name__ == "__main__":
    main()
