#!/usr/bin/env python3
"""
Setup script for Python Email Service
Installs required packages and tests the email service
"""

import subprocess
import sys
import os

def install_requirements():
    """Install Python requirements"""
    try:
        print("📦 Installing Python requirements...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✅ Requirements installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install requirements: {e}")
        return False

def test_email_service():
    """Test the email service"""
    try:
        print("🔍 Testing email service...")
        from email_service import FitnessEmailService
        
        service = FitnessEmailService()
        result = service.test_connection()
        
        if result['success']:
            print("✅ Email service test passed")
            return True
        else:
            print(f"❌ Email service test failed: {result.get('error', 'Unknown error')}")
            return False
            
    except Exception as e:
        print(f"❌ Email service test failed: {e}")
        return False

def main():
    """Main setup function"""
    print("🐍 Setting up Python Email Service for Fitness Tracker")
    print("=" * 50)
    
    # Install requirements
    if not install_requirements():
        print("❌ Setup failed: Could not install requirements")
        sys.exit(1)
    
    # Test email service
    if not test_email_service():
        print("⚠️  Setup completed but email service test failed")
        print("   This might be due to network issues or SMTP configuration")
    else:
        print("✅ Setup completed successfully!")
    
    print("\n📧 Python Email Service is ready!")
    print("\nUsage:")
    print("  python email_service.py test")
    print("  python email_service.py send_daily_reminders")
    print("  python email_scheduler.py start")
    print("  python email_scheduler.py trigger")

if __name__ == "__main__":
    main()
