// Run achievements schema migration
import { neon } from "@neondatabase/serverless"
import fs from "fs"
import path from "path"

const DATABASE_URL = process.env.DATABASE_URL || 
  "postgresql://neondb_owner:npg_PZae5A9gHpbY@ep-fragrant-violet-ad4xrlr3-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"

const sql = neon(DATABASE_URL)

async function runAchievementsSchema() {
  try {
    console.log("🏆 Running Achievements Schema Migration...")
    
    // Create achievements table
    console.log("📝 Creating achievements table...")
    await sql`
      CREATE TABLE IF NOT EXISTS achievements (
        achievement_id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT NOT NULL,
        badge_icon TEXT NOT NULL,
        badge_color TEXT DEFAULT '#3B82F6',
        category TEXT NOT NULL CHECK (category IN ('nutrition', 'fitness', 'consistency', 'milestone')),
        achievement_type TEXT NOT NULL CHECK (achievement_type IN ('daily', 'weekly', 'monthly', 'total', 'streak')),
        target_value DOUBLE PRECISION,
        target_unit TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `
    
    // Create user_achievements table
    console.log("📝 Creating user_achievements table...")
    await sql`
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
      )
    `
    
    // Create achievement_progress_log table
    console.log("📝 Creating achievement_progress_log table...")
    await sql`
      CREATE TABLE IF NOT EXISTS achievement_progress_log (
        log_id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
        achievement_id INT REFERENCES achievements(achievement_id) ON DELETE CASCADE,
        progress_value DOUBLE PRECISION NOT NULL,
        progress_date DATE DEFAULT CURRENT_DATE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `
    
    // Insert predefined achievements
    console.log("📝 Inserting predefined achievements...")
    await sql`
      INSERT INTO achievements (name, description, badge_icon, badge_color, category, achievement_type, target_value, target_unit) VALUES
      ('Daily Calorie Goal', 'Meet your daily calorie goal', 'Target', '#10B981', 'nutrition', 'daily', 1, 'goal_percentage'),
      ('Daily Protein Goal', 'Meet your daily protein goal', 'Zap', '#8B5CF6', 'nutrition', 'daily', 1, 'goal_percentage'),
      ('Balanced Day', 'Meet both calorie and protein goals in one day', 'Award', '#F59E0B', 'nutrition', 'daily', 1, 'complete_goals'),
      ('Weekly Warrior', 'Meet your goals 5 days in a week', 'Calendar', '#EF4444', 'consistency', 'weekly', 5, 'days'),
      ('Perfect Week', 'Meet your goals every day for a week', 'Crown', '#DC2626', 'consistency', 'weekly', 7, 'days'),
      ('Monthly Champion', 'Meet your goals 20 days in a month', 'Trophy', '#F97316', 'consistency', 'monthly', 20, 'days'),
      ('Consistency King', 'Meet your goals 25 days in a month', 'Medal', '#0EA5E9', 'consistency', 'monthly', 25, 'days'),
      ('3-Day Streak', 'Meet your goals for 3 consecutive days', 'Flame', '#F59E0B', 'consistency', 'streak', 3, 'days'),
      ('7-Day Streak', 'Meet your goals for 7 consecutive days', 'Sparkles', '#EF4444', 'consistency', 'streak', 7, 'days'),
      ('30-Day Streak', 'Meet your goals for 30 consecutive days', 'Sparkles', '#8B5CF6', 'consistency', 'streak', 30, 'days'),
      ('First Goal', 'Meet your daily goal for the first time', 'Star', '#10B981', 'milestone', 'total', 1, 'days'),
      ('Century Club', 'Meet your goals 100 times total', 'Gem', '#6366F1', 'milestone', 'total', 100, 'days'),
      ('Protein Master', 'Consume 1000g of protein total', 'Dumbbell', '#059669', 'nutrition', 'total', 1000, 'grams'),
      ('Calorie Counter', 'Log 50,000 calories total', 'Calculator', '#DC2626', 'nutrition', 'total', 50000, 'calories')
      ON CONFLICT (name) DO NOTHING
    `
    
    // Create indexes
    console.log("📝 Creating indexes...")
    await sql`CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_user_achievements_earned ON user_achievements(user_id, is_earned)`
    await sql`CREATE INDEX IF NOT EXISTS idx_achievement_progress_user_date ON achievement_progress_log(user_id, progress_date)`
    await sql`CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category, is_active)`
    
    console.log("✅ Achievements schema migration completed successfully!")
    console.log("🎯 Available achievements:")
    
    // Verify by listing achievements
    const achievements = await sql`SELECT name, category, description FROM achievements ORDER BY category, name`
    
    achievements.forEach(ach => {
      console.log(`  🏅 ${ach.name} (${ach.category}): ${ach.description}`)
    })
    
    console.log(`\n🎉 Total: ${achievements.length} achievements ready!`)
    
  } catch (error) {
    console.error("❌ Error running achievements schema:", error)
    process.exit(1)
  }
}

// Run the migration
runAchievementsSchema()
