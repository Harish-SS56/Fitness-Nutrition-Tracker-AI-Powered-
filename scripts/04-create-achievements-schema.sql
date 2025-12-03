-- Achievements System Database Schema
-- Create tables for achievements and user achievements tracking

-- Achievements table for defining available achievements
CREATE TABLE IF NOT EXISTS achievements (
  achievement_id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  badge_icon TEXT NOT NULL, -- Icon name for the badge
  badge_color TEXT DEFAULT '#3B82F6', -- Hex color for the badge
  category TEXT NOT NULL CHECK (category IN ('nutrition', 'fitness', 'consistency', 'milestone')),
  achievement_type TEXT NOT NULL CHECK (achievement_type IN ('daily', 'weekly', 'monthly', 'total', 'streak')),
  target_value DOUBLE PRECISION, -- Target value to achieve (calories, protein, days, etc.)
  target_unit TEXT, -- Unit of measurement (calories, grams, days, etc.)
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User achievements table for tracking user progress and earned achievements
CREATE TABLE IF NOT EXISTS user_achievements (
  user_achievement_id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
  achievement_id INT REFERENCES achievements(achievement_id) ON DELETE CASCADE,
  is_earned BOOLEAN DEFAULT FALSE,
  current_progress DOUBLE PRECISION DEFAULT 0,
  earned_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Achievement progress log for detailed tracking
CREATE TABLE IF NOT EXISTS achievement_progress_log (
  log_id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
  achievement_id INT REFERENCES achievements(achievement_id) ON DELETE CASCADE,
  progress_value DOUBLE PRECISION NOT NULL,
  progress_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert predefined achievements
INSERT INTO achievements (name, description, badge_icon, badge_color, category, achievement_type, target_value, target_unit) VALUES
-- Daily Nutrition Achievements
('Daily Calorie Goal', 'Meet your daily calorie goal', 'Target', '#10B981', 'nutrition', 'daily', 1, 'goal_percentage'),
('Daily Protein Goal', 'Meet your daily protein goal', 'Zap', '#8B5CF6', 'nutrition', 'daily', 1, 'goal_percentage'),
('Balanced Day', 'Meet both calorie and protein goals in one day', 'Award', '#F59E0B', 'nutrition', 'daily', 1, 'complete_goals'),

-- Weekly Achievements
('Weekly Warrior', 'Meet your goals 5 days in a week', 'Calendar', '#EF4444', 'consistency', 'weekly', 5, 'days'),
('Perfect Week', 'Meet your goals every day for a week', 'Crown', '#DC2626', 'consistency', 'weekly', 7, 'days'),

-- Monthly Achievements
('Monthly Champion', 'Meet your goals 20 days in a month', 'Trophy', '#F97316', 'consistency', 'monthly', 20, 'days'),
('Consistency King', 'Meet your goals 25 days in a month', 'Medal', '#0EA5E9', 'consistency', 'monthly', 25, 'days'),

-- Streak Achievements
('3-Day Streak', 'Meet your goals for 3 consecutive days', 'Flame', '#F59E0B', 'consistency', 'streak', 3, 'days'),
('7-Day Streak', 'Meet your goals for 7 consecutive days', 'Fire', '#EF4444', 'consistency', 'streak', 7, 'days'),
('30-Day Streak', 'Meet your goals for 30 consecutive days', 'Sparkles', '#8B5CF6', 'consistency', 'streak', 30, 'days'),

-- Milestone Achievements
('First Goal', 'Meet your daily goal for the first time', 'Star', '#10B981', 'milestone', 'total', 1, 'days'),
('Century Club', 'Meet your goals 100 times total', 'Gem', '#6366F1', 'milestone', 'total', 100, 'days'),
('Protein Master', 'Consume 1000g of protein total', 'Dumbbell', '#059669', 'nutrition', 'total', 1000, 'grams'),
('Calorie Counter', 'Log 50,000 calories total', 'Calculator', '#DC2626', 'nutrition', 'total', 50000, 'calories')

ON CONFLICT (name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_earned ON user_achievements(user_id, is_earned);
CREATE INDEX IF NOT EXISTS idx_achievement_progress_user_date ON achievement_progress_log(user_id, progress_date);
CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category, is_active);
