#!/usr/bin/env python3
"""
Python Email Service for Fitness Tracker
Handles sending daily reminders and achievement notifications
"""

import smtplib
import ssl
import json
import sys
import os
from datetime import datetime
import logging

# Import email modules (using EmailMessage instead of MIME)
from email.message import EmailMessage

# Try to import database modules with fallback
try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
    DB_MODULES_AVAILABLE = True
except ImportError as e:
    print(f"Warning: Database modules not available: {e}")
    DB_MODULES_AVAILABLE = False

# Configure logging with UTF-8 encoding
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('email_service.log', encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)

# Set console encoding for Windows
if sys.platform == "win32":
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.detach())
logger = logging.getLogger(__name__)

class FitnessEmailService:
    def __init__(self):
        """Initialize the email service with Gmail SMTP configuration"""
        self.smtp_server = "smtp.gmail.com"
        self.smtp_port = 587
        self.email = "harishdeepikassdeepikass@gmail.com"
        self.password = "vqsv erqr tstj mvdt"
        
        # Database connection
        self.db_url = os.getenv('DATABASE_URL', 
            "postgresql://neondb_owner:npg_PZae5A9gHpbY@ep-fragrant-violet-ad4xrlr3-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require")
        
        logger.info("Python Email Service initialized with database integration")
    
    def get_db_connection(self):
        """Get database connection"""
        if not DB_MODULES_AVAILABLE:
            logger.warning("Database modules not available, using mock data")
            return None
            
        try:
            conn = psycopg2.connect(self.db_url)
            return conn
        except Exception as e:
            logger.error(f"Database connection failed: {e}")
            return None
    
    def get_all_users_with_goals(self):
        """Fetch ALL users with email addresses and their fitness goals from database"""
        try:
            conn = self.get_db_connection()
            if not conn or not DB_MODULES_AVAILABLE:
                logger.error("❌ Database connection failed - cannot send emails without database access")
                return []
            
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            # Get ALL users with email addresses (check if email_preferences table exists)
            cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'email_preferences'
                )
            """)
            result = cursor.fetchone()
            email_prefs_exists = result['exists'] if result else False
            
            if email_prefs_exists:
                # If email_preferences table exists, respect user preferences
                # BUT: Include ALL users by default, only exclude if explicitly disabled
                cursor.execute("""
                    SELECT 
                        u.user_id,
                        u.name,
                        u.email,
                        u.calorie_goal,
                        u.protein_goal,
                        u.created_at,
                        COALESCE(ep.daily_reminders_enabled, true) as daily_reminders_enabled,
                        COALESCE(ep.achievement_notifications_enabled, true) as achievement_notifications_enabled,
                        COALESCE(ep.reminder_time, '09:00:00') as reminder_time
                    FROM users u
                    LEFT JOIN email_preferences ep ON u.user_id = ep.user_id
                    WHERE u.email IS NOT NULL 
                    AND u.email != ''
                    AND u.email != 'user@example.com'
                    AND (ep.daily_reminders_enabled IS NULL OR ep.daily_reminders_enabled = true)
                    ORDER BY u.created_at DESC
                """)
            else:
                # If no email_preferences table, get all users with valid emails
                cursor.execute("""
                    SELECT 
                        u.user_id,
                        u.name,
                        u.email,
                        u.calorie_goal,
                        u.protein_goal,
                        u.created_at,
                        true as daily_reminders_enabled,
                        true as achievement_notifications_enabled,
                        '09:00:00' as reminder_time
                    FROM users u
                    WHERE u.email IS NOT NULL 
                    AND u.email != ''
                    AND u.email != 'user@example.com'
                    ORDER BY u.created_at DESC
                """)
            
            users = cursor.fetchall()
            cursor.close()
            conn.close()
            
            # Convert to list of dicts for easier handling
            users_list = []
            for user in users:
                users_list.append({
                    'user_id': user['user_id'],
                    'name': user['name'],
                    'email': user['email'],
                    'calorie_goal': user['calorie_goal'],
                    'protein_goal': user['protein_goal'],
                    'created_at': str(user['created_at']),
                    'daily_reminders_enabled': user.get('daily_reminders_enabled', True),
                    'achievement_notifications_enabled': user.get('achievement_notifications_enabled', True),
                    'reminder_time': str(user.get('reminder_time', '09:00:00'))
                })
            
            logger.info(f"✅ Found {len(users_list)} users with email addresses from database")
            
            # Log user details for debugging
            for user in users_list:
                logger.info(f"   📧 User: {user['name']} ({user['email']}) - Goals: {user['calorie_goal']}cal, {user['protein_goal']}g protein")
            
            return users_list
            
        except Exception as e:
            logger.error(f"❌ Error fetching users from database: {e}")
            logger.error("Cannot send emails without database access - returning empty list")
            return []
    
    def log_email_to_database(self, user_id, recipient_email, email_type, subject, message_content, status, message_id=None, error_message=None):
        """Log email to database"""
        if not DB_MODULES_AVAILABLE:
            logger.info(f"Database not available - would log: {email_type} to {recipient_email} - {status}")
            return
            
        try:
            conn = self.get_db_connection()
            if not conn:
                return
                
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO email_logs (
                    user_id, recipient_email, sender_email, email_type, 
                    subject, message_content, status, message_id, error_message
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING email_log_id
            """, (
                user_id, recipient_email, self.email, email_type,
                subject, message_content, status, message_id, error_message
            ))
            
            email_log_id = cursor.fetchone()[0]
            conn.commit()
            cursor.close()
            conn.close()
            
            logger.info(f"Email logged to database with ID: {email_log_id}")
            return email_log_id
            
        except Exception as e:
            logger.error(f"Failed to log email to database: {e}")
            return None
    
    def update_email_statistics(self, email_type, status):
        """Update email statistics in database"""
        if not DB_MODULES_AVAILABLE:
            logger.info(f"Database not available - would update stats: {email_type} - {status}")
            return
            
        try:
            conn = self.get_db_connection()
            if not conn:
                return
                
            cursor = conn.cursor()
            
            # Get today's date
            today = datetime.now().date()
            
            # Update or insert statistics
            if status == 'sent':
                cursor.execute("""
                    INSERT INTO email_statistics (date, email_type, total_sent)
                    VALUES (%s, %s, 1)
                    ON CONFLICT (date, email_type)
                    DO UPDATE SET 
                        total_sent = email_statistics.total_sent + 1,
                        updated_at = NOW()
                """, (today, email_type))
            elif status == 'failed':
                cursor.execute("""
                    INSERT INTO email_statistics (date, email_type, total_failed)
                    VALUES (%s, %s, 1)
                    ON CONFLICT (date, email_type)
                    DO UPDATE SET 
                        total_failed = email_statistics.total_failed + 1,
                        updated_at = NOW()
                """, (today, email_type))
            
            conn.commit()
            cursor.close()
            conn.close()
            
            logger.info(f"Email statistics updated: {email_type} - {status}")
            
        except Exception as e:
            logger.error(f"Failed to update email statistics: {e}")
    
    def send_daily_reminder(self, user_email, user_name, calorie_goal, protein_goal, user_id=None):
        """Send daily fitness reminder email to a user"""
        try:
            logger.info(f"📧 Preparing daily reminder for: {user_email}")
            
            # Create message using EmailMessage (your working approach)
            msg = EmailMessage()
            msg["Subject"] = "🏃‍♂️ Daily Fitness Reminder - Don't Forget Your Goals!"
            msg["From"] = f"Fitness Tracker App <{self.email}>"
            msg["To"] = user_email
            
            # Create email content
            text_content = self.generate_daily_reminder_text(user_name, calorie_goal, protein_goal)
            msg.set_content(text_content)
            
            subject = msg["Subject"]
            message_id = None
            
            # Send email using your working method
            try:
                # Option A: STARTTLS (port 587)
                with smtplib.SMTP(self.smtp_server, self.smtp_port) as smtp:
                    smtp.ehlo()
                    smtp.starttls()
                    smtp.login(self.email, self.password)
                    smtp.send_message(msg)
                
                message_id = f"starttls-{int(datetime.now().timestamp())}-{user_email.split('@')[0]}"
                
                # Log successful email to database
                self.log_email_to_database(
                    user_id, user_email, 'daily_reminder', subject, 
                    text_content, 'sent', message_id
                )
                
                # Update statistics
                self.update_email_statistics('daily_reminder', 'sent')
                
                logger.info(f"Daily reminder sent successfully to {user_email} via STARTTLS")
                return {
                    'success': True,
                    'recipient': user_email,
                    'type': 'daily_reminder',
                    'message': f'Daily reminder sent to {user_name}',
                    'method': 'STARTTLS_587',
                    'message_id': message_id
                }
                
            except Exception as e1:
                logger.warning(f"STARTTLS failed for {user_email}: {e1}, trying SSL...")
                
                # Option B: SSL (port 465)
                try:
                    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp_ssl:
                        smtp_ssl.login(self.email, self.password)
                        smtp_ssl.send_message(msg)
                    
                    message_id = f"ssl-{int(datetime.now().timestamp())}-{user_email.split('@')[0]}"
                    
                    # Log successful email to database
                    self.log_email_to_database(
                        user_id, user_email, 'daily_reminder', subject, 
                        text_content, 'sent', message_id
                    )
                    
                    # Update statistics
                    self.update_email_statistics('daily_reminder', 'sent')
                    
                    logger.info(f"Daily reminder sent successfully to {user_email} via SSL")
                    return {
                        'success': True,
                        'recipient': user_email,
                        'type': 'daily_reminder',
                        'message': f'Daily reminder sent to {user_name}',
                        'method': 'SSL_465',
                        'message_id': message_id
                    }
                    
                except Exception as e2:
                    error_msg = f'STARTTLS: {e1}, SSL: {e2}'
                    
                    # Log failed email to database
                    self.log_email_to_database(
                        user_id, user_email, 'daily_reminder', subject, 
                        text_content, 'failed', None, error_msg
                    )
                    
                    # Update statistics
                    self.update_email_statistics('daily_reminder', 'failed')
                    
                    logger.error(f"Both STARTTLS and SSL failed for {user_email}: {e2}")
                    return {
                        'success': False,
                        'recipient': user_email,
                        'error': error_msg
                    }
            
        except Exception as e:
            logger.error(f"❌ Failed to send daily reminder to {user_email}: {e}")
            return {
                'success': False,
                'recipient': user_email,
                'error': str(e)
            }
    
    
    def send_achievement_notification(self, user_email, user_name, achievement_name, achievement_description, user_id=None):
        """Send achievement notification email to a user with database logging"""
        try:
            logger.info(f"Preparing achievement notification for: {user_email}")
            
            # Create message using EmailMessage
            msg = EmailMessage()
            msg["Subject"] = f"🏆 Achievement Unlocked: {achievement_name}!"
            msg["From"] = f"Fitness Tracker App <{self.email}>"
            msg["To"] = user_email
            
            # Create email content
            text_content = f"Congratulations {user_name}! You've earned the '{achievement_name}' achievement: {achievement_description}"
            msg.set_content(text_content)
            
            subject = msg["Subject"]
            message_id = None
            
            # Send email using working method
            try:
                # Option A: STARTTLS (port 587)
                with smtplib.SMTP(self.smtp_server, self.smtp_port) as smtp:
                    smtp.ehlo()
                    smtp.starttls()
                    smtp.login(self.email, self.password)
                    smtp.send_message(msg)
                
                message_id = f"achievement-{int(datetime.now().timestamp())}-{user_email.split('@')[0]}"
                
                # Log successful email to database
                self.log_email_to_database(
                    user_id, user_email, 'achievement_notification', subject, 
                    text_content, 'sent', message_id
                )
                
                # Update statistics
                self.update_email_statistics('achievement_notification', 'sent')
                
                logger.info(f"Achievement notification sent successfully to {user_email}")
                return {
                    'success': True,
                    'recipient': user_email,
                    'type': 'achievement_notification',
                    'achievement': achievement_name,
                    'message': f'Achievement notification sent to {user_name}',
                    'message_id': message_id
                }
                
            except Exception as e1:
                # Try SSL fallback
                try:
                    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp_ssl:
                        smtp_ssl.login(self.email, self.password)
                        smtp_ssl.send_message(msg)
                    
                    message_id = f"achievement-ssl-{int(datetime.now().timestamp())}-{user_email.split('@')[0]}"
                    
                    # Log successful email to database
                    self.log_email_to_database(
                        user_id, user_email, 'achievement_notification', subject, 
                        text_content, 'sent', message_id
                    )
                    
                    # Update statistics
                    self.update_email_statistics('achievement_notification', 'sent')
                    
                    logger.info(f"Achievement notification sent successfully to {user_email} via SSL")
                    return {
                        'success': True,
                        'recipient': user_email,
                        'type': 'achievement_notification',
                        'achievement': achievement_name,
                        'message': f'Achievement notification sent to {user_name}',
                        'message_id': message_id
                    }
                    
                except Exception as e2:
                    error_msg = f'STARTTLS: {e1}, SSL: {e2}'
                    
                    # Log failed email to database
                    self.log_email_to_database(
                        user_id, user_email, 'achievement_notification', subject, 
                        text_content, 'failed', None, error_msg
                    )
                    
                    # Update statistics
                    self.update_email_statistics('achievement_notification', 'failed')
                    
                    logger.error(f"Failed to send achievement notification to {user_email}: {e2}")
                    return {
                        'success': False,
                        'recipient': user_email,
                        'error': error_msg
                    }
            
        except Exception as e:
            logger.error(f"Failed to send achievement notification to {user_email}: {e}")
            return {
                'success': False,
                'recipient': user_email,
                'error': str(e)
            }
    
    def send_daily_reminders_to_all_users(self):
        """Send daily reminders to ALL users with email addresses from database"""
        logger.info("📧 Starting daily reminder process for ALL users from database...")
        
        users = self.get_all_users_with_goals()
        if not users:
            logger.error("❌ No users found in database with email addresses - cannot send reminders")
            return {
                'success': False,
                'message': 'No users found in database with email addresses',
                'sent_count': 0,
                'failed_count': 0,
                'total_users': 0,
                'results': [],
                'error': 'Database connection failed or no users with emails found'
            }
        
        logger.info(f"📧 Found {len(users)} users in database - proceeding to send reminders...")
        
        sent_count = 0
        failed_count = 0
        results = []
        
        for user in users:
            result = self.send_daily_reminder(
                user['email'],
                user['name'] or 'Fitness Enthusiast',
                user['calorie_goal'] or 2000,
                user['protein_goal'] or 150,
                user['user_id']
            )
            
            if result['success']:
                sent_count += 1
            else:
                failed_count += 1
            
            results.append({
                'user_id': user['user_id'],
                'email': user['email'],
                'success': result['success'],
                'error': result.get('error')
            })
        
        logger.info(f"📧 Daily reminder process completed: {sent_count} sent, {failed_count} failed")
        
        return {
            'success': True,
            'message': f'Daily reminders processed: {sent_count} sent, {failed_count} failed',
            'sent_count': sent_count,
            'failed_count': failed_count,
            'total_users': len(users),
            'results': results
        }
    
    
    def generate_daily_reminder_text(self, user_name, calorie_goal, protein_goal):
        """Generate plain text content for daily reminder email"""
        return f"""
Good Morning, {user_name}!

🎯 Your Daily Goals:
• Calorie Goal: {calorie_goal} calories
• Protein Goal: {protein_goal}g protein

📝 Quick Reminders:
• Log your meals throughout the day
• Stay hydrated - drink plenty of water  
• Get some physical activity in
• Check your progress in the app

Remember: Small consistent actions lead to big results! You've got this! 💪

This is your daily fitness reminder from Fitness Tracker App.
Keep pushing towards your goals! 🌟
        """
    
    
    def test_database_connection(self):
        """Test database connection and user fetching"""
        try:
            logger.info("🔍 Testing database connection and user fetching...")
            
            # Test database connection
            conn = self.get_db_connection()
            if not conn:
                return {
                    'success': False,
                    'error': 'Failed to connect to database',
                    'users_found': 0
                }
            
            # Test user fetching
            users = self.get_all_users_with_goals()
            conn.close()
            
            return {
                'success': True,
                'message': f'Database connection successful - found {len(users)} users with emails',
                'users_found': len(users),
                'users': users[:3] if users else []  # Show first 3 users for verification
            }
            
        except Exception as e:
            logger.error(f"❌ Database test failed: {e}")
            return {
                'success': False,
                'error': str(e),
                'users_found': 0
            }
    
    def test_connection(self):
        """Test SMTP connection using your working method"""
        try:
            # Test Option A: STARTTLS (port 587)
            try:
                with smtplib.SMTP(self.smtp_server, self.smtp_port) as smtp:
                    smtp.ehlo()
                    smtp.starttls()
                    smtp.login(self.email, self.password)
                
                logger.info("✅ SMTP connection test successful via STARTTLS")
                return {'success': True, 'message': 'SMTP connection successful via STARTTLS (port 587)', 'method': 'STARTTLS_587'}
                
            except Exception as e1:
                logger.warning(f"STARTTLS test failed: {e1}, trying SSL...")
                
                # Test Option B: SSL (port 465)
                try:
                    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp_ssl:
                        smtp_ssl.login(self.email, self.password)
                    
                    logger.info("✅ SMTP connection test successful via SSL")
                    return {'success': True, 'message': 'SMTP connection successful via SSL (port 465)', 'method': 'SSL_465'}
                    
                except Exception as e2:
                    logger.error(f"❌ Both STARTTLS and SSL connection tests failed: {e2}")
                    return {'success': False, 'error': f'STARTTLS: {e1}, SSL: {e2}'}
            
        except Exception as e:
            logger.error(f"❌ SMTP connection test failed: {e}")
            return {'success': False, 'error': str(e)}

