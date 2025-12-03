#!/usr/bin/env python3
"""
Simple test for email service
"""

import smtplib
import ssl

def test_smtp_connection():
    """Test basic SMTP connection"""
    print("🧪 Testing SMTP Connection...")
    print("📧 Email: harishdeepikassdeepikass@gmail.com")
    print("🔐 Password:vqsv erqr tstj mvdt")
    print("=" * 50)
    
    try:
        # Gmail SMTP configuration
        smtp_server = "smtp.gmail.com"
        smtp_port = 587
        email = "harishdeepikassdeepikass@gmail.com"
        password = "vqsv erqr tstj mvdt"
        
        # Test connection
        print("🔍 Testing SMTP connection...")
        context = ssl.create_default_context()
        
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            print("✅ SMTP server connected")
            
            server.starttls(context=context)
            print("✅ TLS started")
            
            server.login(email, password)
            print("✅ Login successful")
        
        print("🎉 SMTP connection test PASSED!")
        return True
        
    except Exception as e:
        print(f"❌ SMTP connection test FAILED: {e}")
        return False

def test_send_email():
    """Test sending a real email"""
    print("\n📧 Testing real email send...")
    
    try:
        # Email configuration
        smtp_server = "smtp.gmail.com"
        smtp_port = 587
        sender_email = "harishdeepikassdeepikass@gmail.com"
        password = "vqsv erqr tstj mvdt"
        recipient_email = "hk6113367@gmail.com"
        
        # Create simple email
        subject = "Test Email from Python Fitness Tracker"
        body = """
Hello!

This is a test email from your Python Fitness Tracker email system.

🎯 Your Daily Goals:
• Calorie Goal: 2000 calories
• Protein Goal: 150g protein

📝 Quick Reminders:
• Log your meals throughout the day
• Stay hydrated - drink plenty of water  
• Get some physical activity in
• Check your progress in the app

Remember: Small consistent actions lead to big results! You've got this! 💪

This is a test email from Fitness Tracker App.
Keep pushing towards your goals! 🌟
        """
        
        message = f"Subject: {subject}\nFrom: {sender_email}\nTo: {recipient_email}\n\n{body}"
        
        # Send email
        context = ssl.create_default_context()
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls(context=context)
            server.login(sender_email, password)
            server.sendmail(sender_email, recipient_email, message)
        
        print(f"✅ Test email sent successfully to {recipient_email}")
        print("📬 Check your inbox for the test email!")
        return True
        
    except Exception as e:
        print(f"❌ Failed to send test email: {e}")
        return False

if __name__ == "__main__":
    print("🐍 Simple Python Email Test")
    print("=" * 50)
    
    # Test SMTP connection
    smtp_success = test_smtp_connection()
    
    if smtp_success:
        # Test sending email
        email_success = test_send_email()
        
        if email_success:
            print("\n🎉 All tests PASSED! Your email system is working!")
        else:
            print("\n⚠️ SMTP works but email sending failed.")
    else:
        print("\n❌ SMTP connection failed. Check credentials.")
