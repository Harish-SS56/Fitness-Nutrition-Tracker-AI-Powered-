-- Email Tracking System Database Schema
-- Track all email communications sent to users

-- Email logs table for tracking all sent emails
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
  message_id TEXT, -- SMTP message ID for tracking
  error_message TEXT, -- Store error if sending failed
  sent_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Email templates table for storing reusable email templates
CREATE TABLE IF NOT EXISTS email_templates (
  template_id SERIAL PRIMARY KEY,
  template_name TEXT NOT NULL UNIQUE,
  template_type TEXT NOT NULL CHECK (template_type IN ('daily_reminder', 'achievement_notification', 'welcome', 'password_reset', 'custom')),
  subject_template TEXT NOT NULL,
  html_template TEXT NOT NULL,
  text_template TEXT NOT NULL,
  variables JSON, -- Store template variables like {userName}, {goalCalories}, etc.
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Email preferences table for user email settings
CREATE TABLE IF NOT EXISTS email_preferences (
  preference_id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(user_id) ON DELETE CASCADE UNIQUE,
  daily_reminders_enabled BOOLEAN DEFAULT TRUE,
  achievement_notifications_enabled BOOLEAN DEFAULT TRUE,
  marketing_emails_enabled BOOLEAN DEFAULT FALSE,
  reminder_time TIME DEFAULT '09:00:00', -- Default 9 AM
  timezone TEXT DEFAULT 'UTC',
  last_reminder_sent DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Email statistics table for tracking email performance
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
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_type_status ON email_logs(email_type, status);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_preferences_user_id ON email_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_email_preferences_reminders ON email_preferences(daily_reminders_enabled, reminder_time);
CREATE INDEX IF NOT EXISTS idx_email_statistics_date_type ON email_statistics(date, email_type);

-- Insert default email templates
INSERT INTO email_templates (template_name, template_type, subject_template, html_template, text_template, variables) VALUES
(
  'daily_fitness_reminder',
  'daily_reminder',
  '🏃‍♂️ Daily Fitness Reminder - Don''t Forget Your Goals!',
  '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Daily Fitness Reminder</title></head><body><h1>Good Morning, {{userName}}!</h1><p>Time to crush your fitness goals today!</p><div><h3>🎯 Your Daily Goals</h3><p>Calorie Goal: {{calorieGoal}} calories</p><p>Protein Goal: {{proteinGoal}}g protein</p></div><p>Don''t forget to log your meals and stay active!</p></body></html>',
  'Good Morning, {{userName}}! Time to crush your fitness goals today! Calorie Goal: {{calorieGoal}} calories. Protein Goal: {{proteinGoal}}g protein. Don''t forget to log your meals and stay active!',
  '{"userName": "User name", "calorieGoal": "Daily calorie goal", "proteinGoal": "Daily protein goal"}'::json
),
(
  'achievement_unlocked',
  'achievement_notification',
  '🏆 Achievement Unlocked: {{achievementName}}!',
  '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Achievement Unlocked</title></head><body><h1>🎉 Achievement Unlocked! 🎉</h1><h2>Congratulations, {{userName}}!</h2><div><h3>{{achievementName}}</h3><p>{{achievementDescription}}</p></div><p>You''re doing amazing! Keep up the great work!</p></body></html>',
  'Congratulations {{userName}}! You''ve earned the "{{achievementName}}" achievement: {{achievementDescription}}. Keep up the great work!',
  '{"userName": "User name", "achievementName": "Achievement name", "achievementDescription": "Achievement description"}'::json
),
(
  'welcome_email',
  'welcome',
  '🎉 Welcome to Fitness Tracker - Let''s Start Your Journey!',
  '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Welcome to Fitness Tracker</title></head><body><h1>Welcome to Fitness Tracker, {{userName}}!</h1><p>We''re excited to help you on your fitness journey!</p><div><h3>Your Goals:</h3><p>Calorie Goal: {{calorieGoal}} calories/day</p><p>Protein Goal: {{proteinGoal}}g/day</p></div><p>Start logging your meals and tracking your progress today!</p></body></html>',
  'Welcome to Fitness Tracker, {{userName}}! We''re excited to help you on your fitness journey! Your goals: {{calorieGoal}} calories/day, {{proteinGoal}}g protein/day. Start logging your meals today!',
  '{"userName": "User name", "calorieGoal": "Daily calorie goal", "proteinGoal": "Daily protein goal"}'::json
)
ON CONFLICT (template_name) DO NOTHING;

-- Insert default email preferences for existing users
INSERT INTO email_preferences (user_id, daily_reminders_enabled, achievement_notifications_enabled, reminder_time)
SELECT 
  user_id, 
  TRUE, 
  TRUE, 
  '09:00:00'
FROM users 
WHERE user_id NOT IN (SELECT user_id FROM email_preferences WHERE user_id IS NOT NULL)
ON CONFLICT (user_id) DO NOTHING;