def main():
    """Main function for command line usage"""
    if len(sys.argv) < 2:
        print("Usage: python email_service.py <command> [args]")
        print("Commands:")
        print("  test - Test SMTP connection")
        print("  test_db - Test database connection and user fetching")
        print("  send_daily_reminders - Send daily reminders to ALL users from database")
        print("  send_reminder <email> <name> <calorie_goal> <protein_goal> - Send reminder to specific user")
        print("  send_achievement <email> <name> <achievement_name> <achievement_description> - Send achievement notification")
        return

    command = sys.argv[1]
    service = FitnessEmailService()

    if command == "test":
        result = service.test_connection()
        print(json.dumps(result, indent=2))
        
    elif command == "test_db":
        result = service.test_database_connection()
        print(json.dumps(result, indent=2))

    elif command == "send_daily_reminders":
        result = service.send_daily_reminders_to_all_users()
        print(json.dumps(result, indent=2))

    elif command == "send_reminder" and len(sys.argv) >= 6:
        email = sys.argv[2]
        name = sys.argv[3]
        calorie_goal = float(sys.argv[4])
        protein_goal = float(sys.argv[5])
        
        result = service.send_daily_reminder(email, name, calorie_goal, protein_goal)
        print(json.dumps(result, indent=2))

    elif command == "send_achievement" and len(sys.argv) >= 6:
        email = sys.argv[2]
        name = sys.argv[3]
        achievement_name = sys.argv[4]
        achievement_description = sys.argv[5] if len(sys.argv) > 5 else "Great job on your fitness journey!"
        
        result = service.send_achievement_notification(email, name, achievement_name, achievement_description)
        print(json.dumps(result, indent=2))

    else:
        print("Invalid command or missing arguments")
        print("Usage: python email_service.py <command> [args]")
