#!/usr/bin/env python3
"""
Test the email service with new credentials
"""

import sys
from email_service import FitnessEmailService

def test_email_credentials():
    """Test the email service with new Gmail credentials"""
    print("🧪 Testing Python Email Service with new credentials...")
    print("📧 Email: harishdeepikassdeepikass@gmail.com")
    print("🔐 Password: vqsv erqr tstj mvdt")
    print("=" * 50)
    
    try:
        # Create service instance
        service = FitnessEmailService()
        print("✅ Email service instance created")
        
        # Test SMTP connection
        print("\n🔍 Testing SMTP connection...")
        result = service.test_connection()
        print(f"📧 SMTP Test Result: {result}")
        
        if result['success']:
            print("✅ SMTP connection test PASSED")
        else:
            print(f"❌ SMTP connection test FAILED: {result.get('error', 'Unknown error')}")
            return False
        
        # Test sending a real email to one of your addresses
        print("\n📧 Testing real email send...")
        email_result = service.send_daily_reminder(
            "hk6113367@gmail.com",  # Your email address
            "Test User", 
            2000, 
            150
        )
        print(f"📧 Email Test Result: {email_result}")
        
        if email_result['success']:
            print("✅ Real email sending test PASSED")
            print("📬 Check your inbox at hk6113367@gmail.com for the test email!")
        else:
            print(f"❌ Email sending test FAILED: {email_result.get('error', 'Unknown error')}")
        
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

if __name__ == "__main__":
    success = test_email_credentials()
    if success:
        print("\n🎉 Email service is ready to send real emails!")
    else:
        print("\n⚠️ Email service needs attention.")
