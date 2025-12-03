#!/usr/bin/env python3
"""
Python Email Scheduler for Fitness Tracker
Handles scheduling of daily email reminders
"""

import schedule
import time
import json
import sys
import os
import threading
from datetime import datetime, timedelta
import logging
from email_service import FitnessEmailService

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('email_scheduler.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

class EmailScheduler:
    def __init__(self):
        """Initialize the email scheduler"""
        self.email_service = FitnessEmailService()
        self.is_running = False
        self.scheduler_thread = None
        logger.info("🐍 Python Email Scheduler initialized")
    
    def send_daily_reminders_job(self):
        """Job function for sending daily reminders"""
        logger.info("📧 Running scheduled daily reminder job at 9:00 AM IST...")
        result = self.email_service.send_daily_reminders_to_all_users()
        logger.info(f"📧 Daily reminder job completed: {result['sent_count']} sent, {result['failed_count']} failed")
        return result
    
    def start_daily_scheduler(self):
        """Start the daily email scheduler (9:00 AM IST)"""
        if self.is_running:
            logger.info("📧 Email scheduler is already running")
            return {'success': False, 'message': 'Scheduler already running'}
        
        # Schedule daily reminders at 9:00 AM
        schedule.clear()
        schedule.every().day.at("09:00").do(self.send_daily_reminders_job)
        
        self.is_running = True
        
        # Start scheduler in a separate thread
        self.scheduler_thread = threading.Thread(target=self._run_scheduler, daemon=True)
        self.scheduler_thread.start()
        
        logger.info("📧 Daily email scheduler started - will send reminders at 9:00 AM IST every day")
        return {
            'success': True, 
            'message': 'Daily email scheduler started - will send reminders at 9:00 AM IST',
            'next_run': self._get_next_run_time()
        }
    
    def stop_scheduler(self):
        """Stop the email scheduler"""
        if not self.is_running:
            logger.info("📧 Email scheduler is not running")
            return {'success': False, 'message': 'Scheduler not running'}
        
        schedule.clear()
        self.is_running = False
        
        logger.info("📧 Email scheduler stopped")
        return {'success': True, 'message': 'Email scheduler stopped'}
    
    def _run_scheduler(self):
        """Internal method to run the scheduler loop"""
        while self.is_running:
            schedule.run_pending()
            time.sleep(60)  # Check every minute
    
    def schedule_test_email(self, delay_minutes=1):
        """Schedule a test email after specified delay"""
        logger.info(f"📧 Scheduling test email in {delay_minutes} minute(s)...")
        
        def test_job():
            logger.info("📧 Running test email job...")
            return self.email_service.send_daily_reminders_to_all_users()
        
        # Schedule test email
        run_time = datetime.now() + timedelta(minutes=delay_minutes)
        schedule.every().day.at(run_time.strftime("%H:%M")).do(test_job).tag('test')
        
        return {
            'success': True,
            'message': f'Test email scheduled in {delay_minutes} minute(s)',
            'scheduled_time': run_time.strftime("%Y-%m-%d %H:%M:%S")
        }
    
    def schedule_specific_time(self, hour, minute):
        """Schedule email for specific time today"""
        logger.info(f"📧 Scheduling test email for {hour:02d}:{minute:02d} IST today...")
        
        def specific_time_job():
            logger.info(f"📧 Running scheduled test email at {hour:02d}:{minute:02d}...")
            return self.email_service.send_daily_reminders_to_all_users()
        
        # Schedule for specific time
        time_str = f"{hour:02d}:{minute:02d}"
        schedule.every().day.at(time_str).do(specific_time_job).tag('specific_test')
        
        target_time = datetime.now().replace(hour=hour, minute=minute, second=0, microsecond=0)
        if target_time <= datetime.now():
            target_time += timedelta(days=1)
        
        return {
            'success': True,
            'message': f'Test email scheduled for {hour:02d}:{minute:02d} today',
            'scheduled_time': target_time.strftime("%Y-%m-%d %H:%M:%S")
        }
    
    def trigger_manual_reminder(self):
        """Manually trigger daily reminders"""
        logger.info("📧 Manually triggering daily reminders...")
        result = self.email_service.send_daily_reminders_to_all_users()
        return {
            'success': True,
            'message': 'Manual reminder triggered',
            'trigger_result': result
        }
    
    def get_scheduler_status(self):
        """Get current scheduler status"""
        next_run = self._get_next_run_time()
        
        return {
            'is_running': self.is_running,
            'next_run': next_run,
            'timezone': 'Asia/Kolkata',
            'schedule': '9:00 AM daily',
            'scheduled_jobs': len(schedule.jobs)
        }
    
    def _get_next_run_time(self):
        """Get next scheduled run time"""
        if not schedule.jobs:
            return None
        
        next_run = schedule.next_run()
        if next_run:
            return next_run.strftime("%Y-%m-%d %H:%M:%S")
        return None

def main():
    """Main function for command line usage"""
    if len(sys.argv) < 2:
        print("Usage: python email_scheduler.py <command> [args]")
        print("Commands:")
        print("  start - Start daily 9 AM scheduler")
        print("  stop - Stop scheduler")
        print("  status - Get scheduler status")
        print("  trigger - Manually trigger daily reminders")
        print("  test <minutes> - Schedule test email in X minutes")
        print("  schedule <hour> <minute> - Schedule email for specific time")
        return
    
    scheduler = EmailScheduler()
    command = sys.argv[1]
    
    if command == "start":
        result = scheduler.start_daily_scheduler()
        print(json.dumps(result, indent=2))
        
        # Keep the scheduler running
        if result['success']:
            try:
                while scheduler.is_running:
                    time.sleep(1)
            except KeyboardInterrupt:
                scheduler.stop_scheduler()
                print("\nScheduler stopped by user")
    
    elif command == "stop":
        result = scheduler.stop_scheduler()
        print(json.dumps(result, indent=2))
    
    elif command == "status":
        result = scheduler.get_scheduler_status()
        print(json.dumps(result, indent=2))
    
    elif command == "trigger":
        result = scheduler.trigger_manual_reminder()
        print(json.dumps(result, indent=2))
    
    elif command == "test" and len(sys.argv) >= 3:
        delay_minutes = int(sys.argv[2])
        result = scheduler.schedule_test_email(delay_minutes)
        print(json.dumps(result, indent=2))
    
    elif command == "schedule" and len(sys.argv) >= 4:
        hour = int(sys.argv[2])
        minute = int(sys.argv[3])
        result = scheduler.schedule_specific_time(hour, minute)
        print(json.dumps(result, indent=2))
    
    else:
        print("Invalid command or missing arguments")

if __name__ == "__main__":
    main()
