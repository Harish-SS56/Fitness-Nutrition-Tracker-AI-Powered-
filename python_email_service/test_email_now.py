#!/usr/bin/env python3
"""
INSTANT EMAIL TEST - Send test email immediately
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from email_service import FitnessEmailService
import json

def test_instant_email():
    """Send a test email immediately"""
    print("🧪 INSTANT EMAIL TEST")
    print("=" * 50)
    
    # Initialize email service
    service = FitnessEmailService()
    
    print(f"📧 Email Configuration:")
    print(f"   📮 From: {service.email}")
    print(f"   🔑 Password: {service.password}")
    print(f"   🌐 SMTP: {service.smtp_server}:{service.smtp_port}")
    print("=" * 50)
    
    # Test 1: SMTP Connection
    print("\n🔍 Test 1: SMTP Connection")
    print("-" * 30)
    connection_result = service.test_connection()
    print(json.dumps(connection_result, indent=2))
    
    if not connection_result['success']:
        print("❌ SMTP connection failed! Cannot send emails.")
        return
    
    # Test 2: Database Connection
    print("\n🔍 Test 2: Database Connection")
    print("-" * 30)
    db_result = service.test_database_connection()
    print(json.dumps(db_result, indent=2))
    
    # Test 3: Send Test Email to Harini
    print("\n🔍 Test 3: Send Test Email to Harini")
    print("-" * 30)
    harini_result = service.send_daily_reminder(
        user_email='hk6113367@gmail.com',
        user_name='Harini',
        calorie_goal=1358,
        protein_goal=180,
        user_id=6
    )
    print(json.dumps(harini_result, indent=2))
    
    # Test 4: Send Test Email to Harish
    print("\n🔍 Test 4: Send Test Email to Harish")
    print("-" * 30)
    harish_result = service.send_daily_reminder(
        user_email='harishdeepikassdeepikass@gmail.com',
        user_name='Harish',
        calorie_goal=2356,
        protein_goal=180,
        user_id=5
    )
    print(json.dumps(harish_result, indent=2))
    
    # Test 5: Send Achievement Email
    print("\n🔍 Test 5: Send Achievement Email")
    print("-" * 30)
    achievement_result = service.send_achievement_notification(
        user_email='hk6113367@gmail.com',
        user_name='Harini',
        achievement_name='Daily Calorie Goal',
        achievement_description='You successfully met your daily calorie goal!',
        user_id=6
    )
    print(json.dumps(achievement_result, indent=2))
    
    # Summary
    print("\n📋 TEST SUMMARY")
    print("=" * 50)
    
    tests = [
        ("SMTP Connection", connection_result['success']),
        ("Database Connection", db_result['success']),
        ("Email to Harini", harini_result['success']),
        ("Email to Harish", harish_result['success']),
        ("Achievement Email", achievement_result['success'])
    ]
    
    passed = sum(1 for _, success in tests if success)
    total = len(tests)
    
    for test_name, success in tests:
        status = "✅" if success else "❌"
        print(f"{status} {test_name}")
    
    print(f"\n📊 Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 ALL TESTS PASSED! Email system is working perfectly!")
    else:
        print("⚠️  Some tests failed. Check your email configuration.")

if __name__ == "__main__":
    test_instant_email()
